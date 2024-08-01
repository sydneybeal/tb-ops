# Copyright 2024 SH

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Seeds database with clients and reservations."""

import csv
from datetime import datetime, timedelta, date
import profile
from uuid import uuid4, UUID
from faker import Faker
from random import randint, uniform, choice

from api.services.clients.service import ClientService
from api.services.clients.models import Client
from api.services.reservations.service import ReservationService
from api.services.reservations.models import Reservation

from pydantic import ValidationError
from typing import Sequence

import asyncio


class ClientImporter:

    def __init__(self):
        """Initializes the service instances for interactions."""
        self._client_service = ClientService()
        self._reservation_service = ReservationService()
        self.fake = Faker()
        self.raw_data = {
            "profile_info": self.read_csv("clients", "profileinfo"),
            "traveler_info": self.read_csv("clients", "travelerinfo"),
        }

    def parse_date(self, date_str):
        """Converts mixed date formats."""
        if not date_str or date_str.strip() == "":
            return None

        # List of possible date formats
        date_formats = [
            "%B %d, %Y",  # 'September 29, 1948'
            "%Y",  # '2007'
            # Add more formats here if necessary
        ]

        for date_format in date_formats:
            try:
                # Attempt to parse the date with the current format
                return datetime.strptime(date_str, date_format).date()
            except ValueError:
                # If the format does not match, try the next one
                continue

        # If none of the formats match, return None or raise an error
        return None

    def match_names(self, name_1, name_2, middle_name) -> bool:
        name_1 = name_1.lower().strip()
        name_2 = name_2.lower().strip()
        middle_name = middle_name.lower().strip().split(" ")[0]
        name_variations = {
            "heidi": "hillary",
            "betty": "elizabeth",
            "dave": "david",
            "harold": "richard",
            "tom": "thomas",  # 4312
            "evangela": "angela",
            "ken": "kenneth",
            "kimberley": "kim",
            "mike": "michael",  # 4322
            "kimberly": "kim",
            "fred": "frederick",
            "fredrick": "fred",
            "tammy": "tamara",
            "katherine": "kathy",
            "louis": "lou",
            "robert": "bob",
            "judy": "judith",
            "curtis": "curt",
            "samantha": "mandy",
            "debra": "debbie",
            "deb": "debra",
            "stephen": "steve",
            "sandy": "sandra",  # 4347
            "dominic": "nick",
            "joe": "joseph",
            "jim": "james",
            "jeff": "jeffrey",  # 4368
            "jan": "janet",
        }
        if name_1 == name_2 or name_1 == middle_name or name_2 == middle_name:
            return True

        # Check variations for both primary names
        if (
            name_variations.get(name_1) == name_2
            or name_variations.get(name_2) == name_1
        ):
            return True

        # Check variations involving middle name
        if (
            name_variations.get(name_1) == middle_name
            or name_variations.get(name_2) == middle_name
            or name_variations.get(middle_name) in [name_1, name_2]
        ):
            return True

        return False

    def find_traveler_match(self, profile: dict, travelers: list[dict]):
        traveler_match = None
        profile_no = profile.get("PROFILE.Profile No", "")
        first_name = profile.get("PROFILE.First Name", "")
        traveler_matches = [
            traveler
            for traveler in travelers
            if traveler.get("PROFILE.Profile No") == profile_no
        ]
        # found exactly one traveler
        if len(traveler_matches) == 1:
            return traveler_matches[0]
        # found no travelers by profile number
        elif len(traveler_matches) == 0:
            print(
                f"Profile {profile.get('PROFILE.Name')} did not find a traveler match."
            )
        # found more than 1 traveler
        else:
            # find traveler matches who are Primary relationship
            primary_matches = [
                m
                for m in traveler_matches
                if m.get("PROFILE TRAVELER/CONTACT.Relationship") == "Primary"
            ]
            if len(primary_matches) == 1:
                return primary_matches[0]
            elif len(primary_matches) == 0:
                # print(
                #     f"Profile {profile.get('PROFILE.Name')} did not find a PRIMARY traveler match."
                # )
                # take away the primary filter and just use name
                name_matches = [
                    m
                    for m in traveler_matches
                    if (
                        m.get("PROFILE.First Name", "").strip() == first_name.strip()
                        and (
                            self.match_names(
                                m.get("PROFILE.First Name"),
                                m.get("TRAVELER/CONTACT.First Name"),
                                m.get("TRAVELER/CONTACT.Middle Name"),
                            )
                        )
                    )
                ]
                if len(name_matches) == 1:
                    return name_matches[0]
                elif len(name_matches) == 0:
                    print(
                        f"Profile {profile.get('PROFILE.Name')} did not find a PRIMARY or NAME traveler match."
                    )
                else:
                    # print(
                    #     f"Profile {profile.get('PROFILE.Name')} found multiple NAME traveler matches."
                    # )
                    pass
            else:
                # search with profile name of the traveler matching on traveler name & profile name
                primary_name_matches = [
                    m
                    for m in primary_matches
                    if (
                        m.get("PROFILE.First Name", "") == first_name
                        and (
                            m.get("TRAVELER/CONTACT.First Name", "")[:2]
                            == m.get("PROFILE.First Name", "")[:2]
                        )
                    )
                ]
                if len(primary_name_matches) == 1:
                    return primary_name_matches[0]
                if len(primary_name_matches) != 1:
                    most_complete_profile = None
                    max_filled_fields = 0

                    for match in primary_name_matches:
                        filled_fields_count = sum(
                            1 for k, v in match.items() if v.strip()
                        )

                        if filled_fields_count > max_filled_fields:
                            max_filled_fields = filled_fields_count
                            most_complete_profile = match

                    if most_complete_profile:
                        print(
                            f"Using most complete profile {most_complete_profile.get('TRAVELER/CONTACT.First Name')}"
                        )
                        return most_complete_profile

        return traveler_match

    async def seed_clientbase_export_clients(self):
        print("Seeding clients from ClientBase export file...")
        records_to_add = []
        # contains 4634 profiles with 4634 profile numbers, all unique
        profiles = self.raw_data["profile_info"]
        # contains 34k travelers each mapping to 4634 profiles
        travelers = self.raw_data["traveler_info"]
        matches = 0
        for row in profiles:
            traveler_data = self.find_traveler_match(row, travelers)
            if traveler_data:
                matches += 1

        print(f"{matches} with exactly 1 match out of {len(profiles)}")
        # profile_no = row.get("PROFILE.Profile No", "")
        # first_name = row.get("PROFILE.First Name", "")
        # traveler_matches = [
        #     traveler
        #     for traveler in travelers
        #     if traveler.get("PROFILE.Profile No") == profile_no
        # ]

        # if len(traveler_matches) > 1:
        #     primary_matches = [
        #         m
        #         for m in traveler_matches
        #         if m.get("PROFILE TRAVELER/CONTACT.Relationship") == "Primary"
        #     ]
        #     if len(primary_matches) > 1:
        #         # search with profile name of the traveler matching on traveler name & profile name
        #         name_matches = [
        #             m
        #             for m in primary_matches
        #             if (
        #                 m.get("PROFILE.First Name", "") == first_name
        #                 and (
        #                     m.get("TRAVELER/CONTACT.First Name", "")[:2]
        #                     == m.get("PROFILE.First Name", "")[:2]
        #                 )
        #             )
        #         ]
        #         if len(name_matches) != 1:
        #             most_complete_profile = None
        #             max_filled_fields = 0

        #             for match in primary_matches:
        #                 filled_fields_count = sum(
        #                     1 for k, v in match.items() if v.strip()
        #                 )

        #                 if filled_fields_count > max_filled_fields:
        #                     max_filled_fields = filled_fields_count
        #                     most_complete_profile = match

        #             if most_complete_profile:
        #                 print(
        #                     f"Using most complete profile {most_complete_profile.get('TRAVELER/CONTACT.First Name')}"
        #                 )
        #                 one_match += 1
        #         else:
        #             one_match += 1
        #     else:
        #         one_match += 1

        # elif len(traveler_matches) == 0:
        #     print(
        #         f"Profile {row.get('PROFILE.Name')} did not find a traveler match."
        #     )
        # if len(traveler_matches) == 1:
        #     # print(
        #     #     f"Profile {row.get('PROFILE.Name')} found exactly 1 traveler match."
        #     # )
        #     one_match += 1

        # birthday_str = row.get("TRAVELER/CONTACT.Birthday")
        # birth_date = self.parse_date(birthday_str)
        # if not row.get("PROFILE.Interface ID"):
        #     print(f"{row.get('TRAVELER/CONTACT.Name')}: InterfaceID is none")
        # else:
        #     print(row.get("PROFILE.Interface ID"))
        # if not row.get("PROFILE.Unique ID"):
        #     print(f"{row.get('TRAVELER/CONTACT.Name')}: UniqueID is none")

        # try:
        #     client = Client(
        #         first_name=row.get("TRAVELER/CONTACT.First Name", ""),
        #         last_name=row.get("TRAVELER/CONTACT.Last Name", ""),
        #         middle_name=row.get("TRAVELER/CONTACT.Middle Name"),
        #         address_line_1=row.get("TRAVELER/CONTACTADDRTABLE.Address Line 1"),
        #         address_line_2=row.get("TRAVELER/CONTACTADDRTABLE.Address Line 2"),
        #         address_apt_suite=row.get("TRAVELER/CONTACTADDRTABLE.Apt/Suite"),
        #         address_city=row.get("TRAVELER/CONTACTADDRTABLE.City"),
        #         address_state=row.get("TRAVELER/CONTACTADDRTABLE.State"),
        #         address_zip=row.get("TRAVELER/CONTACTADDRTABLE.Zip Code"),
        #         address_country=row.get("TRAVELER/CONTACTADDRTABLE.Country"),
        #         cb_name=row.get("TRAVELER/CONTACT.Name"),
        #         cb_interface_id=row.get("PROFILE.Interface ID"),
        #         cb_profile_no=None,
        #         cb_relationship=row.get("PROFILE TRAVELER/CONTACT.Relationship"),
        #         cb_active=row.get("PROFILE.Active"),
        #         cb_passport_expire=row.get("TRAVELER/CONTACT.Passport Expire"),
        #         cb_gender=row.get("TRAVELER/CONTACT.Gender"),
        #         subjective_score=randint(1, 100),
        #         birth_date=birth_date,
        #         referred_by_id=None,
        #         created_at=datetime.now(),
        #         updated_at=datetime.now(),
        #         updated_by="admin@travelbeyond.com",
        #     )
        # except ValidationError as e:
        #     print(e)
        #     print(row)
        #     return
        #     records_to_add.append(client)
        # await self._client_service.add(records_to_add)
        # print(records_to_add)

    async def seed_clientbase_profile_numbers(self, clients: Sequence[Client]):
        print("Seeding client profile numbers from ClientBase export file...")

    def read_csv(self, genre, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        encoding = "utf-8" if "blah" in file_name else "utf-8-sig"
        line_number = 0
        last_row = ""
        try:
            with open(
                f"/Users/sydney-horan/tb-ops/seed/{genre}/{file_name}.csv",
                encoding=encoding,
            ) as csv_file:
                reader = csv.DictReader(csv_file)
                for row in reader:
                    line_number += 1  # Increment line counter
                    last_row = row
                    if None in row.keys():
                        row.pop(None, None)
                    data.append(row)
        except UnicodeDecodeError as e:
            print(f"Error decoding file {file_name}.csv at line {line_number}: {e}")
            print(f"Last row: {last_row}")
            # Optionally, return data collected so far or handle the error differently
            raise
        return data

    async def get_existing_clients(self):
        return await self._client_service.get()

    async def seed_clients_and_reservations(self):

        existing_clients = await self.get_existing_clients()
        existing_client_ids = [client.id for client in existing_clients]
        print(f"{len(existing_clients)} clients found in repository")
        await self.seed_clientbase_export_clients()

        existing_clients = await self.get_existing_clients()
        existing_client_ids = [client.id for client in existing_clients]
        print(f"{len(existing_client_ids)} clients found in repository")
        # await self.seed_reservations(len(existing_client_ids) * 3, existing_client_ids)


if __name__ == "__main__":
    client_importer = ClientImporter()
    asyncio.run(client_importer.seed_clients_and_reservations())

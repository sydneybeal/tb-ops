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
            "profile_data": self.read_csv("clients", "combined_traveler_profile"),
            "rescard_data": self.read_csv("clients", "rescard_with_profile_no"),
            "activity_data": self.read_csv("clients", "activities"),
        }

    def parse_date(self, date_str):
        """Converts mixed date formats."""
        if not date_str or date_str.strip() == "":
            return None

        # List of possible date formats
        date_formats = [
            "%B %d, %Y",  # 'September 29, 1948'
            "%B %d %Y",
            "%Y",  # '2007'
            "%m/%d/%Y",
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

    async def seed_clientbase_export_clients(self):
        print("Seeding clients from ClientBase export file...")
        records_to_add = []
        profiles = self.raw_data["profile_data"]
        for row in profiles:
            if row.get("PROFILE TRAVELER/CONTACT.Relationship", "") == "Primary" or (
                row.get("TRAVELER/CONTACT.Name") == row.get("PROFILE.Primary Traveler")
            ):
                birthday_str = row.get("TRAVELER/CONTACT.Birthday")
                birth_date = self.parse_date(birthday_str)
                created_str = row.get("PROFILE.Creation Date")
                created_date = self.parse_date(created_str)
                try:
                    client = Client(
                        first_name=row.get(
                            "PROFILE.First Name", row.get("TRAVELER/CONTACT.First Name")
                        ),
                        last_name=row.get(
                            "PROFILE.Last Name", row.get("TRAVELER/CONTACT.Middle Name")
                        ),
                        middle_name=row.get(
                            "PROFILE.Middle Name",
                            row.get("TRAVELER/CONTACT.Middle Name"),
                        ),
                        address_line_1=row.get("PRIMARYADDRTABLE.Address Line 1"),
                        address_line_2=row.get("PRIMARYADDRTABLE.Address Line 2"),
                        address_apt_suite=row.get("PRIMARYADDRTABLE.Apt/Suite"),
                        address_city=row.get("PRIMARYADDRTABLE.City"),
                        address_state=row.get("PRIMARYADDRTABLE.State"),
                        address_zip=row.get("PRIMARYADDRTABLE.Zip Code"),
                        address_country=row.get("PRIMARYADDRTABLE.Country"),
                        cb_name=row.get("PROFILE.Name"),
                        cb_interface_id=row.get("PROFILE.Interface ID"),
                        cb_profile_no=row.get("PROFILE.Profile No"),
                        # TODO cb_notes in a future CSV (corrupted af)
                        cb_profile_type=row.get("PROFILE.Profile Type"),
                        # TODO remove courtesy_title/cb_salutation or add it in later
                        cb_primary_agent_name=row.get("PROFILE.Primary Agent"),
                        cb_issue_country=row.get(
                            "TRAVELER/CONTACT.Passport Issuing Country"
                        ),
                        cb_relationship=row.get(
                            "PROFILE TRAVELER/CONTACT.Relationship"
                        ),
                        cb_active=row.get("PROFILE.Active"),
                        cb_passport_expire=row.get("TRAVELER/CONTACT.Passport Expire"),
                        cb_gender=row.get("TRAVELER/CONTACT.Gender"),
                        cb_created_date=created_date,
                        # TODO get cb_modified_date in a future CSV
                        cb_referred_by=row.get("PROFILE.Referred By"),
                        birth_date=birth_date,
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                        updated_by="admin@travelbeyond.com",
                    )
                except ValidationError as e:
                    print(e)
                    print(row)
                print(client.first_name)
                records_to_add.append(client)
        print(f"{len(records_to_add)} primaries out of of {len(profiles)} profiles")
        await self._client_service.add(records_to_add)

    async def seed_clientbase_export_rescards(self, clients: Sequence[Client]):
        print("Seeding rescards from ClientBase export file...")
        records_to_add = []
        rescards = self.raw_data["rescard_data"]
        unique_rescards = {tuple(sorted(d.items())) for d in rescards}
        unique_rescards = [dict(t) for t in unique_rescards]
        print(f"Number of unique rescards: {len(unique_rescards)}")
        for row in unique_rescards:
            client = next(
                (
                    c
                    for c in clients
                    if c.cb_profile_no == row.get("PROFILE.Profile No")
                ),
                None,
            )

            if client:
                res = Reservation(
                    id=uuid4(),
                    client_id=client.id,
                    trip_name=row.get("RESCARD.Trip Name"),
                    # TODO how to get num_pax and core_destination_id...
                    cost=row.get("RESCARD.Res Total"),
                    start_date=self.parse_date(row.get("RESCARD.Trip Start Date")),
                    end_date=self.parse_date(row.get("RESCARD.Trip End Date")),
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    updated_by="admin@travelbeyond.com",
                )
                records_to_add.append(res)
        print(f"Found clients for {len(records_to_add)} trips")
        await self._reservation_service.add(records_to_add)

    def get_referral_from_field(self, referred_by: str | None):
        ignore_referred_by = [
            "Client",
            "Referral from happy customer",
            "R. & L. Bahnson",
            "Internet",
            "Wilderness Safaris",
            "Suzanne Zapolski",
            "Audrey",
            "Craig",
            "Matt Bracken",
            "Walk-In",
            "Trip Advisor",
            "ITN",
            "Kelly RItter",
            "Newspaper story",
        ]
        if referred_by and referred_by not in ignore_referred_by:
            return referred_by

    def match_names(self, name_1, name_2, middle_name) -> bool:
        name_1 = name_1.lower().strip()
        name_2 = name_2.lower().strip()
        middle_name = middle_name.lower().strip().split(" ")[0]
        name_variations = {
            "heidi": "hillary",
            "betty": "elizabeth",
            "dave": "david",
            "harold": "richard",
            "tom": "thomas",
            "evangela": "angela",
            "ken": "kenneth",
            "kimberley": "kim",
            "mike": "michael",
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
            "sandy": "sandra",
            "dominic": "nick",
            "joe": "joseph",
            "jim": "james",
            "jeff": "jeffrey",
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

    async def seed_cb_referrred_by(self, clients: Sequence[Client]):
        print("Seeding Referred By field from Clientbase export")
        referred_by_completed = 0
        for client in clients:
            referred_by_cb = self.get_referral_from_field(client.cb_referred_by)
            if referred_by_cb:
                print(referred_by_cb)
                referred_by_completed += 1
                # TODO: match free-typed name to client ID
                # TODO: add referred_by_id to client object and upsert

        print(f"{referred_by_completed} referrals filled in out of {len(clients)}")

    async def seed_cb_activity_referrals(self, clients: Sequence[Client]):
        print("Seeding activity referrals from Clientbase export")
        activities = self.raw_data["activity_data"]
        referral_count = 0
        referrals_matched_count = 0
        for activity in activities:
            activity_body = activity.get("Subject  (ACTIVITY)", "").lower()
            referring_client = next(
                (
                    c
                    for c in clients
                    if c.cb_profile_no == activity.get("Profile No  (PROFILE)")
                ),
                None,
            )
            # TODO remove referring_client from clients_effective bc their name might be mentioned
            if referring_client:
                referral_count += 1
                # print(f"+1 referral for {client.cb_name}")
                # TODO parse string from activity.get("Subject  (ACTIVITY)")

                referred_client = next(
                    (
                        c
                        for c in clients
                        if (
                            (
                                c.first_name.strip().lower() in activity_body
                                and c.last_name.strip().lower() in activity_body
                            )
                            or (c.cb_name in activity_body)
                        )
                    ),
                    None,
                )
                if referred_client:
                    print(
                        f"{referring_client.cb_name} referred {referred_client.cb_name}"
                    )
                    print(f"according to activity: {activity_body}")
                    referrals_matched_count += 1

        print(
            f"{referral_count} valid referrals out of {len(activities)} ({referrals_matched_count} matched to referred client)"
        )

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
        await self.seed_clientbase_export_rescards(existing_clients)
        # await self.seed_cb_referrred_by(existing_clients)
        await self.seed_cb_activity_referrals(existing_clients)
        # await self.seed_reservations(len(existing_client_ids) * 3, existing_client_ids)


if __name__ == "__main__":
    client_importer = ClientImporter()
    asyncio.run(client_importer.seed_clients_and_reservations())

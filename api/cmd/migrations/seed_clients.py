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
            "clients": self.read_csv("clients", "20k list"),
            "client_profile_nums": self.read_csv("clients", "profiles 20k+"),
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

    async def seed_clientbase_export_clients(self):
        print("Seeding clients from ClientBase export file...")
        records_to_add = []
        for row in self.raw_data["clients"]:
            birthday_str = row.get("TRAVELER/CONTACT.Birthday")
            birth_date = self.parse_date(birthday_str)
            if not row.get("PROFILE.Interface ID"):
                print(f"{row.get('TRAVELER/CONTACT.Name')}: InterfaceID is none")
            try:
                client = Client(
                    first_name=row.get("TRAVELER/CONTACT.First Name", ""),
                    last_name=row.get("TRAVELER/CONTACT.Last Name", ""),
                    middle_name=row.get("TRAVELER/CONTACT.Middle Name"),
                    address_line_1=row.get("TRAVELER/CONTACTADDRTABLE.Address Line 1"),
                    address_line_2=row.get("TRAVELER/CONTACTADDRTABLE.Address Line 2"),
                    address_apt_suite=row.get("TRAVELER/CONTACTADDRTABLE.Apt/Suite"),
                    address_city=row.get("TRAVELER/CONTACTADDRTABLE.City"),
                    address_state=row.get("TRAVELER/CONTACTADDRTABLE.State"),
                    address_zip=row.get("TRAVELER/CONTACTADDRTABLE.Zip Code"),
                    address_country=row.get("TRAVELER/CONTACTADDRTABLE.Country"),
                    cb_name=row.get("TRAVELER/CONTACT.Name"),
                    cb_interface_id=row.get("PROFILE.Interface ID"),
                    cb_profile_no=None,
                    cb_relationship=row.get("PROFILE TRAVELER/CONTACT.Relationship"),
                    cb_active=row.get("PROFILE.Active"),
                    cb_passport_expire=row.get("TRAVELER/CONTACT.Passport Expire"),
                    cb_gender=row.get("TRAVELER/CONTACT.Gender"),
                    subjective_score=randint(1, 100),
                    birth_date=birth_date,
                    referred_by_id=None,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    updated_by="admin@travelbeyond.com",
                )
            except ValidationError as e:
                print(e)
                print(row)
                return
            records_to_add.append(client)
        await self._client_service.add(records_to_add)
        # print(records_to_add)

    async def seed_clientbase_profile_numbers(self, clients: Sequence[Client]):
        print("Seeding client profile numbers from ClientBase export file...")
        profile_nums = self.raw_data["client_profile_nums"]

        for profile_num_detail in profile_nums:
            first_name = profile_num_detail["PROFILE.First Name"]
            last_name = profile_num_detail["PROFILE.Last Name"]
            interface_id = profile_num_detail["PROFILE.Interface ID"]
            cb_profile_no = profile_num_detail["PROFILE.Profile No"]
            cb_created_date = profile_num_detail["PROFILE.Creation Date"]
            cb_modified_date = profile_num_detail["PROFILE.Modified Date"]
            cb_referred_by = profile_num_detail["PROFILE.Creation Date"]

            # Filter matching profiles from raw data
            matches = [
                client
                for client in clients
                if client.last_name == last_name
                and client.first_name[:2].lower() == first_name[:2].lower()
                and client.cb_interface_id == interface_id
            ]

            # Handling different cases based on the number of matches found
            if len(matches) == 1:
                # Update the client's details if exactly one match is found
                client = matches[0]
                client.cb_profile_no = cb_profile_no
                client.cb_created_date = cb_created_date
                client.cb_modified_date = cb_modified_date
                client.cb_referred_by = cb_referred_by
                # print(
                #     f"Match found: {client.first_name} {client.last_name} now has profile number {client.cb_profile_no}"
                # )
            elif len(matches) > 1:
                # Print details and handle multiple matches
                print(
                    f"Multiple matches found for {first_name} {last_name} with ID {interface_id}:"
                )
                primary_matches = [m for m in matches if m.cb_relationship == "Primary"]
                if len(primary_matches) == 1:
                    # Update the client's details if there is exactly one primary match
                    client = primary_matches[0]
                    client.cb_profile_no = cb_profile_no
                    client.cb_created_date = cb_created_date
                    client.cb_modified_date = cb_modified_date
                    client.cb_referred_by = cb_referred_by
                    print(
                        f"Primary match used for update: {client.first_name} {client.last_name}"
                    )
                else:
                    for i, match in enumerate(matches, start=1):
                        print(
                            f"Option {i}: Profile Number {cb_profile_no} {match.last_name}/{match.first_name} "
                            f"({match.cb_relationship}), DOB {match.birth_date.strftime('%Y-%m-%d') if match.birth_date else 'Unknown'}"
                        )

                    # Prompt the user to select an option or decline
                    response = input(
                        "Select an option number to update the record or type 'no' to skip: "
                    )
                    if response.lower() == "no":
                        print("No action taken, skipping...")
                        return  # Exit the function if the user declines to make a selection
                    else:
                        try:
                            # Convert the response to an integer and get the selected match
                            selected_index = int(response) - 1
                            if 0 <= selected_index < len(matches):
                                selected_match = matches[selected_index]
                                # Set the client's details based on the selected match
                                selected_match.cb_profile_no = cb_profile_no
                                selected_match.cb_created_date = cb_created_date
                                selected_match.cb_modified_date = cb_modified_date
                                selected_match.cb_referred_by = cb_referred_by
                                print(
                                    f"Updated record for {selected_match.first_name} {selected_match.last_name}."
                                )
                            else:
                                print("Invalid option, no action taken.")
                        except ValueError:
                            print("Invalid input, expected a number. No action taken.")
            else:
                # Print a message if no matches are found
                print(
                    f"Could not find match for {last_name}/{first_name} with {interface_id}"
                )

        # join `profile_num` with `clients` on matching criteria to get `PROFILE.Profile No`
        ## clients.`first_name` = profile_num.`PROFILE.First Name`
        ## clients.`last_name` = profile_num.`PROFILE.Last Name`
        ## clients.`cb_interface_id` = profile_num.`PROFILE.Interface ID`

        # if 1 match, continue
        # if > 1 match print the matches and return
        # if 0 matches print "could not find match for {last_name}/{first_name} with {cb_interface_id}"

        # enhance the Client records with the following from `profile_num`:
        # get `cb_profile_no` from `PROFILE.Profile No`
        # get `cb_created_date` from `PROFILE.Creation Date`
        # get `cb_modified_date` from `PROFILE.Modified Date`
        # get `cb_referred_by` from `PROFILE.Referred By`

    def read_csv(self, genre, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        encoding = "utf-8" if "20k+" in file_name else "utf-8-sig"
        with open(
            f"/Users/sydney-horan/tb-ops/seed/{genre}/{file_name}.csv",
            encoding=encoding,
        ) as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                if None in row.keys():
                    row.pop(None, None)
                data.append(row)
        return data

    async def seed_mock_clients(self, num: int, existing_client_ids: list[UUID]):
        print("Seeding mock clients...")
        clients_to_insert = []
        client_ids = existing_client_ids
        # generate sample data for `num` number of clients
        for i in range(num):
            client_id = uuid4()
            # Store the new client's UUID
            client_ids.append(client_id)

            referred_by_id = None
            # Only assign referred_by_id after the first client and randomly
            if i > 0 and randint(0, 10) > 5:
                # Pick a random UUID from previously added clients
                referred_by_id = choice(client_ids[:-1])

            sample_client = {
                "id": client_id,
                "first_name": self.fake.first_name(),
                "last_name": self.fake.last_name(),
                "address_line_1": self.fake.street_address(),
                "address_line_2": (
                    self.fake.secondary_address() if randint(0, 1) else None
                ),
                "address_city": self.fake.city(),
                "address_state": self.fake.state_abbr(
                    include_territories=False, include_freely_associated_states=False
                ),
                "address_zip": self.fake.zipcode(),
                "subjective_score": randint(1, 100),
                "birth_date": self.fake.date_of_birth(minimum_age=28, maximum_age=90),
                "referred_by_id": referred_by_id,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "updated_by": "admin@travelbeyond.com",
            }
            clients_to_insert.append(Client(**sample_client))
        # for record in clients_to_insert:
        #     print(record)
        #     print("\n")
        await self._client_service.add(clients_to_insert)
        return client_ids

    async def seed_reservations(self, num: int, client_ids: list[UUID]):
        print("Seeding reservations...")
        reservations_to_insert = []
        # generate sample data for `num` number of reservations
        for i in range(num):
            start_date = self.fake.date_between(
                start_date=date(2017, 1, 1), end_date=date(2026, 12, 31)
            )
            num_pax = 2 if randint(1, 10) > 5 else randint(1, 12)
            sample_res = {
                "id": uuid4(),
                "client_id": choice(client_ids),
                "num_pax": num_pax,
                "core_destination_id": UUID("6f7d832c-63e8-46f8-ba01-cb6b9ac01c6e"),
                # Multiplies the number of pax by a random value between 10,000 and 30,000
                "cost": num_pax * randint(10000, 30000),
                "start_date": start_date,
                "end_date": start_date + timedelta(days=randint(7, 20)),
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "updated_by": "admin@travelbeyond.com",
            }
            reservations_to_insert.append(Reservation(**sample_res))
        # for record in reservations_to_insert:
        #     print(record)
        #     print("\n")
        await self._reservation_service.add(reservations_to_insert)

    async def get_existing_clients(self):
        return await self._client_service.get()

    async def seed_clients_and_reservations(self):

        existing_clients = await self.get_existing_clients()
        existing_client_ids = [client.id for client in existing_clients]
        print(f"{len(existing_clients)} clients found in repository")
        # await self.seed_mock_clients(100, existing_client_ids)
        # await self.seed_clientbase_export_clients()
        # existing_clients = await self.get_existing_clients()
        await self.seed_clientbase_profile_numbers(existing_clients)

        existing_clients = await self.get_existing_clients()
        existing_client_ids = [client.id for client in existing_clients]
        print(f"{len(existing_client_ids)} clients found in repository")
        # await self.seed_reservations(len(existing_client_ids) * 3, existing_client_ids)


if __name__ == "__main__":
    client_importer = ClientImporter()
    asyncio.run(client_importer.seed_clients_and_reservations())

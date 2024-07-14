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

import asyncio


class ClientImporter:

    def __init__(self):
        """Initializes the service instances for interactions."""
        self._client_service = ClientService()
        self._reservation_service = ReservationService()
        self.fake = Faker()

    async def seed_clients(self, num: int, existing_client_ids: list[UUID]):
        print("Seeding clients...")
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
                "birth_date": self.fake.date_of_birth(minimum_age=18, maximum_age=70),
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
                "cost": num_pax
                * randint(
                    10000, 30000
                ),  # Multiplies the number of pax by a random value between 10,000 and 30,000
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
        existing_clients = await self._client_service.get()
        return [client.id for client in existing_clients]

    async def seed_clients_and_reservations(self):

        existing_client_ids = await self.get_existing_clients()
        print(f"{len(existing_client_ids)} clients found in repository")
        await self.seed_clients(100, existing_client_ids)

        existing_client_ids = await self.get_existing_clients()
        print(f"{len(existing_client_ids)} clients found in repository")
        await self.seed_reservations(len(existing_client_ids) * 3, existing_client_ids)


if __name__ == "__main__":
    client_importer = ClientImporter()
    asyncio.run(client_importer.seed_clients_and_reservations())

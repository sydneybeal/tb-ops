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
from sys import displayhook
from uuid import uuid4, UUID

from api.services.clients.service import ClientService
from api.services.clients.models import ClientSummary, Client

# from api.services.reservations.service import ReservationService
# from api.services.reservations.models import Reservation

# from pydantic import ValidationError
from typing import Sequence

import asyncio


class MarketingSourceSeeder:

    def __init__(self):
        """Initializes the service instances for interactions."""
        self._client_service = ClientService()
        self.raw_data = {
            "marketing_codes": self.read_csv("clients", "rescard_marketing_code"),
        }

    def read_csv(self, genre, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        encoding = "utf-8"  # if "blah" in file_name else "utf-8-sig"
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

    async def get_existing_clients(self) -> Sequence[ClientSummary]:
        return await self._client_service.get_summaries()

    def find_client_match(
        self, profile_no: str, existing_clients: Sequence[ClientSummary]
    ):
        # print(f"Searching for client with profile no {profile_no}")
        traveler_matches = [
            traveler
            for traveler in existing_clients
            if traveler.cb_profile_no == profile_no
        ]
        # found exactly one traveler
        if len(traveler_matches) == 1:
            return traveler_matches[0]
        elif len(traveler_matches) > 1:
            print(f"Found {len(traveler_matches)} clients for reservation")

    async def seed_marketing_codes(self):
        existing_clients = await self.get_existing_clients()
        marketing_codes = self.raw_data["marketing_codes"]
        print(existing_clients[0])
        print(marketing_codes[0])
        client_marketing_codes = {}
        for client in existing_clients:
            client_marketing_codes[client.id] = {
                "display_name": client.display_name,
                "cb_marketing_sources": set(),
            }
        for res in marketing_codes:
            profile_no = res["Profile No  (PROFILE)"]
            marketing_code = res["Marketing Source  (RESCARD)"]
            if marketing_code and marketing_code not in ["Repeat on their own", "FAM"]:
                client_match = self.find_client_match(profile_no, existing_clients)
                if client_match:
                    client_marketing_codes[client_match.id]["cb_marketing_sources"].add(
                        marketing_code
                    )
        clients_to_upsert = []
        for client_id, client_info in client_marketing_codes.items():
            if len(client_info["cb_marketing_sources"]) > 0:
                og_client = await self._client_service.get_by_id(client_id)
                if og_client:
                    og_client.cb_marketing_sources = list(
                        client_info["cb_marketing_sources"]
                    )
                    clients_to_upsert.append(og_client)
        for client in clients_to_upsert:
            print(
                f"{client.last_name}/{client.first_name} has marketing codes {client.cb_marketing_sources}"
            )

        print(
            f"Updating {len(clients_to_upsert)} clients with referral codes in database"
        )
        # await self._client_service.add(clients_to_upsert)


if __name__ == "__main__":
    client_importer = MarketingSourceSeeder()
    asyncio.run(client_importer.seed_marketing_codes())

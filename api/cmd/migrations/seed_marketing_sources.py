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
import json
from datetime import datetime, timedelta, date
from textwrap import dedent
from typing import Iterable, Sequence, Optional, Tuple
from sys import displayhook
from uuid import uuid4, UUID

from api.adapters.repository import PostgresMixin
from api.services.clients.service import ClientService
from api.services.clients.models import ClientSummary, Client
from api.services.clients.repository import ClientRepository
from api.services.clients.models import Client

# from api.services.reservations.service import ReservationService
# from api.services.reservations.models import Reservation

# from pydantic import ValidationError
from typing import Sequence

import asyncio


class PostgresMarketingRepository(PostgresMixin):

    async def upsert_marketing_sources(
        self, clients: Sequence[Client]
    ) -> list[Tuple[UUID, bool]]:
        """Bulk updates an iterable of Client models in the repository with marketing sources."""
        pool = await self._get_pool()
        query = dedent(
            """
            UPDATE public.clients
            SET
                cb_marketing_sources = $2,
                updated_at = $3,
                updated_by = $4
            WHERE id = $1
            RETURNING id;
            """
        )
        results = []
        async with pool.acquire() as con:
            async with con.transaction():
                # Prepare data for update
                params = [
                    (
                        client.id,
                        client.cb_marketing_sources,
                        client.updated_at,
                        client.updated_by,
                    )
                    for client in clients
                ]

                # Execute the updates
                for param in params:
                    row = await con.fetchrow(query, *param)
                    if row:
                        results.append(row["id"])

        print(f"Updated {len(results)} clients.")
        return results

        # pool = await self._get_pool()
        # query = dedent(
        #     """
        #     INSERT INTO public.clients (
        #         id, cb_marketing_sources, updated_at, updated_by
        #     )
        #     SELECT
        #         data.id,
        #         data.cb_marketing_sources,
        #         data.updated_at,
        #         data.updated_by
        #     FROM UNNEST(
        #         $1::uuid[],
        #         $2::text[][],
        #         $3::timestamptz[],
        #         $4::text[]
        #     ) AS data(id, cb_marketing_sources, updated_at, updated_by)
        #     ON CONFLICT (id) DO UPDATE SET
        #         cb_marketing_sources = EXCLUDED.cb_marketing_sources,
        #         updated_at = EXCLUDED.updated_at,
        #         updated_by = EXCLUDED.updated_by
        #     RETURNING id, (xmax = 0) AS was_inserted;
        #     """
        # )
        # results = []
        # async with pool.acquire() as con:

        #     async with con.transaction():
        #         # Prepare data for bulk insert
        #         ids = [client.id for client in clients]
        #         cb_marketing_sources = [
        #             client.cb_marketing_sources for client in clients
        #         ]
        #         # print(cb_marketing_sources)
        #         updated_ats = [client.updated_at for client in clients]
        #         updated_bys = [client.updated_by for client in clients]

        #         # Execute the bulk upsert query
        #         rows = await con.fetch(
        #             query, ids, cb_marketing_sources, updated_ats, updated_bys
        #         )
        #         for row in rows:
        #             # Append log ID and whether it was an insert (True) or an update (False)
        #             results.append((row["id"], row["was_inserted"]))

        # # Initialize counters
        # inserted_count = 0
        # updated_count = 0

        # # Process the results to count inserts and updates
        # for _, was_inserted in results:
        #     if was_inserted:
        #         inserted_count += 1
        #     else:
        #         updated_count += 1

        # print(f"Processed {len(results)} upsert operation(s).")
        # print(f"Inserted {inserted_count} new client(s).")
        # print(f"Updated {updated_count} existing client(s).")
        # return results


class MarketingSourceSeeder:

    def __init__(self):
        """Initializes the service instances for interactions."""
        self._client_service = ClientService()
        self._repo = PostgresMarketingRepository()
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
                "cb_marketing_sources": [],
            }

        # Ensure marketing codes are unique per client
        for res in marketing_codes:
            profile_no = res["Profile No  (PROFILE)"]
            marketing_code = res["Marketing Source  (RESCARD)"]
            if marketing_code and marketing_code not in ["Repeat on their own", "FAM"]:
                client_match = self.find_client_match(profile_no, existing_clients)
                if client_match:
                    # Append only unique marketing codes
                    if (
                        str(marketing_code)
                        not in client_marketing_codes[client_match.id][
                            "cb_marketing_sources"
                        ]
                    ):
                        client_marketing_codes[client_match.id][
                            "cb_marketing_sources"
                        ].append(str(marketing_code))

        clients_to_upsert = []
        i = 0
        # Fetch all client summaries upfront
        all_clients = await self._client_service.get_summaries()
        client_summary_map = {client.id: client for client in all_clients}

        for client_id, client_info in client_marketing_codes.items():
            if len(client_info["cb_marketing_sources"]) > 0:
                og_client = client_summary_map.get(client_id)
                if og_client:
                    i += 1
                    print(
                        f"Working on {i} out of {len(client_marketing_codes)} clients"
                    )
                    # Ensure cb_marketing_sources is formatted as a list
                    og_client.cb_marketing_sources = client_info["cb_marketing_sources"]
                    clients_to_upsert.append(og_client)

        cb_marketing_sources = [
            type(client.cb_marketing_sources) for client in clients_to_upsert
        ]
        print(cb_marketing_sources)

        for client in clients_to_upsert:
            print(
                f"{client.last_name}/{client.first_name} has marketing codes {client.cb_marketing_sources}"
            )

        print(
            f"Updating {len(clients_to_upsert)} clients with referral codes in database"
        )

        await self._repo.upsert_marketing_sources(clients_to_upsert)

        # await self._repo.upsert_marketing_sources(clients_to_upsert)


if __name__ == "__main__":
    client_importer = MarketingSourceSeeder()
    asyncio.run(client_importer.seed_marketing_codes())

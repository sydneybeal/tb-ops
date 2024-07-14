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

"""Repositories for client-related data."""
import json
from abc import ABC, abstractmethod
from datetime import datetime
from textwrap import dedent
from typing import Iterable, Sequence
from api.services.clients.models import Client, ClientSummary

from api.adapters.repository import PostgresMixin
from api.services.clients.repository import ClientRepository
from api.services.clients.models import Client


class PostgresClientRepository(PostgresMixin, ClientRepository):
    """Implementation of the ClientRepository ABC for Postgres."""

    async def add(self, clients: Iterable[Client]) -> None:
        """Adds an iterable of Client models to the repository."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            INSERT INTO public.clients (
                id,
                first_name,
                last_name,
                address_line_1,
                address_line_2,
                address_city,
                address_state,
                address_zip,
                subjective_score,
                birth_date,
                referred_by_id,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            ON CONFLICT (id) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        client.id,
                        client.first_name.strip(),
                        client.last_name.strip(),
                        (
                            client.address_line_1.strip()
                            if client.address_line_1
                            else None
                        ),
                        (
                            client.address_line_2.strip()
                            if client.address_line_2
                            else None
                        ),
                        client.address_city.strip() if client.address_city else None,
                        client.address_state.strip() if client.address_state else None,
                        client.address_zip.strip() if client.address_zip else None,
                        client.subjective_score,
                        client.birth_date,
                        client.referred_by_id,
                        client.created_at,
                        client.updated_at,
                        client.updated_by.strip(),
                    )
                    for client in clients
                ]
                await con.executemany(query, args)
        print(f"Successfully added {len(args)} new Client record(s) to the repository.")

    async def get(self) -> Sequence[Client]:
        """Returns Clients in the repository."""
        pool = await self._get_pool()  # Assuming this retrieves an asyncpg pool
        query = dedent(
            """
            SELECT * FROM public.clients
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                clients = [Client(**record) for record in records]
                return clients

    async def get_summaries(self) -> Sequence[ClientSummary]:
        """Returns ClientSummary instances in the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT 
                c.id,
                c.first_name,
                c.last_name,
                c.address_line_1,
                c.address_line_2,
                c.address_city,
                c.address_state,
                c.address_zip,
                c.subjective_score,
                c.birth_date,
                c.referred_by_id,
                r.first_name AS referred_by_first_name,
                r.last_name AS referred_by_last_name,
                c.created_at,
                c.updated_at,
                c.updated_by,
                COUNT(distinct ref.id) AS referrals_count
            FROM public.clients AS c
            LEFT JOIN public.clients AS r ON c.referred_by_id = r.id
            LEFT JOIN public.clients AS ref ON ref.referred_by_id = c.id
            GROUP BY c.id, r.first_name, r.last_name
            """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                records = await con.fetch(query)
                client_summaries = [
                    ClientSummary(
                        id=record["id"],
                        first_name=record["first_name"],
                        last_name=record["last_name"],
                        address_line_1=record["address_line_1"],
                        address_line_2=record["address_line_2"],
                        address_city=record["address_city"],
                        address_state=record["address_state"],
                        address_zip=record["address_zip"],
                        subjective_score=record["subjective_score"],
                        birth_date=record["birth_date"],
                        referred_by_id=record["referred_by_id"],
                        referred_by_first_name=record["referred_by_first_name"],
                        referred_by_last_name=record["referred_by_last_name"],
                        created_at=record["created_at"],
                        updated_at=record["updated_at"],
                        updated_by=record["updated_by"],
                        referrals_count=record["referrals_count"],
                    )
                    for record in records
                ]
                return client_summaries

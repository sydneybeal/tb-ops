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
"""Postgres Repository for travel-related data."""
import json
from typing import Sequence
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.auth.repository import AuthRepository
from api.services.auth.models import User, UserSummary


class PostgresAuthRepository(PostgresMixin, AuthRepository):
    """Implementation of the AuthRepository ABC for Postgres."""

    async def get_user(self, email: str):
        """Gets a user from the repository by email."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.users
            WHERE UPPER(email) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, email.strip().upper())
                if res:
                    return User(**res)

    async def add_user(self, users: Sequence[User]) -> None:
        """Adds a sequence of User models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.users (
                id,
                email,
                hashed_password,
                role
            )
            VALUES (
                $1, $2, $3, $4
            );
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        user.id,
                        user.email,
                        user.hashed_password,
                        user.role,
                    )
                    for user in users
                ]
                await con.executemany(query, args)
        print(f"Successfully added {len(args)} new user(s) to the repository.")

    async def get_all_users(self) -> Sequence[UserSummary]:
        """Gets all users as UserSummary models from the repository."""
        """Gets a user from the repository by email."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
            id,
            email,
            role
            FROM public.users
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(
                    query
                )  # Use fetch to retrieve all matching rows
                user_summaries = [UserSummary(**record) for record in records]
                return user_summaries

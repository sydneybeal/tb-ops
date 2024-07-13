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
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Iterable
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.reservations.repository import ReservationRepository
from api.services.reservations.models import Reservation


class PostgresReservationRepository(PostgresMixin, ReservationRepository):
    """Implementation of the ReservationsRepository ABC for Postgres."""

    async def add(self, reservations: Iterable[Reservation]) -> None:
        """Adds an iterable of Reservation models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.reservations (
                id, client_id, num_pax, core_destination_id, cost,
                start_date, end_date, created_at, updated_at, updated_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            ON CONFLICT (id) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                args = [
                    (
                        res.id,
                        res.client_id,
                        res.num_pax,
                        res.core_destination_id,
                        res.cost,
                        res.start_date,
                        res.end_date,
                        res.created_at,
                        res.updated_at,
                        res.updated_by,
                    )
                    for res in reservations
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new Reservation record(s) to the repository."
        )

    async def get(self) -> Iterable[Reservation]:
        """Returns all Reservation models in the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.reservations
            """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                records = await con.fetch(query)
                reservations = [Reservation(**record) for record in records]
                return reservations

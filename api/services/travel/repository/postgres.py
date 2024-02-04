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

# from asyncpg.connection import inspect

from api.adapters.repository import PostgresMixin
from api.services.travel.repository import TravelRepository
from api.services.travel.models import (
    AccommodationLog,
    Property,
    CoreDestination,
    Country,
    Consultant,
    Agency,
    BookingChannel,
)


class PostgresTravelRepository(PostgresMixin, TravelRepository):
    """Implementation of the TravelRepository ABC for Postgres."""

    # AccommodationLog
    async def add_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Adds a sequence of AccommodationLog models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.accommodation_logs (
                id,
                property_id,
                consultant_id,
                portfolio,
                primary_traveler,
                num_pax,
                date_in,
                date_out,
                booking_channel_id,
                agency_id,
                core_destination_id,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
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
                        log.id,
                        log.property_id,
                        log.consultant_id,
                        log.portfolio,
                        log.primary_traveler,
                        log.num_pax,
                        log.date_in,
                        log.date_out,
                        log.booking_channel_id,
                        log.agency_id,
                        log.core_destination_id,
                        log.created_at,
                        log.updated_at,
                        log.updated_by,
                    )
                    for log in accommodation_logs
                ]
                await con.executemany(query, args)
        print(f"Successfully added {len(args)} new log(s) to the repository.")

    async def update_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Updates a sequence of AccommodationLog models in the repository."""
        raise NotImplementedError

    async def delete_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Deletes a sequence of AccommodationLog models from the repository."""
        raise NotImplementedError

    # Property
    async def add_property(self, properties: Sequence[Property]) -> None:
        """Adds a sequence of Property models to the repository."""
        raise NotImplementedError

    async def update_property(self, properties: Sequence[Property]) -> None:
        """Updates a sequence of Property models in the repository."""
        raise NotImplementedError

    async def delete_property(self, properties: Sequence[Property]) -> None:
        """Deletes a sequence of Property models from the repository."""
        raise NotImplementedError

    # Consultant
    async def add_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Adds a sequence of Consultant models to the repository."""
        raise NotImplementedError

    async def update_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Updates a sequence of Consultant models in the repository."""
        raise NotImplementedError

    async def delete_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Deletes a sequence of Consultant models from the repository."""
        raise NotImplementedError

    # CoreDestination
    async def add_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Adds a sequence of CoreDestination models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.core_destinations (
                id,
                name,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5
            )
            ON CONFLICT (name) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        core_destination.id,
                        core_destination.name,
                        core_destination.created_at,
                        core_destination.updated_at,
                        core_destination.updated_by,
                    )
                    for core_destination in core_destinations
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new core destination record(s) to the repository."
        )

    async def get_core_destination(
        self, names: Sequence[str]
    ) -> Sequence[CoreDestination]:
        """Returns the list of CoreDestination models in the repository by name."""
        pool = await self._get_pool()
        upper_names = [name.upper() for name in names]
        print(f"Querying for {upper_names}")
        query = dedent(
            """
            SELECT * FROM public.core_destinations
            WHERE UPPER(name) = ANY($1::text[])
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                rows = await con.fetch(query, upper_names)
                # print(rows)
                return [
                    CoreDestination(
                        id=row["id"],
                        name=row["name"],
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                        updated_by=row["updated_by"],
                    )
                    for row in rows
                ]

    async def update_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Updates a sequence of CoreDestination models in the repository."""
        raise NotImplementedError

    async def delete_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Deletes a sequence of CoreDestination models from the repository."""
        raise NotImplementedError

    # Country
    async def add_country(self, countries: Sequence[Country]) -> None:
        """Adds a sequence of Country models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.countries (
                id,
                name,
                core_destination_id,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6
            )
            ON CONFLICT (name) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        country.id,
                        country.name,
                        country.core_destination_id,
                        country.created_at,
                        country.updated_at,
                        country.updated_by,
                    )
                    for country in countries
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new country record(s) to the repository."
        )

    async def update_country(self, countries: Sequence[Country]) -> None:
        """Updates a sequence of Country models in the repository."""
        raise NotImplementedError

    async def delete_country(self, countries: Sequence[Country]) -> None:
        """Deletes a sequence of Country models from the repository."""
        raise NotImplementedError

    async def get_country(self, names: Sequence[str]) -> Sequence[Country]:
        """Returns the list of Country models in the repository by name."""
        pool = await self._get_pool()
        upper_names = [name.upper() for name in names]
        query = dedent(
            """
            SELECT * FROM public.countries
            WHERE UPPER(name) = ANY($1::text[])
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                rows = await con.fetch(query, upper_names)
                return [
                    Country(
                        id=row["id"],
                        name=row["name"],
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                        updated_by=row["updated_by"],
                    )
                    for row in rows
                ]

    # Agency
    async def add_agency(self, agencies: Sequence[Agency]) -> None:
        """Adds a sequence of Agency models to the repository."""
        raise NotImplementedError

    async def update_agency(self, agencies: Sequence[Agency]) -> None:
        """Updates a sequence of Agency models in the repository."""
        raise NotImplementedError

    async def delete_agency(self, agencies: Sequence[Agency]) -> None:
        """Deletes a sequence of Agency models from the repository."""
        raise NotImplementedError

    # BookingChannel
    async def add_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Adds a sequence of BookingChannel models to the repository."""
        raise NotImplementedError

    async def update_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Updates a sequence of BookingChannel models in the repository."""
        raise NotImplementedError

    async def delete_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Deletes a sequence of BookingChannel models from the repository."""
        raise NotImplementedError

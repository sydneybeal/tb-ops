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
import datetime
import json
from typing import Tuple
from uuid import UUID
from typing import Optional, Sequence
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
    Portfolio,
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
                primary_traveler,
                num_pax,
                date_in,
                date_out,
                booking_channel_id,
                agency_id,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
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
                        log.primary_traveler.strip(),
                        log.num_pax,
                        log.date_in,
                        log.date_out,
                        log.booking_channel_id,
                        log.agency_id,
                        log.created_at,
                        log.updated_at,
                        log.updated_by,
                    )
                    for log in accommodation_logs
                ]
                await con.executemany(query, args)
        print(f"Successfully added {len(args)} new log(s) to the repository.")

    async def upsert_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> list[Tuple[UUID, bool]]:
        """Upserts a sequence of AccommodationLog models into the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
        INSERT INTO public.accommodation_logs (
            id,
            property_id,
            consultant_id,
            primary_traveler,
            num_pax,
            date_in,
            date_out,
            booking_channel_id,
            agency_id,
            updated_at,
            updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (id) DO UPDATE SET
            property_id = EXCLUDED.property_id,
            consultant_id = EXCLUDED.consultant_id,
            primary_traveler = EXCLUDED.primary_traveler,
            num_pax = EXCLUDED.num_pax,
            date_in = EXCLUDED.date_in,
            date_out = EXCLUDED.date_out,
            booking_channel_id = EXCLUDED.booking_channel_id,
            agency_id = EXCLUDED.agency_id,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        RETURNING id, (xmax = 0) AS was_inserted;
    """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                for log in accommodation_logs:
                    args = (
                        log.id,
                        log.property_id,
                        log.consultant_id,
                        log.primary_traveler.strip(),
                        log.num_pax,
                        log.date_in,
                        log.date_out,
                        log.booking_channel_id,
                        log.agency_id,
                        datetime.datetime.now(),  # Set updated_at to now
                        log.updated_by,
                    )
                    row = await con.fetchrow(query, *args)
                    if row:
                        # Append log ID and whether it was an insert (True) or an update (False)
                        results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new log(s).")
        print(f"Updated {updated_count} existing log(s).")
        return results

    async def delete_accommodation_log(self, log_id: UUID) -> bool:
        """Deletes an AccommodationLog model from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            DELETE FROM public.accommodation_logs
            WHERE id = $1;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query
                result = await con.execute(query, log_id)
                # `execute` returns a string like 'DELETE 1' if a row was deleted successfully
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(f"No log found with ID: {log_id}, nothing was deleted.")
                    return False
                print(f"Successfully deleted log with ID: {log_id}.")
                return True

    async def get_accommodation_log(
        self,
        primary_traveler: str,
        property_id: str,
        date_in: datetime.date,
        date_out: datetime.date,
    ) -> AccommodationLog:
        """Gets a single AccommodationLog model in the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.accommodation_logs
            WHERE UPPER(primary_traveler) = $1
            AND property_id = $2
            AND date_in = $3
            AND date_out = $4
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(
                    query,
                    primary_traveler.strip().upper(),
                    property_id,
                    date_in,
                    date_out,
                )
                if res:
                    return AccommodationLog(
                        id=res["id"],
                        property_id=res["property_id"],
                        consultant_id=res["consultant_id"],
                        primary_traveler=res["primary_traveler"],
                        num_pax=res["num_pax"],
                        date_in=res["date_in"],
                        date_out=res["date_out"],
                        booking_channel_id=res["booking_channel_id"],
                        agency_id=res["agency_id"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_accommodation_log_by_id(
        self,
        log_id: UUID,
    ) -> AccommodationLog:
        """Gets a single AccommodationLog model in the repository by ID."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.accommodation_logs
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, log_id)
                if res:
                    return AccommodationLog(**res)

    async def update_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Updates a sequence of AccommodationLog models in the repository."""
        raise NotImplementedError

    # Property
    async def add_property(self, properties: Sequence[Property]) -> None:
        """Adds a sequence of Property models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.properties (
                id,
                name,
                portfolio_id,
                country_id,
                core_destination_id,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
            )
            ON CONFLICT (name, portfolio_id, country_id, core_destination_id) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        prop.id,
                        prop.name.strip(),
                        prop.portfolio_id,
                        prop.country_id,
                        prop.core_destination_id,
                        prop.created_at,
                        prop.updated_at,
                        prop.updated_by,
                    )
                    for prop in properties
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new Property record(s) to the repository."
        )

    async def upsert_property(self, property_data: Property) -> list[Tuple[UUID, bool]]:
        """Upserts a sequence of Property models into the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
        INSERT INTO public.properties (
            id,
            name,
            portfolio,
            country_id,
            core_destination_id,
            created_at,
            updated_at,
            updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            portfolio = EXCLUDED.portfolio,
            country_id = EXCLUDED.country_id,
            core_destination_id = EXCLUDED.core_destination_id,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        RETURNING id, (xmax = 0) AS was_inserted;
    """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = (
                    property_data.id,
                    property_data.name.strip(),
                    property_data.portfolio.strip(),
                    property_data.country_id,
                    property_data.core_destination_id,
                    property_data.created_at,
                    property_data.updated_at,
                    property_data.updated_by,
                )
                row = await con.fetchrow(query, *args)
                if row:
                    # Append log ID and whether it was an insert (True) or an update (False)
                    results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new property(ies).")
        print(f"Updated {updated_count} existing property(ies).")
        return results

    async def get_property_by_name(
        self,
        name: str,
        portfolio_id: UUID,
        country_id: Optional[UUID],
        core_destination_id: Optional[UUID],
    ) -> Property:
        """Returns a single Property model in the repository by name."""
        # Check and convert only if country_id is a string and not empty
        if isinstance(country_id, str) and country_id:
            try:
                country_id_uuid = UUID(country_id)
            except ValueError:
                # Handle the case where country_id is not a valid UUID string
                country_id_uuid = None
        else:
            # No conversion needed if it's None or already a UUID object
            country_id_uuid = country_id

        # Repeat the similar check and conversion for core_destination_id
        if isinstance(core_destination_id, str) and core_destination_id:
            try:
                core_destination_id_uuid = UUID(core_destination_id)
            except ValueError:
                core_destination_id_uuid = None
        else:
            core_destination_id_uuid = core_destination_id

        # Repeat the similar check and conversion for core_destination_id
        if isinstance(portfolio_id, str) and portfolio_id:
            try:
                portfolio_id_uuid = UUID(portfolio_id)
            except ValueError:
                portfolio_id_uuid = None
        else:
            portfolio_id_uuid = portfolio_id

        # Pass the UUID conversions to the function
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.properties
            WHERE UPPER(name) = $1
            AND portfolio_id IS NOT DISTINCT FROM $2
            AND country_id IS NOT DISTINCT FROM $3
            AND core_destination_id IS NOT DISTINCT FROM $4
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(
                    query,
                    name.strip().upper(),
                    portfolio_id_uuid,
                    country_id_uuid,
                    core_destination_id_uuid,
                )
                if res:
                    return Property(**res)

    async def get_property_by_id(
        self,
        property_id: UUID,
    ) -> Property:
        """Returns a single Property model in the repository by id."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.properties
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, property_id)
                if res:
                    return Property(**res)

    async def update_property(self, properties: Sequence[Property]) -> None:
        """Updates a sequence of Property models in the repository."""
        raise NotImplementedError

    async def delete_property(self, property_id: UUID) -> bool:
        """Deletes a sequence of Property models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            DELETE FROM public.properties
            WHERE id = $1;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query
                result = await con.execute(query, property_id)
                # `execute` returns a string like 'DELETE 1' if a row was deleted successfully
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(
                        f"No property found with ID: {property_id}, nothing was deleted."
                    )
                    return False
                print(f"Successfully deleted property with ID: {property_id}.")
                return True

    # Consultant
    async def add_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Adds a sequence of Consultant models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.consultants (
                id,
                first_name,
                last_name,
                created_at,
                updated_at,
                updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6
            )
            ON CONFLICT (first_name, last_name) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    (
                        consultant.id,
                        consultant.first_name.strip(),
                        consultant.last_name.strip(),
                        consultant.created_at,
                        consultant.updated_at,
                        consultant.updated_by,
                    )
                    for consultant in consultants
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new consultant record(s) to the repository."
        )

    async def get_all_consultants(self) -> Sequence[Consultant]:
        """Gets all Consultant models."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.consultants
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                consultants = [Consultant(**record) for record in records]
                return consultants

    async def get_consultant_by_name(
        self, first_name: str, last_name: str
    ) -> Consultant:
        """Returns a single Consultant model in the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.consultants
            WHERE UPPER(first_name) = $1
            AND UPPER(last_name) = $2
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(
                    query, first_name.strip().upper(), last_name.strip().upper()
                )
                if res:
                    return Consultant(**res)

    async def update_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Updates a sequence of Consultant models in the repository."""
        raise NotImplementedError

    async def upsert_consultant(
        self, consultant_data: Consultant
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a consultant into the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
        INSERT INTO public.consultants (
            id,
            first_name,
            last_name,
            is_active,
            created_at,
            updated_at,
            updated_by
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
        )
        ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at,
            updated_by = EXCLUDED.updated_by
        RETURNING id, (xmax = 0) AS was_inserted;
    """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = (
                    consultant_data.id,
                    consultant_data.first_name.strip(),
                    consultant_data.last_name.strip(),
                    consultant_data.is_active,
                    consultant_data.created_at,
                    consultant_data.updated_at,
                    consultant_data.updated_by,
                )
                row = await con.fetchrow(query, *args)
                if row:
                    # Append log ID and whether it was an insert (True) or an update (False)
                    results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new consultant(s).")
        print(f"Updated {updated_count} existing consultant(s).")
        return results

    async def get_consultant_by_id(self, consultant_id: UUID) -> Consultant:
        """Gets a single Consultant model based on id."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.consultants
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, consultant_id)
                if res:
                    return Consultant(**res)

    async def delete_consultant(self, consultant_id: UUID) -> bool:
        """Deletes a sequence of Consultant models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            DELETE FROM public.consultants
            WHERE id = $1;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query
                result = await con.execute(query, consultant_id)
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(
                        f"No consultant found with ID: {consultant_id}, nothing was deleted."
                    )
                    return False
                print(f"Successfully deleted consultant with ID: {consultant_id}.")
                return True

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
                        core_destination.name.strip(),
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

    async def get_core_destination_by_name(self, name: str) -> CoreDestination:
        """Returns a single CoreDestination model in the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.core_destinations
            WHERE UPPER(name) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, name.strip().upper())
                if res:
                    return CoreDestination(
                        id=res["id"],
                        name=res["name"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_all_core_destinations(self) -> Sequence[CoreDestination]:
        """Gets all of CoreDestination models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.core_destinations
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                agencies = [CoreDestination(**record) for record in records]
                return agencies

    async def get_core_destinations_by_name(
        self, names: Sequence[str]
    ) -> Sequence[CoreDestination]:
        """Returns the list of CoreDestination models in the repository by name."""
        pool = await self._get_pool()
        upper_names = [name.strip().upper() for name in names]
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
                        country.name.strip(),
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

    async def get_countries_by_name(self, names: Sequence[str]) -> Sequence[Country]:
        """Returns the list of Country models in the repository by name."""
        pool = await self._get_pool()
        upper_names = [name.strip().upper() for name in names]
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

    async def get_country_by_name(self, name: str) -> Country:
        """Returns a single Country model in the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.countries
            WHERE UPPER(name) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, name.upper())
                if res:
                    return Country(
                        id=res["id"],
                        name=res["name"],
                        core_destination_id=res["core_destination_id"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_country_by_id(self, country_id: UUID) -> None:
        """Gets a single Country model based on ID."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.countries
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, country_id)
                if res:
                    return Country(**res)

    # Agency
    async def add_agency(self, agencies: Sequence[Agency]) -> None:
        """Adds a sequence of Agency models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.agencies (
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
                        agency.id,
                        agency.name.strip(),
                        agency.created_at,
                        agency.updated_at,
                        agency.updated_by,
                    )
                    for agency in agencies
                ]
                await con.executemany(query, args)
        print(f"Successfully added {len(args)} new agency record(s) to the repository.")

    async def get_agency_by_name(self, name: str) -> Agency:
        """Returns a single Agency model in the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.agencies
            WHERE UPPER(name) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, name.strip().upper())
                if res:
                    return Agency(
                        id=res["id"],
                        name=res["name"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_agency_by_id(self, agency_id: UUID) -> Agency:
        """Gets a single Agency model based on id."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.agencies
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, agency_id)
                if res:
                    return Agency(**res)

    async def get_all_agencies(self) -> Sequence[Agency]:
        """Gets all Agency models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.agencies
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                agencies = [Agency(**record) for record in records]
                return agencies

    async def upsert_agency(self, agency_data: Agency) -> list[Tuple[UUID, bool]]:
        """Updates or inserts an agency into the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.agencies (
                id,
                name,
                created_at,
                updated_at,
                updated_by
            ) VALUES (
                $1, $2, $3, $4, $5
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            RETURNING id, (xmax = 0) AS was_inserted;
        """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = (
                    agency_data.id,
                    agency_data.name.strip(),
                    agency_data.created_at,
                    agency_data.updated_at,
                    agency_data.updated_by,
                )
                row = await con.fetchrow(query, *args)
                if row:
                    # Append log ID and whether it was an insert (True) or an update (False)
                    results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new agency(ies).")
        print(f"Updated {updated_count} existing agency(ies).")
        return results

    async def update_agency(self, agencies: Sequence[Agency]) -> None:
        """Updates a sequence of Agency models in the repository."""
        raise NotImplementedError

    async def delete_agency(self, agency_id: UUID) -> bool:
        """Deletes an Agency model from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            DELETE FROM public.agencies
            WHERE id = $1;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query
                result = await con.execute(query, agency_id)
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(f"No agency found with ID: {agency_id}, nothing was deleted.")
                    return False
                print(f"Successfully deleted agency with ID: {agency_id}.")
                return True

    # BookingChannel
    async def add_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Adds a sequence of BookingChannel models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.booking_channels (
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
                        channel.id,
                        channel.name.strip(),
                        channel.created_at,
                        channel.updated_at,
                        channel.updated_by,
                    )
                    for channel in booking_channels
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new booking channel record(s) to the repository."
        )

    async def get_booking_channel_by_name(self, name: str) -> BookingChannel:
        """Gets a single BookingChannel model from the repository by name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.booking_channels
            WHERE UPPER(name) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, name.strip().upper())
                if res:
                    return BookingChannel(
                        id=res["id"],
                        name=res["name"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_booking_channel_by_id(
        self, booking_channel_id: UUID
    ) -> BookingChannel:
        """Gets a single BookingChannel model based on id."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.booking_channels
            WHERE id = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, booking_channel_id)
                if res:
                    return BookingChannel(**res)

    async def get_all_booking_channels(self) -> Sequence[BookingChannel]:
        """Gets all BookingChannel models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.booking_channels
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                agencies = [BookingChannel(**record) for record in records]
                return agencies

    async def upsert_booking_channel(
        self, booking_channel_data: BookingChannel
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a booking channel into the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.booking_channels (
                id,
                name,
                created_at,
                updated_at,
                updated_by
            ) VALUES (
                $1, $2, $3, $4, $5
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            RETURNING id, (xmax = 0) AS was_inserted;
        """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = (
                    booking_channel_data.id,
                    booking_channel_data.name.strip(),
                    booking_channel_data.created_at,
                    booking_channel_data.updated_at,
                    booking_channel_data.updated_by,
                )
                row = await con.fetchrow(query, *args)
                if row:
                    # Append log ID and whether it was an insert (True) or an update (False)
                    results.append((row["id"], row["was_inserted"]))
        # Initialize counters
        inserted_count = 0
        updated_count = 0

        # Process the results to count inserts and updates
        for _, was_inserted in results:
            if was_inserted:
                inserted_count += 1
            else:
                updated_count += 1

        print(f"Processed {len(results)} upsert operation(s).")
        print(f"Inserted {inserted_count} new booking channel(s).")
        print(f"Updated {updated_count} existing booking channel(s).")
        return results

    async def update_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Updates a sequence of BookingChannel models in the repository."""
        raise NotImplementedError

    async def delete_booking_channel(self, booking_channel_id: UUID) -> bool:
        """Deletes a sequence of BookingChannel models from the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            DELETE FROM public.booking_channels
            WHERE id = $1;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query
                result = await con.execute(query, booking_channel_id)
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(
                        f"No booking channel found with ID: {booking_channel_id}, nothing was deleted."
                    )
                    return False
                print(
                    f"Successfully deleted booking channel with ID: {booking_channel_id}."
                )
                return True

    async def add_portfolio(self, portfolios: Sequence[Portfolio]) -> None:
        """Adds a sequence of Portfolio models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.portfolios (
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
                        portfolio.id,
                        portfolio.name.strip(),
                        portfolio.created_at,
                        portfolio.updated_at,
                        portfolio.updated_by,
                    )
                    for portfolio in portfolios
                ]
                await con.executemany(query, args)
        print(
            f"Successfully added {len(args)} new portfolio record(s) to the repository."
        )

    async def get_portfolio_by_name(self, name: str) -> Portfolio:
        """Gets a single Portfolio model based on name."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.portfolios
            WHERE UPPER(name) = $1
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, name.strip().upper())
                if res:
                    return Portfolio(
                        id=res["id"],
                        name=res["name"],
                        created_at=res["created_at"],
                        updated_at=res["updated_at"],
                        updated_by=res["updated_by"],
                    )

    async def get_all_portfolios(self) -> Sequence[Portfolio]:
        """Gets all Portfolio models."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT * FROM public.portfolios
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                agencies = [Portfolio(**record) for record in records]
                return agencies

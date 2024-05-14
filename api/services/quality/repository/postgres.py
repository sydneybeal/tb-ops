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

"""Repositories for travel-related data."""
import datetime
import json
from uuid import UUID
from abc import ABC, abstractmethod
from typing import Sequence, List, Set
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.quality.repository import QualityRepository
from api.services.summaries.models import AccommodationLogSummary

from api.services.quality.models import (
    FlaggedTrip,
    PotentialTrip,
)


class PostgresQualityRepository(PostgresMixin, QualityRepository):
    """Abstract repository for data summary models."""

    # PotentialTrip
    async def get_unmatched_accommodation_logs(
        self, exclude_ids: Set[UUID]
    ) -> List[AccommodationLogSummary]:
        """Gets accommodation logs without an associated Trip ID."""
        pool = await self._get_pool()
        if exclude_ids:
            excluded_ids_string = ",".join(f"'{str(id)}'" for id in exclude_ids)
            where_clause = f"AND al.id NOT IN ({excluded_ids_string})"
        else:
            where_clause = ""
        query = dedent(
            f"""
            SELECT
                al.id,
                al.primary_traveler,
                cd.name AS core_destination_name,
                cd.id AS core_destination_id,
                c.name AS country_name,
                c.id AS country_id,
                al.date_in,
                al.date_out,
                al.num_pax,
                p.name AS property_name,
                p.id AS property_portfolio_id,
                pf.name AS property_portfolio,
                bc.name AS booking_channel_name,
                a.name AS agency_name,
                al.consultant_id,
                cons.first_name AS consultant_first_name,
                cons.last_name AS consultant_last_name,
                cons.is_active AS consultant_is_active,
                al.property_id,
                al.booking_channel_id,
                al.agency_id,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.accommodation_logs al
            LEFT JOIN public.properties p ON al.property_id = p.id
            LEFT JOIN public.portfolios pf ON p.portfolio_id = pf.id
            LEFT JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            LEFT JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            WHERE al.trip_id IS NULL {where_clause}
            ORDER BY al.primary_traveler ASC, al.date_in ASC
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
                accommodation_log_summaries = [
                    AccommodationLogSummary(**record) for record in records
                ]
                return accommodation_log_summaries

    async def add_flagged_trip(self, flagged_trip: FlaggedTrip):
        """Adds a FlaggedTrip to the repo."""
        pool = await self._get_pool()
        # Convert list of UUIDs to a comma-separated string
        accommodation_log_ids_str = ",".join(
            str(id) for id in flagged_trip.accommodation_log_ids
        )

        query = dedent(
            """
            INSERT INTO public.potential_trips (
                id, trip_name, accommodation_log_ids, review_status, review_notes, 
                reviewed_at, reviewed_by, created_at, updated_at, updated_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            ON CONFLICT (trip_name, accommodation_log_ids) DO NOTHING;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                args = [
                    flagged_trip.id,
                    flagged_trip.trip_name,
                    accommodation_log_ids_str,
                    flagged_trip.review_status,
                    flagged_trip.review_notes,
                    flagged_trip.reviewed_at,
                    flagged_trip.reviewed_by,
                    flagged_trip.created_at,
                    flagged_trip.updated_at,
                    flagged_trip.updated_by,
                ]
                await con.execute(query, *args)

                print("Successfully added potential trip")

    async def get_flagged_trips(self) -> Sequence[FlaggedTrip]:
        """Gets FlaggedTrips in the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                *
            FROM public.potential_trips
        """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                flagged_trips = []
                for record in records:
                    # Convert the immutable asyncpg.Record to a mutable dictionary
                    mutable_record = dict(record)
                    # Split the string and convert each UUID string to a UUID object
                    log_ids = [
                        UUID(id_str.strip())
                        for id_str in mutable_record["accommodation_log_ids"].split(",")
                    ]
                    # Update the dictionary with the new list of UUIDs
                    mutable_record["accommodation_log_ids"] = log_ids
                    flagged_trip = FlaggedTrip(**mutable_record)
                    flagged_trips.append(flagged_trip)
                return flagged_trips

    async def delete_related_potential_trips(self, accommodation_log_ids: List[UUID]):
        """Deletes potential trips that have any of the specified accommodation log IDs."""
        pool = await self._get_pool()
        log_ids_str = ",".join(
            f"'{str(id)}'" for id in accommodation_log_ids
        )  # Prepare string for SQL query
        query = f"""
        DELETE FROM potential_trips
        WHERE string_to_array(accommodation_log_ids, ',')::uuid[] && ARRAY[{log_ids_str}]::uuid[];
        """
        async with pool.acquire() as con:
            await con.execute(query)

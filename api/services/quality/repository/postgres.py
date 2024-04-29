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
import uuid
from abc import ABC, abstractmethod
from typing import Sequence, List
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.quality.repository import QualityRepository
from api.services.summaries.models import AccommodationLogSummary

from api.services.quality.models import (
    PotentialTrip,
)


class PostgresQualityRepository(PostgresMixin, QualityRepository):
    """Abstract repository for data summary models."""

    # PotentialTrip
    async def get_unmatched_accommodation_logs(self) -> List[AccommodationLogSummary]:
        """Gets accommodation logs without an associated Trip ID."""
        pool = await self._get_pool()
        query = dedent(
            """
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
            WHERE al.trip_id IS NULL 
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

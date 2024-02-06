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
import uuid
from typing import Sequence
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.summaries.repository import SummaryRepository
from api.services.summaries.models import AccommodationLogSummary, PropertySummary
from api.services.travel.models import (
    AccommodationLog,
    Property,
)


class PostgresSummaryRepository(PostgresMixin, SummaryRepository):
    """Implementation of the SummaryRepository ABC for Postgres."""

    # AccommodationLog
    async def get_accommodation_log(
        self,
        primary_traveler: str,
        property_id: str,
        date_in: datetime.date,
        date_out: datetime.date,
    ) -> AccommodationLog:
        """Gets a single AccommodationLog model in the repository by name."""
        raise NotImplementedError

    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLog]:
        """Gets all AccommodationLog models in the repository, joined with their foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                al.id,
                al.primary_traveler,
                cd.name AS core_destination_name,
                c.name AS country_name,
                al.date_in,
                al.date_out,
                al.num_pax,
                p.name AS property_name,
                p.portfolio AS property_portfolio,
                p.representative AS property_representative,
                bc.name AS booking_channel_name,
                a.name AS agency_name,
                al.consultant_id,
                cons.first_name AS consultant_first_name,
                cons.last_name AS consultant_last_name,
                al.property_id,
                al.booking_channel_id,
                al.agency_id,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.accommodation_logs al
            JOIN public.properties p ON al.property_id = p.id
            JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            ORDER BY al.date_in desc
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

    # Property
    async def get_property(
        self,
        name: str,
        portfolio_name: str,
        country_id: uuid,
        core_destination_id: uuid,
    ) -> Property:
        """Returns a single Property model in the repository by name."""
        raise NotImplementedError

    async def get_all_properties(self) -> Sequence[PropertySummary]:
        """Gets all Property models in the repository, joined with their foreign keys."""
        raise NotImplementedError

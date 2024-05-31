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
from uuid import UUID
from typing import Sequence, Optional
from textwrap import dedent

from api.adapters.repository import PostgresMixin
from api.services.summaries.repository import SummaryRepository
from api.services.summaries.models import (
    AccommodationLogSummary,
    AgencySummary,
    BedNightReport,
    BookingChannelSummary,
    CountrySummary,
    PortfolioSummary,
    PropertyDetailSummary,
    PropertySummary,
    Overlap,
    TripSummary,
)
from api.services.travel.models import AccommodationLog, Property, Trip


class PostgresSummaryRepository(PostgresMixin, SummaryRepository):
    """Implementation of the SummaryRepository ABC for Postgres."""

    async def get_bed_night_report(self, input_args: dict) -> BedNightReport:
        """Creates a BedNightReport model given the inputs and repo data."""
        # Parse the input args to filter the query
        # print(input_args)
        # for k, v in input_args.items():
        #     print(f"Key: {k}, Value: {v}")
        # # Run some sort of query that gets aggregations and creates a bed night report
        # pool = await self._get_pool()
        # query = dedent(
        #     """
        #     SELECT
        #         al.id,
        #         al.primary_traveler,
        #         cd.name AS core_destination_name,
        #         c.name AS country_name,
        #         al.date_in,
        #         al.date_out,
        #         al.num_pax,
        #         p.name AS property_name,
        #         p.portfolio AS property_portfolio,
        #         p.representative AS property_representative,
        #         bc.name AS booking_channel_name,
        #         a.name AS agency_name,
        #         al.consultant_id,
        #         cons.first_name AS consultant_first_name,
        #         cons.last_name AS consultant_last_name,
        #         cons.is_active AS consultant_is_active,
        #         al.property_id,
        #         al.booking_channel_id,
        #         al.agency_id,
        #         al.created_at,
        #         al.updated_at,
        #         al.updated_by
        #     FROM public.accommodation_logs al
        #     JOIN public.properties p ON al.property_id = p.id
        #     JOIN public.consultants cons ON al.consultant_id = cons.id
        #     LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
        #     LEFT JOIN public.agencies a ON al.agency_id = a.id
        #     LEFT JOIN public.countries c ON p.country_id = c.id
        #     JOIN public.core_destinations cd ON p.core_destination_id = cd.id
        #     ORDER BY al.date_in desc
        # """
        # )
        # async with pool.acquire() as con:
        #     await con.set_type_codec(
        #         "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
        #     )
        #     async with con.transaction():
        #         records = await con.fetch(
        #             query
        #         )  # Use fetch to retrieve all matching rows
        #         report_data =  # do something to records to get counts
        #         report = BedNightReport(**report_data)
        #         return report

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

    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLogSummary]:
        """Gets all AccommodationLog models in the repository, joined with their foreign keys."""
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
                p.property_type AS property_type,
                p.location AS property_location,
                p.latitude AS property_latitude,
                p.longitude AS property_longitude,
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
                t.id as trip_id,
                t.trip_name as trip_name,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.accommodation_logs al
            JOIN public.properties p ON al.property_id = p.id
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.trips t ON al.trip_id = t.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            ORDER BY al.updated_at desc
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

    async def get_accommodation_logs_by_filter(
        self, filters: dict, exclude_fam: bool = False
    ) -> Sequence[AccommodationLogSummary]:
        """Gets a set of AccommodationLogSummary models by filter."""
        pool = await self._get_pool()
        query_conditions = []
        for key, value in filters.items():
            if key == "start_date":
                query_conditions.append(f"al.date_in >= '{value}'")
            elif key == "end_date":
                query_conditions.append(f"al.date_out <= '{value}'")
            elif key == "id":
                query_conditions.append(f"al.id = '{value}'")
            elif key == "country_name":
                query_conditions.append(f"c.name = '{value}'")
            elif key == "portfolio_name":
                query_conditions.append(f"pf.name = '{value}'")
            elif key == "property_name":
                query_conditions.append(f"p.name = '{value}'")
            elif key == "core_destination_name":
                query_conditions.append(f"cd.name = '{value}'")
            elif key == "agency" and value == "No agency":
                # Handle the special case where "No agency" should match both "n/a" and null.
                query_conditions.append("(a.name IS NULL OR a.name = 'n/a')")
            elif key == "agency":
                query_conditions.append(f"a.name = '{value}'")
            elif key == "booking_channel" and value == "Direct":
                # Handle the special case where "Direct" should match both "Direct" and null.
                query_conditions.append("(bc.name IS NULL OR bc.name = 'Direct')")
            elif key == "booking_channel":
                query_conditions.append(f"bc.name = '{value}'")
            elif key == "updated_by":
                query_conditions.append(f"al.updated_by = '{value}'")
            elif key == "property_id":
                query_conditions.append(f"property_id = '{value}'")
            elif key == "consultant_id":
                query_conditions.append(f"consultant_id = '{value}'")
            elif key == "booking_channel_id":
                query_conditions.append(f"booking_channel_id = '{value}'")
            elif key == "agency_id":
                query_conditions.append(f"agency_id = '{value}'")
            elif key == "portfolio_id":
                query_conditions.append(f"portfolio_id = '{value}'")
            elif key == "property_type":
                query_conditions.append(f"p.property_type = '{value}'")
            elif key == "country_id":
                query_conditions.append(f"p.country_id = '{value}'")
            elif key == "property_names" and isinstance(value, list):
                property_names_list = ", ".join(
                    "'" + v.replace("'", "''") + "'" for v in value
                )
                query_conditions.append(f"p.name IN ({property_names_list})")
            elif key == "property_location" and isinstance(value, list):
                property_locations_list = ", ".join(
                    "'" + v.replace("'", "''") + "'" for v in value
                )
                query_conditions.append(f"p.location IN ({property_locations_list})")
            # Note: consultant_name will be handled below
        if exclude_fam:
            query_conditions.append("(bc.name IS NULL OR bc.name != 'FAM/TB Travel')")
        condition_string = " AND ".join(query_conditions)
        if condition_string:
            condition_string = "WHERE " + condition_string

        query = dedent(
            f"""
            SELECT
                al.id,
                al.primary_traveler,
                cd.name AS core_destination_name,
                c.id as country_id,
                c.name AS country_name,
                al.date_in,
                al.date_out,
                al.num_pax,
                p.name AS property_name,
                p.property_type AS property_type,
                p.location AS property_location,
                p.latitude AS property_latitude,
                p.longitude AS property_longitude,
                pf.name AS property_portfolio,
                p.portfolio_id AS property_portfolio_id,
                bc.name AS booking_channel_name,
                a.name AS agency_name,
                al.consultant_id,
                cons.first_name AS consultant_first_name,
                cons.last_name AS consultant_last_name,
                cons.is_active AS consultant_is_active,
                al.property_id,
                al.booking_channel_id,
                t.id as trip_id,
                t.trip_name as trip_name,
                al.agency_id,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.accommodation_logs al
            JOIN public.properties p ON al.property_id = p.id
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.trips t ON al.trip_id = t.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            {condition_string}
            ORDER BY al.updated_at desc
        """
        )
        print("condition_string:")
        print(condition_string)
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                # Convert each record to AccommodationLogSummary before filtering
                accommodation_log_summaries_temp = [
                    AccommodationLogSummary(**record) for record in records
                ]

                if "consultant_name" in filters:
                    consultant_filter = filters["consultant_name"]
                    # Filter using the consultant_display_name property of AccommodationLogSummary
                    accommodation_log_summaries = [
                        log
                        for log in accommodation_log_summaries_temp
                        if log.consultant_display_name == consultant_filter
                    ]
                else:
                    accommodation_log_summaries = accommodation_log_summaries_temp

                return accommodation_log_summaries

    async def get_overlaps(
        self, start_date: datetime.date, end_date: datetime.date
    ) -> Sequence[Overlap]:
        """Returns accommodation logs where clients are overlapping at a property by >0 days."""
        pool = await self._get_pool()
        query = """
        SELECT
            a1.primary_traveler AS traveler1,
            a1.date_in AS date_in_traveler1,
            a1.date_out AS date_out_traveler1,
            bc1.name AS booking_channel_traveler1,
            a2.primary_traveler AS traveler2,
            a2.date_in AS date_in_traveler2,
            a2.date_out AS date_out_traveler2,
            bc2.name AS booking_channel_traveler2,
            p.id AS property_id,
            p.name AS property_name,
            c.name AS country_name,
            cons1.first_name AS consultant_first_name_traveler1,
            cons1.last_name AS consultant_last_name_traveler1,
            cons2.first_name AS consultant_first_name_traveler2,
            cons2.last_name AS consultant_last_name_traveler2,
            cons1.is_active AS consultant_is_active_traveler1,
            cons2.is_active AS consultant_is_active_traveler2,
            cd.name AS core_destination_name,
            ag1.name AS agency_name_traveler1,
            ag2.name AS agency_name_traveler2,
            -- Calculate the overlap in days
            GREATEST(0, LEAST(a1.date_out, a2.date_out) - GREATEST(a1.date_in, a2.date_in)) AS overlap_days
        FROM public.accommodation_logs a1
        JOIN public.accommodation_logs a2 ON a1.property_id = a2.property_id
            AND a1.id < a2.id  -- Ensure unique pairings
            AND a1.date_out > a2.date_in
            AND a2.date_out > a1.date_in
        JOIN public.properties p ON a1.property_id = p.id
        LEFT JOIN public.countries c ON p.country_id = c.id
        LEFT JOIN public.booking_channels bc1 on a1.booking_channel_id = bc1.id
        LEFT JOIN public.booking_channels bc2 on a2.booking_channel_id = bc2.id
        LEFT JOIN public.consultants cons1 ON a1.consultant_id = cons1.id
        LEFT JOIN public.consultants cons2 ON a2.consultant_id = cons2.id
        LEFT JOIN public.core_destinations cd ON p.core_destination_id = cd.id
        LEFT JOIN public.agencies ag1 ON a1.agency_id = ag1.id
        LEFT JOIN public.agencies ag2 ON a2.agency_id = ag2.id
        WHERE (a1.date_in BETWEEN $1 AND $2 OR a1.date_out BETWEEN $1 AND $2)
            AND (a2.date_in BETWEEN $1 AND $2 OR a2.date_out BETWEEN $1 AND $2)
        ORDER BY overlap_days ASC, a1.date_in DESC  -- Order by fewest overlap days first, then by date_in
        """
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query, start_date, end_date)
                overlaps = [Overlap(**record) for record in records]
                return overlaps

    # Property
    async def get_property(
        self,
        name: str,
        portfolio_name: str,
        country_id: UUID,
        core_destination_id: UUID,
    ) -> Property:
        """Returns a single Property model in the repository by name."""
        raise NotImplementedError

    async def get_all_properties(self) -> Sequence[PropertySummary]:
        """Gets all Property models in the repository, joined with their foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                p.id,
                p.name,
                cd.name AS core_destination_name,
                c.name AS country_name,
                pf.name AS portfolio_name,
                p.portfolio_id,
                cd.id AS core_destination_id,
                p.latitude,
                p.longitude,
                p.location,
                p.property_type,
                c.id AS country_id,
                p.created_at,
                p.updated_at,
                p.updated_by,
                COUNT(al.id) AS num_related -- Count of occurrences in accommodation_logs
            FROM public.properties p
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            LEFT JOIN public.accommodation_logs al ON p.id = al.property_id -- Join with accommodation_logs
            GROUP BY p.id, p.name, cd.name, c.name, pf.name, p.portfolio_id, cd.id, c.id, p.created_at, p.updated_at, p.updated_by
            ORDER BY p.name ASC
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
                property_summaries = [PropertySummary(**record) for record in records]
                return property_summaries

    async def get_property_details(
        self, entered_only: bool = True, by_id: Optional[UUID] = None
    ) -> Sequence[PropertyDetailSummary]:
        """Gets all PropertyDetail models in the repository, joined with their foreign keys."""
        pool = await self._get_pool()
        base_query = dedent(
            """
            SELECT
                p.id AS property_id,
                p.name,
                cd.name AS core_destination_name,
                c.name AS country_name,
                pf.name AS portfolio_name,
                p.portfolio_id,
                cd.id AS core_destination_id,
                c.id AS country_id,
                p.property_type,
                pd.price_range,
                p.location,
                p.latitude,
                p.longitude,
                pd.num_tents,
                pd.has_trackers,
                pd.has_wifi_in_room,
                pd.has_wifi_in_common_areas,
                pd.has_hairdryers,
                pd.has_pool,
                pd.has_heated_pool,
                pd.has_credit_card_tipping,
                pd.is_child_friendly,
                pd.is_handicap_accessible,
                p.created_at,
                pd.updated_at,
                pd.updated_by
            FROM public.properties p
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            LEFT JOIN public.property_details pd ON pd.property_id = p.id
            """
        )

        conditions = []
        if entered_only:
            conditions.append("pd.updated_by IS NOT NULL")
        if by_id:
            # Properly format the UUID and append it to the conditions
            conditions.append(f"p.id = '{by_id}'")

        if conditions:
            filter_clause = "WHERE " + " AND ".join(conditions)
        else:
            filter_clause = ""

        order_by_clause = "ORDER BY p.name ASC"

        query = f"{base_query} {filter_clause} {order_by_clause}"

        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(
                    query
                )  # Use fetch to retrieve all matching rows
                property_detail_summaries = [
                    PropertyDetailSummary(**record) for record in records
                ]
                return property_detail_summaries
        # raise NotImplementedError

    async def get_property_details_by_id(self) -> PropertyDetailSummary:
        """Gets a PropertyDetail models in the repository by ID, joined with foreign keys."""
        raise NotImplementedError

    async def get_all_countries(self) -> Sequence[CountrySummary]:
        """Gets all Country models."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                c.*,
                cd.name AS core_destination_name,
                COUNT(al.id) FILTER (WHERE al.property_id IS NOT NULL) AS num_related
            FROM public.countries c
            LEFT JOIN public.properties p ON c.id = p.country_id
            LEFT JOIN public.accommodation_logs al ON p.id = al.property_id
            LEFT JOIN public.core_destinations cd ON c.core_destination_id = cd.id
            GROUP BY c.id, cd.name
            ORDER BY c.name ASC
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                country_summaries = [CountrySummary(**record) for record in records]
                return country_summaries

    async def get_country_by_id(
        self, country_id: UUID = None
    ) -> Sequence[CountrySummary]:
        """Gets a CountrySummary model by ID, joined with its foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                c.*,
                cd.name AS core_destination_name,
                COUNT(al.id) FILTER (WHERE al.property_id IS NOT NULL) AS num_related
            FROM public.countries c
            LEFT JOIN public.properties p ON c.id = p.country_id
            LEFT JOIN public.accommodation_logs al ON p.id = al.property_id
            LEFT JOIN public.core_destinations cd ON c.core_destination_id = cd.id
            WHERE c.id = $1
            GROUP BY c.id, cd.name
            """
        )

        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetchrow(query, country_id)
                if res:
                    return CountrySummary(**res)

    async def get_all_booking_channels(self) -> Sequence[BookingChannelSummary]:
        """Gets all BookingChannel models in the repository, joined with their foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                bc.*,
                COUNT(al.id) AS num_related
            FROM public.booking_channels bc
            LEFT JOIN public.accommodation_logs al ON bc.id = al.booking_channel_id
            GROUP BY bc.id
            ORDER BY bc.name ASC;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                property_summaries = [
                    BookingChannelSummary(**record) for record in records
                ]
                return property_summaries

    async def get_all_agencies(self) -> Sequence[AgencySummary]:
        """Gets all Agency models joined with their foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                a.*,
                COUNT(al.id) AS num_related
            FROM public.agencies a
            LEFT JOIN public.accommodation_logs al ON a.id = al.agency_id
            GROUP BY a.id
            ORDER BY a.name ASC;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                property_summaries = [AgencySummary(**record) for record in records]
                return property_summaries

    async def get_all_portfolios(self) -> Sequence[PortfolioSummary]:
        """Gets all Portfolio models joined with their foreign keys."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                p.*,
                COUNT(DISTINCT pr.id) as num_related_properties, -- Count unique properties
                COUNT(DISTINCT al.id) AS num_related -- Count unique logs
            FROM public.portfolios p
            LEFT JOIN public.properties pr ON p.id = pr.portfolio_id
            LEFT JOIN public.accommodation_logs al ON pr.id = al.property_id -- Adjusted to count logs per property
            GROUP BY p.id
            ORDER BY p.name ASC;
            """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                property_summaries = [PortfolioSummary(**record) for record in records]
                return property_summaries

    async def get_all_trips(self) -> Sequence[TripSummary]:
        """Gets all TripSummary models, including detailed accommodation logs."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                t.id AS trip_id,
                t.trip_name,
                t.created_at AS trip_created_at,
                t.updated_at AS trip_updated_at,
                t.updated_by AS trip_updated_by,
                al.id AS log_id,
                al.primary_traveler,
                cd.name AS core_destination_name,
                cd.id AS core_destination_id,
                c.name AS country_name,
                c.id AS country_id,
                al.date_in,
                al.date_out,
                al.num_pax,
                p.name AS property_name,
                p.id AS property_id,
                p.portfolio_id AS property_portfolio_id,
                pf.name AS property_portfolio,
                bc.name AS booking_channel_name,
                a.name AS agency_name,
                cons.id AS consultant_id,
                cons.first_name AS consultant_first_name,
                cons.last_name AS consultant_last_name,
                cons.is_active AS consultant_is_active,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.trips t
            JOIN public.accommodation_logs al ON t.id = al.trip_id
            JOIN public.properties p ON al.property_id = p.id
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            ORDER BY al.date_in ASC, al.primary_traveler ASC
        """
        )
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query)
                # Transform fetched records into structured TripSummary
                trip_summaries = {}
                for record in records:
                    trip_id = record["trip_id"]
                    if trip_id not in trip_summaries:
                        trip_summaries[trip_id] = TripSummary(
                            id=trip_id,
                            trip_name=record["trip_name"],
                            created_at=record["trip_created_at"],
                            updated_at=record["trip_updated_at"],
                            updated_by=record["trip_updated_by"],
                            accommodation_logs=[],
                        )
                    trip_summaries[trip_id].accommodation_logs.append(
                        AccommodationLogSummary(
                            id=record["log_id"],
                            primary_traveler=record["primary_traveler"],
                            country_name=record["country_name"],
                            core_destination_name=record["core_destination_name"],
                            property_name=record["property_name"],
                            property_id=record["property_id"],
                            property_portfolio_id=record["property_portfolio_id"],
                            property_portfolio=record["property_portfolio"],
                            booking_channel_name=record["booking_channel_name"],
                            agency_name=record["agency_name"],
                            consultant_id=record["consultant_id"],
                            consultant_first_name=record["consultant_first_name"],
                            consultant_last_name=record["consultant_last_name"],
                            consultant_is_active=record["consultant_is_active"],
                            date_in=record["date_in"],
                            date_out=record["date_out"],
                            num_pax=record["num_pax"],
                            created_at=record["created_at"],
                            updated_at=record["updated_at"],
                            updated_by=record["updated_by"],
                        )
                    )

                return list(trip_summaries.values())

    async def get_trip_summary_by_id(self, trip_id: UUID) -> TripSummary:
        """Gets a TripSummary model by its ID."""
        pool = await self._get_pool()
        query = dedent(
            """
            SELECT
                t.id AS trip_id,
                t.trip_name,
                t.created_at AS trip_created_at,
                t.updated_at AS trip_updated_at,
                t.updated_by AS trip_updated_by,
                al.id AS log_id,
                al.primary_traveler,
                cd.name AS core_destination_name,
                cd.id AS core_destination_id,
                c.name AS country_name,
                c.id AS country_id,
                al.date_in,
                al.date_out,
                al.num_pax,
                p.name AS property_name,
                p.id AS property_id,
                p.portfolio_id AS property_portfolio_id,
                pf.name AS property_portfolio,
                bc.name AS booking_channel_name,
                a.name AS agency_name,
                cons.id AS consultant_id,
                cons.first_name AS consultant_first_name,
                cons.last_name AS consultant_last_name,
                cons.is_active AS consultant_is_active,
                al.created_at,
                al.updated_at,
                al.updated_by
            FROM public.trips t
            JOIN public.accommodation_logs al ON t.id = al.trip_id
            JOIN public.properties p ON al.property_id = p.id
            JOIN public.portfolios pf ON p.portfolio_id = pf.id
            JOIN public.consultants cons ON al.consultant_id = cons.id
            LEFT JOIN public.booking_channels bc ON al.booking_channel_id = bc.id
            LEFT JOIN public.agencies a ON al.agency_id = a.id
            LEFT JOIN public.countries c ON p.country_id = c.id
            JOIN public.core_destinations cd ON p.core_destination_id = cd.id
            WHERE t.id = $1
            """
        )

        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                records = await con.fetch(query, trip_id)  # fetch, not fetchrow
                if not records:
                    return None

                trip_summary = TripSummary(
                    id=records[0]["trip_id"],
                    trip_name=records[0]["trip_name"],
                    created_at=records[0]["trip_created_at"],
                    updated_at=records[0]["trip_updated_at"],
                    updated_by=records[0]["trip_updated_by"],
                    accommodation_logs=[],
                )

                for record in records:
                    trip_summary.accommodation_logs.append(
                        AccommodationLogSummary(
                            id=record["log_id"],
                            primary_traveler=record["primary_traveler"],
                            country_name=record["country_name"],
                            core_destination_name=record["core_destination_name"],
                            property_name=record["property_name"],
                            property_id=record["property_id"],
                            property_portfolio_id=record["property_portfolio_id"],
                            property_portfolio=record["property_portfolio"],
                            booking_channel_name=record["booking_channel_name"],
                            agency_name=record["agency_name"],
                            consultant_id=record["consultant_id"],
                            consultant_first_name=record["consultant_first_name"],
                            consultant_last_name=record["consultant_last_name"],
                            consultant_is_active=record["consultant_is_active"],
                            date_in=record["date_in"],
                            date_out=record["date_out"],
                            num_pax=record["num_pax"],
                            created_at=record["created_at"],
                            updated_at=record["updated_at"],
                            updated_by=record["updated_by"],
                        )
                    )

                return trip_summary

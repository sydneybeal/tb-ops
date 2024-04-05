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

"""Services for interacting with travel entries."""
from collections import Counter
from datetime import date
from typing import Sequence, List, Optional
from uuid import UUID
from api.services.summaries.models import (
    AccommodationLogSummary,
    AgencySummary,
    BedNightReport,
    BookingChannelSummary,
    BreakdownItem,
    CountrySummary,
    PortfolioSummary,
    PropertyDetailSummary,
    PropertySummary,
    ReportAggregations,
    ReportInput,
    Overlap,
)
from api.services.summaries.repository.postgres import PostgresSummaryRepository


class SummaryService:
    """Service for interfacing with the travel repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresSummaryRepository()

    # BedNightReport
    async def get_bed_night_report(self, labels: dict) -> Sequence[BedNightReport]:
        """Generates a BedNightReport based on input criteria."""
        accommodation_logs = await self._repo.get_accommodation_logs_by_filter(labels)
        report = self.generate_report(accommodation_logs, labels)
        return report

    def generate_report(
        self, accommodation_logs: Sequence[AccommodationLogSummary], labels: dict
    ) -> BedNightReport:
        """Performs aggregations on AccommodationLogSummary to generate a report."""
        # Convert labels into ReportInput
        report_input = ReportInput(**labels)

        # Initialize aggregation variables
        total_bed_nights = 0
        country_breakdown_counter = Counter()
        month_breakdown_counter = Counter()
        portfolio_breakdown_counter = Counter()
        property_breakdown_counter = Counter()
        consultant_breakdown_counter = Counter()
        core_destination_breakdown_counter = Counter()

        largest_booking = {"bed_nights": 0}

        # Aggregate data
        for log in accommodation_logs:
            country_name = log.country_name if log.country_name else "Unknown"
            portfolio_name = (
                log.property_portfolio if log.property_portfolio else "Unknown"
            )
            property_name = log.property_name if log.property_name else "Unknown"
            consultant_name = (
                log.consultant_display_name
                if log.consultant_display_name
                else "Unknown"
            )
            core_destination_name = (
                log.core_destination_name if log.core_destination_name else "Unknown"
            )

            total_bed_nights += log.bed_nights
            country_breakdown_counter[country_name] += log.bed_nights
            month_breakdown_counter[log.date_in.strftime("%Y-%m")] += log.bed_nights
            portfolio_breakdown_counter[portfolio_name] += log.bed_nights
            property_breakdown_counter[property_name] += log.bed_nights
            consultant_breakdown_counter[consultant_name] += log.bed_nights
            core_destination_breakdown_counter[core_destination_name] += log.bed_nights

            if log.bed_nights > largest_booking.get("bed_nights", 0):
                largest_booking = {
                    "bed_nights": log.bed_nights,
                    "num_nights": (log.date_out - log.date_in).days,
                    "num_pax": log.num_pax,
                    "property_name": log.property_name,
                }

        # Create BreakdownItems
        def create_breakdown(items: Counter) -> List[BreakdownItem]:
            total = sum(items.values())
            return [
                BreakdownItem(
                    name=name, bed_nights=count, percentage=(count / total * 100)
                )
                for name, count in items.items()
            ]

        # Populate ReportAggregations
        report_aggregations = ReportAggregations(
            total_bed_nights=total_bed_nights,
            by_country=create_breakdown(country_breakdown_counter),
            by_month=create_breakdown(month_breakdown_counter),
            by_portfolio=create_breakdown(portfolio_breakdown_counter),
            by_property=create_breakdown(property_breakdown_counter),
            by_consultant=create_breakdown(consultant_breakdown_counter),
            by_core_destination=create_breakdown(core_destination_breakdown_counter),
            largest_booking=largest_booking,
        )

        # Create and return the BedNightReport
        return BedNightReport(
            report_inputs=report_input, calculations=report_aggregations
        )

    # AccommodationLog
    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLogSummary]:
        """Gets all AccommodationLogSummary models."""
        return await self._repo.get_all_accommodation_logs()

    async def get_accommodation_logs_by_filters(
        self, filters: dict
    ) -> Sequence[AccommodationLogSummary]:
        """Gets all AccommodationLogSummary models based on a filter."""
        return await self._repo.get_accommodation_logs_by_filter(filters)

    async def get_related_records_summary(
        self, identifier: UUID, identifier_type: str
    ) -> Sequence[AccommodationLogSummary]:
        """Checks the impact of a modification on related records."""
        filters = {identifier_type: identifier}
        accommodation_logs = await self.get_accommodation_logs_by_filters(filters)

        if not accommodation_logs:
            return {"can_modify": True, "affected_logs": []}

        accommodation_logs_summary = [log.to_json() for log in accommodation_logs]
        return {"can_modify": False, "affected_logs": accommodation_logs_summary}

    async def get_overlaps(self, start_date: date, end_date: date) -> Sequence[Overlap]:
        """Gets records where clients will be overlapping."""
        overlap_data = await self._repo.get_overlaps(start_date, end_date)
        overlaps = [overlap.to_json() for overlap in overlap_data]
        return overlaps

    # Property
    async def get_all_properties(self) -> Sequence[PropertySummary]:
        """Gets all PropertySummary models."""
        return await self._repo.get_all_properties()

    # Property
    async def get_all_property_details(self) -> Sequence[PropertyDetailSummary]:
        """Gets all PropertyDetailSummary models."""
        return await self._repo.get_property_details()

    async def get_property_details_by_id(
        self, property_id: UUID
    ) -> Optional[PropertyDetailSummary]:
        """Gets PropertyDetailSummary model by ID."""
        res = await self._repo.get_property_details(
            entered_only=False, by_id=property_id
        )
        if res:
            return res[0]
        else:
            return None

    # Country
    async def get_all_countries(self) -> Sequence[CountrySummary]:
        """Gets all CountrySummary models."""
        return await self._repo.get_all_countries()

    async def get_country_details_by_id(
        self, country_id: UUID
    ) -> Optional[CountrySummary]:
        """Gets CountrySummary model by ID."""
        return await self._repo.get_country_by_id(country_id)

    # Agency
    async def get_all_agencies(self) -> Sequence[AgencySummary]:
        """Gets all AgencySummary models."""
        return await self._repo.get_all_agencies()

    # BookingChannel
    async def get_all_booking_channels(self) -> Sequence[BookingChannelSummary]:
        """Gets all BookingChannelSummary models."""
        return await self._repo.get_all_booking_channels()

    # Portfolio
    async def get_all_portfolios(self) -> Sequence[PortfolioSummary]:
        """Gets all PortfolioSummary models."""
        return await self._repo.get_all_portfolios()

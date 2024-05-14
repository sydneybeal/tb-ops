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

"""Models for data quality on travel entries."""
from datetime import datetime, date
from typing import Optional, List, Dict
from uuid import UUID, uuid4
from collections import Counter

from pydantic import BaseModel, Field, computed_field
from api.services.summaries.models import AccommodationLogSummary, BaseTrip


class PotentialTrip(BaseTrip):
    """A model representing a potential trip, which is a collection of accommodation logs."""

    review_status: str = Field(default="pending")
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    _trip_name: Optional[str] = None

    @computed_field  # type: ignore[misc]
    @property
    def trip_name(self) -> str:
        """Uses the accommodation logs to assemble the suggested trip name."""
        if not self.accommodation_logs:
            return "No Trip Name Available"

        last_name = self.accommodation_logs[0].primary_traveler.split("/")[0]
        max_pax = max(log.num_pax for log in self.accommodation_logs)

        countries_in_logs = set(
            log.country_name for log in self.accommodation_logs if log.country_name
        )
        core_destinations = set(
            log.core_destination_name
            for log in self.accommodation_logs
            if log.core_destination_name
        )

        # Determine the destination based on the count of core destinations and countries
        if len(countries_in_logs) == 1:
            destination = next(iter(countries_in_logs))
        elif countries_in_logs == {"Australia", "New Zealand"}:
            destination = "Australia & New Zealand"
        else:
            # If there are no specific core destinations mentioned, fall back to countries or special cases
            if len(countries_in_logs) == 1:
                destination = next(iter(countries_in_logs))
            else:
                destination = self._handle_special_cases(
                    countries_in_logs, core_destinations
                )

        earliest_date = min(log.date_in for log in self.accommodation_logs)
        date_title = earliest_date.strftime("%B %Y")

        return f"{last_name} x{max_pax}, {destination}, {date_title}"

    def _handle_special_cases(self, countries, core_destinations):
        # Special handling for regions within Asia and Africa
        asia_lookup = {
            "Southeast Asia": {"Thailand", "Vietnam", "Malaysia", "Singapore"}
        }
        south_america_lookup = {
            "South America": {
                "Argentina",
                "Bolivia",
                "Brazil",
                "Chile",
                "Colombia",
                "Ecuador",
                "Peru",
                "Uruguay",
            }
        }
        africa_lookup = {
            "East Africa": {
                "Kenya",
                "Tanzania",
                "Rwanda",
                "Uganda",
                "Mauritius",
                "Seychelles",
                "Madagascar",
            },
            "Southern Africa": {
                "South Africa",
                "Botswana",
                "Namibia",
                "Zambia",
                "Zimbabwe",
                "Mozambique",
                "Malawi",
            },
            "North Africa": {"Egypt", "Jordan", "Morocco"},
        }

        for region, countries_set in asia_lookup.items():
            if countries_set.intersection(countries):
                return region

        for region, countries_set in south_america_lookup.items():
            if countries_set.intersection(countries):
                return region

        africa_regions = [
            region
            for region, countries_set in africa_lookup.items()
            if countries_set.intersection(countries)
        ]
        if len(africa_regions) == 1:
            return africa_regions[0]
        # If no specific region fits, use a general core destination if one exists
        if len(core_destinations) == 1:
            return next(iter(core_destinations))

        # Default to "Multiple Countries" only if no better label is available
        return "Multiple Countries"

    @trip_name.setter
    def trip_name(self, value: str):
        """Allows setting a specific trip name, bypassing the computed name."""
        self._trip_name = value


class FlaggedTrip(BaseModel):
    """A model representing a potential trip, which is a collection of accommodation logs."""

    id: UUID = Field(default_factory=uuid4)
    trip_name: str
    accommodation_log_ids: List[UUID]
    review_status: str = Field(default="flagged")
    review_notes: Optional[str] = None
    reviewed_at: datetime = Field(default_factory=datetime.now)
    reviewed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class ProgressBreakdown(BaseModel):
    confirmed: int
    potential: int
    percent_complete: str


class MatchingProgress(BaseModel):
    progress_overall: ProgressBreakdown
    progress_by_year: Dict[str, ProgressBreakdown]
    progress_by_destination: Dict[str, ProgressBreakdown]

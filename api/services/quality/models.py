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
from typing import Optional, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, computed_field
from api.services.summaries.models import AccommodationLogSummary


class PotentialTrip(BaseModel):
    """A model representing a potential trip, which is a collection of accommodation logs."""

    id: UUID = Field(default_factory=uuid4)
    # trip_name: Optional[str]
    accommodation_logs: List[AccommodationLogSummary] = []
    review_status: str = Field(default="pending")  # pending, confirmed, ask_for_help
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: Optional[str] = None

    @computed_field  # type: ignore[misc]
    @property
    def total_bed_nights(self) -> int:
        """Calculate the total bed nights for the trip."""
        return sum(log.bed_nights for log in self.accommodation_logs)

    @computed_field  # type: ignore[misc]
    @property
    def number_of_logs(self) -> int:
        """Return the number of accommodation logs in the trip."""
        return len(self.accommodation_logs)

    @computed_field  # type: ignore[misc]
    @property
    def start_date(self) -> Optional[date]:
        """Calculate the start date of the trip by finding the earliest 'date_in' from the logs."""
        if self.accommodation_logs:
            return min(log.date_in for log in self.accommodation_logs)
        return None

    @computed_field  # type: ignore[misc]
    @property
    def end_date(self) -> Optional[date]:
        """Calculate the end date of the trip by finding the latest 'date_out' from the logs."""
        if self.accommodation_logs:
            return max(log.date_out for log in self.accommodation_logs)
        return None

    @computed_field  # type: ignore[misc]
    @property
    def trip_name(self) -> str:
        if not self.accommodation_logs:
            return "No Trip Name Available"

        # Assuming primary_traveler is in the format "LastName/FirstName"
        last_name = self.accommodation_logs[0].primary_traveler.split("/")[0]

        # Maximum number of pax
        max_pax = max(log.num_pax for log in self.accommodation_logs)

        # Extract unique country names and core destinations
        countries_in_logs = set(
            log.country_name for log in self.accommodation_logs if log.country_name
        )
        core_destinations = set(
            log.core_destination_name
            for log in self.accommodation_logs
            if log.core_destination_name
        )

        # Determine the main destination
        if len(countries_in_logs) == 1:
            # If only one country is present, use it directly
            destination = next(iter(countries_in_logs))
        elif len(countries_in_logs) > 1:
            # Use the core destination if multiple countries are involved, replace "Asia" with "Southeast Asia"
            destination = next(
                (
                    dest if dest != "Asia" else "Southeast Asia"
                    for dest in core_destinations
                ),
                "Multiple Destinations",
            )

        # Handle core destinations specifically for Africa using a lookup list
        africa_lookup_list = {
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
        africa_regions = set()
        if len(countries_in_logs) > 1:
            for region, countries in africa_lookup_list.items():
                if countries.intersection(countries_in_logs):
                    africa_regions.add(region)
            if len(africa_regions) == 1:
                destination = next(iter(africa_regions))
            elif "Africa" in [
                log.core_destination_name for log in self.accommodation_logs
            ]:
                destination = "Africa"

        earliest_date = min(log.date_in for log in self.accommodation_logs)
        date_title = earliest_date.strftime("%B %Y")

        # Form the final trip name
        trip_name = f"{last_name} x{max_pax}, {destination}, {date_title}"
        return trip_name

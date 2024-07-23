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

"""Models for travel entries."""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from api.services.auth.models import UserSummary
from api.services.summaries.models import PropertyDetailSummary
from pydantic import BaseModel, Field, computed_field


class Activity(BaseModel):
    """Model for an activity/restaurant of a trip report segment."""

    name: Optional[str] = None
    visit_date: Optional[date] = None
    travelers: Optional[List[UUID]] = None
    type: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class Rating(BaseModel):
    """Model for a rating of a trip report segment."""

    attribute: str
    rating: Optional[str] = None


class Comment(BaseModel):
    """Model for a comment of a trip report segment."""

    attribute: str
    comments: Optional[str] = None


class Segment(BaseModel):
    """Model for a segment of a trip report."""

    date_in: Optional[date] = None
    date_out: Optional[date] = None
    site_inspection_only: bool = False
    attribute_update_comment_id: Optional[UUID] = None
    travelers: Optional[List[UUID]] = None
    property_id: Optional[UUID] = None
    ratings: Optional[List[Rating]] = None
    comments: Optional[List[Comment]] = None

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class TripReport(BaseModel):
    """Record for a trip report."""

    id: UUID = Field(default_factory=uuid4)
    properties: Optional[List[Segment]] = None
    travelers: Optional[List[UUID]] = None
    activities: Optional[List[Activity]] = None
    review_status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class PatchTripReportRequest(BaseModel):
    """Model for updating an existing trip report."""

    trip_report_id: Optional[UUID] = None
    travelers: Optional[List[UUID]] = None
    document_updates: Optional[str] = None
    properties: Optional[List[dict]]  # Accept any dictionary that represents properties
    activities: Optional[List[dict]]  # Accept any dictionary that represents activities
    review_status: str = "draft"
    updated_by: str

    class Config:
        extra = "allow"


class ActivitySummary(BaseModel):
    """Model for an activity/restaurant joined with its foreign key fields."""

    name: Optional[str] = None
    visit_date: Optional[date] = None
    travelers: Optional[List[UserSummary]] = None
    type: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[str] = None
    comments: Optional[str] = None


class SegmentSummary(BaseModel):
    """Model for a segment joined with its foreign key fields."""

    date_in: Optional[date] = None
    date_out: Optional[date] = None
    site_inspection_only: bool = False
    attribute_update_comment_id: Optional[UUID] = None
    attribute_updates_comments: Optional[str] = None
    travelers: Optional[List[UserSummary]] = None
    property_id: Optional[UUID] = None
    ratings: Optional[List[Rating]] = None
    comments: Optional[List[Comment]] = None
    # Embed PropertyDetailSummary directly
    property_details: Optional[PropertyDetailSummary] = None


class TripReportSummary(BaseModel):
    """Record for a trip report joined with its foreign key fields."""

    id: UUID = Field(default_factory=uuid4)
    # TODO join with admin_comments to get the document updates string
    document_updates: Optional[str] = None
    properties: Optional[List[SegmentSummary]] = None
    travelers: Optional[List[UserSummary]] = None
    activities: Optional[List[ActivitySummary]] = None
    review_status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

    @computed_field  # type: ignore[misc]
    @property
    def trip_name(self) -> Optional[str]:
        """Uses the accommodation logs to assemble the suggested trip name."""
        generic_title = "TBD"
        if not self.properties:
            return generic_title

        # Future: use travelers to get names like "Kota, Joleen" instead of "kotat, joleens"
        # traveler_names = ""
        max_pax = len(self.travelers) if self.travelers else None

        countries_in_logs = set(
            log.property_details.country_name
            for log in self.properties
            if log.property_details
        )
        core_destinations = set(
            log.property_details.core_destination_name
            for log in self.properties
            if log.property_details
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

        earliest_date = self._earliest_date_in()
        print(f"{earliest_date=}")
        if earliest_date:
            date_title = earliest_date.strftime("%B %Y")
        else:
            date_title = None

        parts = []
        if destination:
            parts.append(destination)
        if max_pax:
            parts.append(f"x{max_pax}")
        if date_title:
            parts.append(date_title)

        return " ".join(parts) if parts else "TBD"

    def _earliest_date_in(self) -> Optional[date]:
        """Finds the earliest date_in across all properties, handling None values."""
        if not self.properties:
            return None
        dates = [
            segment.date_in
            for segment in self.properties
            if segment.date_in is not None
        ]
        return min(dates) if dates else None

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

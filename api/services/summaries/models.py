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

"""Models for travel summaries."""
from datetime import datetime, date
import json
from typing import Optional, List, Dict
from uuid import UUID, uuid4
from collections import Counter
from abc import ABC, abstractmethod

from pydantic import BaseModel, Field, computed_field


def custom_json_encoder(obj):
    """Specifies return values for non-serializable fields."""
    if isinstance(obj, UUID):
        return str(obj)
    elif isinstance(obj, datetime) or isinstance(obj, date):
        return obj.isoformat()
    # Add more custom encodings here if necessary
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")


class AccommodationLogSummary(BaseModel):
    """Record for an accommodation log summary."""

    id: UUID
    primary_traveler: str
    core_destination_name: str
    core_destination_id: Optional[UUID] = None
    country_name: Optional[str] = None
    country_id: Optional[UUID] = None
    date_in: date
    date_out: date
    num_pax: int
    property_name: str
    property_type: Optional[str] = None
    property_location: Optional[str] = None
    property_latitude: Optional[float] = None
    property_longitude: Optional[float] = None
    property_portfolio_id: UUID
    property_portfolio: str
    booking_channel_name: Optional[str] = None
    agency_name: Optional[str] = None
    consultant_id: UUID
    consultant_first_name: str
    consultant_last_name: str
    consultant_is_active: bool
    property_id: UUID
    booking_channel_id: Optional[UUID] = None
    agency_id: Optional[UUID] = None
    trip_id: Optional[UUID] = None
    trip_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str

    @computed_field  # type: ignore[misc]
    @property
    def bed_nights(self) -> int:
        """Number of bed nights occupied by this record."""
        duration = (self.date_out - self.date_in).days
        return duration * self.num_pax

    @computed_field  # type: ignore[misc]
    @property
    def consultant_display_name(self) -> str:
        """Number of bed nights occupied by this record."""
        return f"{self.consultant_last_name}/{self.consultant_first_name}"

    def to_json(self, **kwargs):
        """Convert the model to a dict, then serialize the dict using the custom encoder."""
        model_dict = self.dict()
        return json.dumps(model_dict, default=custom_json_encoder, **kwargs)


class PropertySummary(BaseModel):
    """Record for a property summary."""

    id: UUID
    name: str
    core_destination_name: str
    country_name: Optional[str] = None
    num_related: Optional[int] = None
    portfolio_name: str
    portfolio_id: UUID
    core_destination_id: UUID
    country_id: Optional[UUID] = None
    property_type: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class PropertyDetailSummary(BaseModel):
    """Record for a property's detail combined with its base attributes."""

    property_id: UUID
    name: str
    core_destination_name: str
    country_name: Optional[str] = None
    num_related: Optional[int] = None
    portfolio_name: str
    portfolio_id: UUID
    core_destination_id: UUID
    country_id: Optional[UUID] = None
    property_type: Optional[str] = None
    price_range: Optional[str] = None
    num_tents: Optional[int] = None
    has_trackers: Optional[bool] = None
    has_wifi_in_room: Optional[bool] = None
    has_wifi_in_common_areas: Optional[bool] = None
    has_hairdryers: Optional[bool] = None
    has_pool: Optional[bool] = None
    has_heated_pool: Optional[bool] = None
    has_credit_card_tipping: Optional[bool] = None
    is_child_friendly: Optional[bool] = None
    is_handicap_accessible: Optional[bool] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class CountrySummary(BaseModel):
    """Record for a country with its core destination name."""

    id: UUID
    name: str
    core_destination_id: UUID
    core_destination_name: str
    num_related: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class AgencySummary(BaseModel):
    """Record for an agency with its number of records."""

    id: UUID
    name: str
    num_related: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class BookingChannelSummary(BaseModel):
    """Record for a booking channel with its number of records."""

    id: UUID
    name: str
    num_related: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class PortfolioSummary(BaseModel):
    """Record for a portfolio with its number of records."""

    id: UUID
    name: str
    num_related_properties: Optional[int] = None
    num_related: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class ReportInput(BaseModel):
    """Defines the input parameters for generating a Bed Night Report."""

    start_date: Optional[str] = None
    end_date: Optional[str] = None
    country_name: Optional[str] = None
    consultant_name: Optional[str] = None
    portfolio_name: Optional[str] = None
    property_names: Optional[List[str]] = None
    core_destination: Optional[str] = None
    agency: Optional[str] = None
    booking_channel: Optional[str] = None


class BreakdownItem(BaseModel):
    """Represents a single item in a breakdown aggregation within the report."""

    name: str
    bed_nights: int
    percentage: float


class ReportAggregations(BaseModel):
    """Contains aggregated data for the Bed Night Report, structured into various breakdowns."""

    total_bed_nights: int
    by_country: Optional[List[BreakdownItem]] = None
    by_month: Optional[List[BreakdownItem]] = None
    by_portfolio: Optional[List[BreakdownItem]] = None
    by_property: Optional[List[BreakdownItem]] = None
    by_consultant: Optional[List[BreakdownItem]] = None
    by_core_destination: Optional[List[BreakdownItem]] = None
    largest_booking: Optional[Dict[str, str | int]] = None
    # More breakdowns can be added as needed without changing the overall structure.


class BedNightReport(BaseModel):
    """The top-level model representing a complete Bed Night Report,
    including input parameters and calculated aggregations.
    """

    report_inputs: ReportInput
    calculations: ReportAggregations


class Overlap(BaseModel):
    """Accommodation logs that overlap between two travelers"""

    traveler1: str
    date_in_traveler1: date
    date_out_traveler1: date
    booking_channel_traveler1: Optional[str] = None
    traveler2: str
    date_in_traveler2: date
    date_out_traveler2: date
    booking_channel_traveler2: Optional[str] = None
    overlap_days: int
    property_id: UUID
    property_name: str
    country_name: Optional[str] = None
    core_destination_name: str
    consultant_first_name_traveler1: str
    consultant_last_name_traveler1: str
    consultant_first_name_traveler2: str
    consultant_last_name_traveler2: str
    consultant_is_active_traveler1: bool
    consultant_is_active_traveler2: bool
    agency_name_traveler1: Optional[str] = None
    agency_name_traveler2: Optional[str] = None

    def to_json(self, **kwargs):
        """Convert the model to a dict, then serialize the dict using the custom encoder."""
        model_dict = self.dict()
        return json.dumps(model_dict, default=custom_json_encoder, **kwargs)


class BaseTrip(ABC, BaseModel):
    id: UUID = Field(default_factory=uuid4)
    accommodation_logs: List[AccommodationLogSummary]
    lead_source: Optional[str] = None
    inquiry_date: Optional[date] = None
    deposit_date: Optional[date] = None
    final_payment_date: Optional[date] = None
    sell_price: Optional[float] = None
    cost_from_suppliers: Optional[float] = None
    notes: Optional[str] = None
    flights_handled_by: Optional[str] = None
    full_coverage_policy: Optional[bool] = None
    travel_advisor_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: Optional[str] = None

    @computed_field  # type: ignore[misc]
    @property
    def core_destination(self) -> Optional[str]:
        """Calculate the core destination of the trip by finding the most common 'destination_name' from the logs."""
        if self.accommodation_logs:
            destination_counts = Counter(
                log.core_destination_name for log in self.accommodation_logs
            )
            return (
                destination_counts.most_common(1)[0][0] if destination_counts else None
            )
        return None

    @computed_field  # type: ignore[misc]
    @property
    def primary_travelers(self) -> Optional[List[str]]:
        """Calculate the list of primary travelers on this trip."""
        if self.accommodation_logs:
            # Using a set to collect unique primary_traveler names
            unique_travelers = {log.primary_traveler for log in self.accommodation_logs}
            return list(unique_travelers)
        return None

    @computed_field  # type: ignore[misc]
    @property
    def total_bed_nights(self) -> int:
        """Calculate the total bed nights for the trip."""
        return sum(log.bed_nights for log in self.accommodation_logs)

    @computed_field  # type: ignore[misc]
    @property
    def num_pax(self) -> Optional[int]:
        """Calculate the highest number of pax."""
        # TODO consider other primary travelers in the group like Bealx2 and Horanx2 = 4
        if self.accommodation_logs:
            nums = [
                log.num_pax
                for log in self.accommodation_logs
                if log.num_pax is not None
            ]
            return max(nums) if nums else None
        return None

    @computed_field  # type: ignore[misc]
    @property
    def number_of_logs(self) -> int:
        """Return the number of accommodation logs in the trip."""
        return len(self.accommodation_logs)

    @computed_field  # type: ignore[misc]
    @property
    def start_date(self) -> Optional[date]:
        """Calculate the start date of the trip by finding the earliest 'date_in' from the logs."""
        # TODO: does this need to be manually stored like the day their international travel starts?
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
    def consultant_display_name(self) -> Optional[str]:
        """Calculate the consultant of the trip by finding the most common 'consultant' from the logs."""
        # TODO tie this with user?
        if self.accommodation_logs:
            consultant_counts = Counter(
                log.consultant_display_name for log in self.accommodation_logs
            )
            return consultant_counts.most_common(1)[0][0] if consultant_counts else None
        return None

    @computed_field  # type: ignore[misc]
    @property
    def booking_channels(self) -> Optional[List[str]]:
        """Calculate the list of primary booking channels on this trip."""
        # TODO: probably delete this since it's in the attached Accommodation Logs
        if self.accommodation_logs:
            # Using a set to collect unique booking booking channel names
            unique_booking_channels = {
                log.booking_channel_name
                for log in self.accommodation_logs
                if log.booking_channel_name
            }
            return list(unique_booking_channels)
        return []

    @computed_field  # type: ignore[misc]
    @property
    def days_to_confirm(self) -> Optional[int]:
        """Number of days from inquiry to confirmation."""
        if self.inquiry_date and self.deposit_date:
            return (self.deposit_date - self.inquiry_date).days
        return None

    @computed_field  # type: ignore[misc]
    @property
    def trip_length_days(self) -> Optional[int]:
        """Length of trip (first check-in to final check-out) in days."""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None

    @computed_field  # type: ignore[misc]
    @property
    def commission(self) -> Optional[float]:
        """Difference between cost and sell price."""
        if self.sell_price and self.cost_from_suppliers:
            return self.sell_price - self.cost_from_suppliers
        return None

    @computed_field  # type: ignore[misc]
    @property
    def margin(self) -> Optional[float]:
        """Decimal margin based on commission divided by sell price."""
        if self.commission and self.sell_price:
            return abs(self.commission / self.sell_price)
        return None

    @computed_field  # type: ignore[misc]
    @property
    def properties(self) -> Optional[List[str]]:
        """List of string of property names."""
        # TODO: probably delete this since it's in the attached Accommodation Logs
        if self.accommodation_logs:
            # Using a set to collect unique booking booking channel names
            unique_properties = {
                log.property_name
                for log in self.accommodation_logs
                if log.property_name
            }
            return list(unique_properties)
        return []

    @computed_field  # type: ignore[misc]
    @property
    def conservation_levy_africa(self) -> Optional[int]:
        """Amount of conservation levy to account for Africa passengers."""
        if self.num_pax and self.core_destination == "Africa":
            return self.num_pax * 125
        return None

    @computed_field  # type: ignore[misc]
    @property
    def tons_emitted_africa(self) -> Optional[float]:
        """Amount of tons emitted to account for Africa passengers."""
        if self.total_bed_nights and self.core_destination == "Africa":
            return self.total_bed_nights * 0.351
        return None


class TripSummary(BaseTrip):
    trip_name: str
    travel_advisor_name: Optional[str] = None

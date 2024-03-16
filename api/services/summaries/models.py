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
from uuid import UUID

from pydantic import BaseModel, computed_field


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
    created_at: datetime
    updated_at: datetime
    updated_by: str


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
    property_name: Optional[str] = None
    core_destination: Optional[str] = None


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
    traveler2: str
    date_in_traveler2: date
    date_out_traveler2: date
    overlap_days: int
    property_id: UUID
    property_name: str
    country_name: Optional[str] = None
    core_destination_name: str
    consultant_first_name: str
    consultant_last_name: str

    def to_json(self, **kwargs):
        """Convert the model to a dict, then serialize the dict using the custom encoder."""
        model_dict = self.dict()
        return json.dumps(model_dict, default=custom_json_encoder, **kwargs)

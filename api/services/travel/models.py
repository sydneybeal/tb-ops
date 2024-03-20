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
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, computed_field


class CoreDestination(BaseModel):
    """Record for a core destination."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class Agency(BaseModel):
    """Record for an external agency."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class Portfolio(BaseModel):
    """Record for a portfolio that operates properties."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class BookingChannel(BaseModel):
    """Record for an external booking channel."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class Consultant(BaseModel):
    """Record for an internal consultant."""

    id: UUID = Field(default_factory=uuid4)
    first_name: str
    last_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

    @computed_field  # type: ignore[misc]
    @property
    def display_name(self) -> str:
        """Number of bed nights occupied by this record."""
        return f"{self.last_name}/{self.first_name}"


class Country(BaseModel):
    """Record for a country."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    core_destination_id: UUID
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class Property(BaseModel):
    """Record for a property - hotel, lodge, ship, etc."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    portfolio_id: Optional[UUID] = None
    representative: Optional[str] = None
    country_id: Optional[UUID] = None
    core_destination_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class PropertyDetail(BaseModel):
    """Record for a property's detail."""

    property_id: UUID
    property_type: Optional[str] = None
    price_range: Optional[str] = None
    num_tents: Optional[int] = None
    has_trackers: Optional[bool] = None
    has_wifi_in_room: Optional[bool] = None
    has_wifi_in_common_areas: Optional[bool] = None
    has_hairdryers: Optional[bool] = None
    has_pool: Optional[bool] = None
    has_heated_pool: Optional[bool] = None
    is_handicap_accessible: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class AccommodationLog(BaseModel):
    """Record for an accommodation."""

    id: UUID = Field(default_factory=uuid4)
    property_id: UUID
    consultant_id: UUID
    primary_traveler: str
    num_pax: int
    date_in: date
    date_out: date
    booking_channel_id: Optional[UUID] = None
    agency_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

    @computed_field  # type: ignore[misc]
    @property
    def bed_nights(self) -> int:
        """Number of bed nights occupied by this record."""
        duration = (self.date_out - self.date_in).days
        return duration * self.num_pax


# class NewEntity(BaseModel):
#     """Model containing the required fields to create a new entity by name."""

#     name: str


# class NewPropertyEntity(BaseModel):
#     """Model containing the required fields to create a new property."""

#     name: str
#     portfolio: Optional[str] = None
#     country_id: Optional[UUID] = None
#     core_destination_id: Optional[UUID] = None


class PatchAccommodationLogRequest(BaseModel):
    """A request object model that contains IDs of its related entities,
    or string data to create them."""

    log_id: Optional[UUID] = None
    # either selected property or NewPropertyEntity for property
    property_id: Optional[UUID] = None
    new_property_name: Optional[str] = None
    new_property_portfolio_id: Optional[UUID] = None
    new_property_portfolio_name: Optional[str] = None
    new_property_country_id: Optional[UUID] = None
    new_property_core_destination_id: Optional[UUID] = None
    new_property_core_destination_name: Optional[str] = None
    # required entry data
    consultant_id: UUID
    primary_traveler: str
    num_pax: int
    date_in: date
    date_out: date
    # either selected agency or NewEntity model for booking channel
    booking_channel_id: Optional[UUID] = None
    new_booking_channel_name: Optional[str] = None
    # either selected agency or NewEntity model for agency
    agency_id: Optional[UUID] = None
    new_agency_name: Optional[str] = None
    updated_by: str


class PatchPropertyRequest(BaseModel):
    """A request object model that contains information for a new Property."""

    property_id: Optional[UUID] = None
    name: str
    portfolio_id: Optional[UUID] = None
    country_id: Optional[UUID] = None
    core_destination_id: Optional[UUID] = None
    updated_by: str


class PatchConsultantRequest(BaseModel):
    """A request object model that contains information for a new Consultant."""

    consultant_id: Optional[UUID] = None
    first_name: str
    last_name: str
    is_active: bool
    updated_by: str


class PatchAgencyRequest(BaseModel):
    """A request object model that contains information for a new Agency."""

    agency_id: Optional[UUID] = None
    name: str
    updated_by: str


class PatchBookingChannelRequest(BaseModel):
    """A request object model that contains information for a new BookingChannel."""

    booking_channel_id: Optional[UUID] = None
    name: str
    updated_by: str


class PatchPortfolioRequest(BaseModel):
    """A request object model that contains information for a new Portfolio."""

    portfolio_id: Optional[UUID] = None
    name: str
    updated_by: str


class PatchCountryRequest(BaseModel):
    """A request object model that contains information for a new Country."""

    country_id: Optional[UUID] = None
    name: str
    core_destination_id: Optional[UUID] = None
    updated_by: str


class PatchPropertyDetailRequest(BaseModel):
    """A request object model that contains Property detail information."""

    property_id: UUID
    property_type: Optional[str] = None
    price_range: Optional[str] = None
    num_tents: Optional[int] = None
    has_trackers: Optional[bool] = None
    has_wifi_in_room: Optional[bool] = None
    has_wifi_in_common_areas: Optional[bool] = None
    has_hairdryers: Optional[bool] = None
    has_pool: Optional[bool] = None
    has_heated_pool: Optional[bool] = None
    is_handicap_accessible: Optional[bool] = None
    updated_by: str

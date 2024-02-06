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
from uuid import UUID

from pydantic import BaseModel, computed_field


class CoreDestination(BaseModel):
    """Record for a core destination."""

    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    updated_by: str


class Agency(BaseModel):
    """Record for an external agency."""

    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    updated_by: str


class BookingChannel(BaseModel):
    """Record for an external booking channel."""

    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime
    updated_by: str


class Consultant(BaseModel):
    """Record for an internal consultant."""

    id: UUID
    first_name: str
    last_name: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    updated_by: str


class Country(BaseModel):
    """Record for a country."""

    id: UUID
    name: str
    core_destination_id: UUID
    created_at: datetime
    updated_at: datetime
    updated_by: str


class Property(BaseModel):
    """Record for a property - hotel, lodge, ship, etc."""

    id: UUID
    name: str
    portfolio: str
    representative: str
    country_id: Optional[UUID] = None
    core_destination_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class AccommodationLog(BaseModel):
    """Record for an accommodation."""

    id: UUID
    property_id: UUID
    consultant_id: UUID
    primary_traveler: str
    num_pax: int
    date_in: date
    date_out: date
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

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
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, computed_field


class AccommodationLogSummary(BaseModel):
    """Record for an accommodation log summary."""

    id: UUID
    primary_traveler: str
    core_destination_name: str
    country_name: Optional[str] = None
    date_in: date
    date_out: date
    num_pax: int
    property_name: str
    property_portfolio: str
    property_representative: str
    booking_channel_name: Optional[str] = None
    agency_name: Optional[str] = None
    consultant_id: UUID
    consultant_first_name: str
    consultant_last_name: str
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
    def consultant_name(self) -> str:
        """Number of bed nights occupied by this record."""
        return f"{self.consultant_last_name}/{self.consultant_first_name}"


class PropertySummary(BaseModel):
    """Record for a property summary."""

    id: UUID
    name: str
    core_destination_name: str
    country_name: Optional[str] = None
    portfolio_name: str
    representative_name: str
    core_destination_id: UUID
    country_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str

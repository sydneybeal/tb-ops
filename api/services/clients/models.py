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

"""Models for client entries."""
from datetime import datetime, date
from uuid import UUID
from typing import Optional, Sequence
from api.services.reservations.models import Reservation

from pydantic import BaseModel, computed_field


class Client(BaseModel):
    """Data model for a client."""

    id: UUID
    first_name: str
    last_name: str
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    subjective_score: Optional[int] = None
    birth_date: Optional[date] = None
    referred_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str


class ClientSummary(BaseModel):
    """Data model for a client."""

    id: UUID
    first_name: str
    last_name: str
    last_name: str
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    subjective_score: Optional[int] = None
    birth_date: Optional[date] = None
    referred_by_id: Optional[UUID] = None
    referred_by_first_name: Optional[str] = None
    referred_by_last_name: Optional[str] = None
    # Reservations
    reservations: Optional[Sequence[Reservation]] = None
    # Number of clients referred by this client
    referrals_count: int = 0
    created_at: datetime
    updated_at: datetime
    updated_by: str

    @computed_field  # type: ignore[misc]
    @property
    def display_name(self) -> str:
        """Display name for this client."""
        return f"{self.last_name}/{self.first_name}"

    @computed_field  # type: ignore[misc]
    @property
    def referred_by_display_name(self) -> Optional[str]:
        """Display name for the client who referred this client."""
        if self.referred_by_last_name and self.referred_by_first_name:
            return f"{self.referred_by_last_name}/{self.referred_by_first_name}"
        return None

    @computed_field  # type: ignore[misc]
    @property
    def reservations_count(self) -> int:
        """Number of reservations."""
        if self.reservations:
            return len(self.reservations)
        return 0

    @computed_field  # type: ignore[misc]
    @property
    def lifetime_spend(self) -> float:
        """Sum of costs of reservations."""
        if self.reservations:
            return sum(
                reservation.cost
                for reservation in self.reservations
                if reservation.cost is not None
            )
        return 0.0

    @computed_field  # type: ignore[misc]
    @property
    def trips_plus_referrals(self) -> int:
        """Sum of reservations plus referrals."""
        return self.reservations_count + self.referrals_count

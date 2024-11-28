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
from uuid import UUID, uuid4
from typing import Optional, Sequence, Tuple
from api.services.reservations.models import Reservation

from pydantic import BaseModel, Field, computed_field


class Client(BaseModel):
    """Data model for a client."""

    id: UUID = Field(default_factory=uuid4)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_apt_suite: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    address_country: Optional[str] = None
    cb_name: Optional[str] = None
    cb_interface_id: Optional[str] = None
    cb_profile_no: Optional[str] = None
    cb_notes: Optional[str] = None
    cb_profile_type: Optional[str] = None
    cb_courtesy_title: Optional[str] = None
    cb_primary_agent_name: Optional[str] = None
    cb_salutation: Optional[str] = None
    cb_issue_country: Optional[str] = None
    cb_relationship: Optional[str] = None
    cb_active: Optional[str] = None
    cb_passport_expire: Optional[str] = None
    cb_gender: Optional[str] = None
    cb_created_date: Optional[date] = None
    cb_modified_date: Optional[date] = None
    cb_referred_by: Optional[str] = None
    cb_marketing_sources: Optional[list[str]] = None
    subjective_score: Optional[int] = None
    birth_date: Optional[date] = None
    referred_by_id: Optional[UUID] = None
    num_referrals: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class ClientSummary(BaseModel):
    """Data model for a client."""

    id: UUID = Field(default_factory=uuid4)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    address_country: Optional[str] = None
    address_apt_suite: Optional[str] = None
    cb_name: Optional[str] = None
    cb_interface_id: Optional[str] = None
    cb_profile_no: Optional[str] = None
    cb_notes: Optional[str] = None
    cb_profile_no: Optional[str] = None
    cb_profile_type: Optional[str] = None
    cb_courtesy_title: Optional[str] = None
    cb_primary_agent_name: Optional[str] = None
    cb_salutation: Optional[str] = None
    cb_issue_country: Optional[str] = None
    cb_relationship: Optional[str] = None
    cb_active: Optional[str] = None
    cb_passport_expire: Optional[str] = None
    cb_gender: Optional[str] = None
    cb_created_date: Optional[date] = None
    cb_modified_date: Optional[date] = None
    cb_referred_by: Optional[str] = None
    cb_marketing_sources: Optional[list[str]] = None
    subjective_score: Optional[int] = None
    birth_date: Optional[date] = None
    referred_by_id: Optional[UUID] = None
    referred_by_first_name: Optional[str] = None
    referred_by_last_name: Optional[str] = None
    num_referrals: Optional[int] = None
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


class PatchClientRequest(BaseModel):
    client_id: Optional[UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    referred_by_id: Optional[UUID] = None
    updated_by: str


class ReferralMatch(BaseModel):
    source_client_id: UUID
    source_client_cb_name: str
    source_client_birth_date: Optional[date] = None
    source_client_avg_trip_spend: float
    source_client_total_trip_spend: float
    source_client_earliest_trip: Optional[date] = None
    source_client_latest_trip: Optional[date] = None
    source_client_num_trips: int = 0
    new_client_id: UUID
    new_client_cb_name: str
    new_client_birth_date: Optional[date] = None
    new_client_avg_trip_spend: float
    new_client_total_trip_spend: float
    new_client_earliest_trip: Optional[date] = None
    new_client_latest_trip: Optional[date] = None
    new_client_num_trips: int = 0


class ReferralNode(BaseModel):
    id: UUID
    name: str
    birth_date: Optional[date] = None
    total_spend: float
    avg_spend: float
    earliest_trip: Optional[date] = None
    latest_trip: Optional[date] = None
    num_trips: int = 0
    children: Sequence["ReferralNode"] = []

    class Config:
        orm_mode = True

    @computed_field  # type: ignore[misc]
    @property
    def total_associated_referrals(self) -> int:
        """Sum of reservations plus referrals."""
        child_referrals = sum([ref.total_associated_referrals for ref in self.children])
        return len(self.children) + child_referrals

    @computed_field  # type: ignore[misc]
    @property
    def total_associated_trips(self) -> int:
        """Count of trips for the client and all referrals."""
        child_num_trips = sum(ref.total_associated_trips for ref in self.children)
        return self.num_trips + child_num_trips

    @computed_field  # type: ignore[misc]
    @property
    def total_associated_referral_spend(self) -> float:
        """Sum of spend for the client and all referrals."""
        child_referral_spend = sum(
            ref.total_associated_referral_spend for ref in self.children
        )
        return self.total_spend + child_referral_spend

    @computed_field  # type: ignore[misc]
    @property
    def avg_associated_referral_spend(self) -> float:
        """Calculates the average spend including the client and all of their direct and indirect referrals."""

        # Helper function to calculate the total spend and count of all nodes recursively
        def total_spend_and_count(node: "ReferralNode") -> Tuple[float, int]:
            total_spend = node.avg_spend
            total_count = 1  # Start with the current node
            for child in node.children:
                child_spend, child_count = total_spend_and_count(child)
                total_spend += child_spend
                total_count += child_count
            return total_spend, total_count

        total_spend, total_count = total_spend_and_count(self)
        if total_count == 0:
            return 0  # Prevent division by zero, although total_count should always be at least 1
        return total_spend / total_count

    @computed_field  # type: ignore[misc]
    @property
    def age(self) -> Optional[int]:
        """Calculates the age based on the birth date."""
        if self.birth_date is None:
            return None
        today = date.today()
        age = today.year - self.birth_date.year
        if (today.month, today.day) < (self.birth_date.month, self.birth_date.day):
            age -= 1
        return age

    @computed_field  # type: ignore[misc]
    @property
    def relationship_length(self) -> Optional[int]:
        """Calculates the age based on the birth date."""
        if self.earliest_trip is None:
            return None
        today = date.today()
        age = today.year - self.earliest_trip.year
        if (today.month, today.day) < (
            self.earliest_trip.month,
            self.earliest_trip.day,
        ):
            age -= 1
        return age

    @computed_field  # type: ignore[misc]
    @property
    def travel_recency(self) -> Optional[int]:
        """Calculates the age based on the birth date."""
        if self.latest_trip is None:
            return None
        today = date.today()
        age = today.year - self.latest_trip.year
        if (today.month, today.day) < (
            self.latest_trip.month,
            self.latest_trip.day,
        ):
            age -= 1
        return age

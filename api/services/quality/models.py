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
    trip_name: Optional[str]
    accommodation_logs: List[AccommodationLogSummary] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    review_status: str = Field(
        default="pending"
    )  # pending, confirmed, rejected, ask_for_help
    reviewed_at: Optional[datetime] = None

    @property
    def total_bed_nights(self) -> int:
        """Calculate the total bed nights for the trip."""
        return sum(log.bed_nights for log in self.accommodation_logs)

    @property
    def number_of_logs(self) -> int:
        """Return the number of accommodation logs in the trip."""
        return len(self.accommodation_logs)

    @property
    def start_date(self) -> Optional[date]:
        """Calculate the start date of the trip by finding the earliest 'date_in' from the logs."""
        if self.accommodation_logs:
            return min(log.date_in for log in self.accommodation_logs)
        return None

    @property
    def end_date(self) -> Optional[date]:
        """Calculate the end date of the trip by finding the latest 'date_out' from the logs."""
        if self.accommodation_logs:
            return max(log.date_out for log in self.accommodation_logs)
        return None

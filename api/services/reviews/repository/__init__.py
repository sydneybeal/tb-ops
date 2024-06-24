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

"""Repository for data related to travel reviews/trip reports."""
import datetime
from uuid import UUID
from abc import ABC, abstractmethod
from typing import Sequence, Optional
from api.services.reviews.models import TripReport, TripReportSummary, AdminComment


class ReviewsRepository(ABC):
    """Abstract repository for travel-related models."""

    # TripReport
    @abstractmethod
    async def upsert_trip_report(self, trip_report: TripReport) -> dict:
        """Adds a TripReport model to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_trip_reports(
        self, trip_report_id: Optional[UUID] = None
    ) -> Optional[Sequence[TripReportSummary]]:
        """Gets a single TripReportSummary model in the repository by its id."""
        raise NotImplementedError

    # @abstractmethod
    # async def get_trip_reports(self) -> Sequence[TripReport]:
    #     """Gets all TripReport models in the repository."""
    #     raise NotImplementedError

    # AdminComment
    @abstractmethod
    async def upsert_admin_comments(
        self, admin_comments: Sequence[AdminComment]
    ) -> dict:
        """Adds a sequence of AdminComment models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_admin_comment(self, admin_comment_id: UUID) -> AdminComment:
        """Gets a single AdminComment model in the repository by its id."""
        raise NotImplementedError

    @abstractmethod
    async def get_admin_comments(self) -> Sequence[AdminComment]:
        """Gets all AdminComment models in the repository."""
        raise NotImplementedError

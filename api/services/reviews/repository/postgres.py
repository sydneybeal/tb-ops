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

"""Postgres repository for data related to travel reviews/trip reports."""
import datetime
from uuid import UUID
from typing import Sequence
from api.adapters.repository import PostgresMixin
from api.services.reviews.models import TripReport, AdminComment
from api.services.reviews.repository import ReviewsRepository


class PostgresReviewsRepository(PostgresMixin, ReviewsRepository):
    """Abstract repository for travel-related models."""

    # TripReport
    async def upsert_trip_report(self, trip_report: TripReport) -> dict:
        """Adds a TripReport model to the repository."""
        # inserted_count = sum(1 for row in result if row["inserted"])
        # updated_count = result.rowcount - inserted_count
        inserted_count = 1
        updated_count = 0
        return {"inserted": inserted_count, "updated": updated_count}

    async def get_trip_report(self, trip_report_id: UUID) -> TripReport:
        """Gets a single TripReport model in the repository by its id."""
        raise NotImplementedError

    async def get_trip_reports(self) -> Sequence[TripReport]:
        """Gets all TripReport models in the repository."""
        raise NotImplementedError

    # AdminComment
    async def upsert_admin_comments(
        self, admin_comments: Sequence[AdminComment]
    ) -> dict:
        """Adds a sequence of AdminComment models to the repository."""
        # inserted_count = sum(1 for row in result if row["inserted"])
        # updated_count = result.rowcount - inserted_count
        inserted_count = 1
        updated_count = 0
        return {"inserted": inserted_count, "updated": updated_count}

    async def get_admin_comment(self, admin_comment_id: UUID) -> AdminComment:
        """Gets a single AdminComment model in the repository by its id."""
        raise NotImplementedError

    async def get_admin_comments(self) -> Sequence[AdminComment]:
        """Gets all AdminComment models in the repository."""
        raise NotImplementedError

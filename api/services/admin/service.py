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

"""Services for interacting with travel entries."""
from typing import Optional, Sequence
from uuid import UUID

from api.services.admin.models import AdminComment, AdminCommentSummary
from api.services.admin.repository.postgres import PostgresAdminRepository


class AdminService:
    """Service for interfacing with the audit repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresAdminRepository()

    async def add_admin_comments(self, admin_comments: Sequence[AdminComment]) -> dict:
        """Inserts a sequence of admin comments."""
        return await self._repo.upsert(admin_comments)

    async def get_summaries(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminCommentSummary]:
        """Gets a sequence of admin comments."""
        return await self._repo.get_summaries(trip_report_id, property_id, comment_id)

    async def get(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminComment]:
        """Gets a sequence of admin comments."""
        return await self._repo.get(trip_report_id, property_id, comment_id)

    async def delete(self, comment_ids: Sequence[UUID]) -> bool:
        """Deletes a sequence of admin comments."""
        return await self._repo.delete(comment_ids)

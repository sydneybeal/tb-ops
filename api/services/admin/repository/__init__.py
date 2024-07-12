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

"""Repositories for admin-related data."""
from abc import ABC, abstractmethod
from typing import Sequence, Optional
from uuid import UUID

from api.services.admin.models import AdminComment, AdminCommentSummary


class AdminRepository(ABC):
    """Abstract repository for travel-related models."""

    # AdminComment
    @abstractmethod
    async def upsert(self, admin_comments: Sequence[AdminComment]) -> dict:
        """Adds a sequence of AdminComment models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_summaries(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminCommentSummary]:
        """Gets AdminComment models from the repository, optionally by its id."""
        raise NotImplementedError

    @abstractmethod
    async def get(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminComment]:
        """Gets AdminComment models from the repository, optionally by IDs."""
        raise NotImplementedError

    async def delete(
        self,
        comment_ids: Sequence[UUID],
    ) -> bool:
        """Deletes AdminComment models from the repository by IDs."""
        raise NotImplementedError

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
from typing import Sequence
from api.services.summaries.models import AccommodationLogSummary, PropertySummary
from api.services.summaries.repository.postgres import PostgresSummaryRepository


class SummaryService:
    """Service for interfacing with the travel repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresSummaryRepository()

    # AccommodationLog
    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLogSummary]:
        """Gets all AccommodationLogSummary models."""
        return await self._repo.get_all_accommodation_logs()

    # Property
    async def get_all_properties(self) -> Sequence[PropertySummary]:
        """Gets all PropertySummary models."""
        return await self._repo.get_all_properties()

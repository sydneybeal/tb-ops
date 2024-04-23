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

"""Repositories for travel-related data."""
import datetime
import uuid
from abc import ABC, abstractmethod
from typing import Sequence
from api.services.summaries.models import AccommodationLogSummary

from api.services.quality.models import (
    PotentialTrip,
)


class QualityRepository(ABC):
    """Abstract repository for data summary models."""

    # PotentialTrip
    @abstractmethod
    async def get_unmatched_accommodation_logs(self) -> PotentialTrip:
        """Gets accommodation logs without an associated trip_id."""
        raise NotImplementedError

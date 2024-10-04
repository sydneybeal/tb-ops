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

"""Repositories for data related to currency conversion."""
from abc import ABC, abstractmethod
from typing import Sequence, Optional
from datetime import date
from api.services.currency.models import DailyRate


class CurrencyRepository(ABC):
    """Abstract repository for travel-related models."""

    @abstractmethod
    async def add(self, daily_rates: Sequence[DailyRate]) -> None:
        """Adds an iterable of DailyRate objects to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_rates_date(self, rate_date: date) -> Sequence[DailyRate]:
        """Gets all DailyRate objects for a given date."""
        raise NotImplementedError

    @abstractmethod
    async def get_currency_for_date(
        self, target_currency: str, rate_date: date, base_currency: str = "USD"
    ) -> Optional[DailyRate]:
        """Gets a DailyRate object for given base and target currencies on a specific date."""
        raise NotImplementedError

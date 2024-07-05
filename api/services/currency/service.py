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

"""Services for interacting with currency conversion entries."""
# from typing import Optional, Sequence, Union
# from uuid import UUID
from datetime import date
from typing import Sequence, Union, Optional
from api.services.currency.models import DailyRate
from api.services.currency.repository.postgres import PostgresCurrencyRepository


class CurrencyService:
    """Service for interfacing with the currency conversion repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresCurrencyRepository()

    async def get_rates_date(self, rate_date: date) -> Sequence[DailyRate]:
        """Returns DailyRate objects for a given date."""
        return await self._repo.get_rates_date(rate_date)

    async def add_rates(self, daily_rates: Sequence[DailyRate]) -> int:
        """Inserts DailyRate objects."""
        return await self._repo.add_rates(daily_rates)

    async def get_currency_for_date(
        self, target_currency: str, rate_date: date, base_currency: str = "USD"
    ) -> Optional[DailyRate]:
        """Gets a DailyRate object for given base and target currencies on a specific date."""
        return await self._repo.get_currency_for_date(
            rate_date, target_currency, base_currency
        )

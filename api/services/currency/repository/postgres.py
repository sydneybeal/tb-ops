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
"""Postgres Repository for travel-related data."""
from datetime import date
from typing import Sequence, Optional
from textwrap import dedent

# from asyncpg.connection import inspect

from api.adapters.repository import PostgresMixin
from api.services.currency.repository import CurrencyRepository
from api.services.currency.models import DailyRate


class PostgresCurrencyRepository(PostgresMixin, CurrencyRepository):
    """Implementation of the AuditRepository ABC for Postgres."""

    async def add(self, daily_rates: Sequence[DailyRate]) -> None:
        """Adds an iterable of DailyRate objects to the repository."""
        raise NotImplementedError

    async def get_rates_date(self, rate_date: date) -> Sequence[DailyRate]:
        """Gets all DailyRate objects for a given date."""
        pool = await self._get_pool()
        query = """
        SELECT base_currency, target_currency, currency_name, conversion_rate, rate_date, rate_time
        FROM public.daily_rates
        WHERE rate_date = $1;
        """
        async with pool.acquire() as con:
            async with con.transaction():
                rows = await con.fetch(query, rate_date)

        # Convert rows to DailyRate instances
        daily_rates = [DailyRate(**row) for row in rows]

        return daily_rates

    async def get_currency_for_date(
        self, rate_date: date, target_currency: str, base_currency: str
    ) -> Optional[DailyRate]:
        """Gets a DailyRate object for given base and target currencies on a specific date."""
        raise NotImplementedError

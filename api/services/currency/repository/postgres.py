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
from datetime import date, datetime
from typing import Sequence, Optional, Tuple
from textwrap import dedent
from uuid import UUID
import json
from asyncpg import UniqueViolationError


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
        SELECT *
        FROM public.daily_rates
        WHERE rate_date = $1;
        """
        async with pool.acquire() as con:
            async with con.transaction():
                rows = await con.fetch(query, rate_date)

        # Convert rows to DailyRate instances
        daily_rates = [DailyRate(**row) for row in rows]

        return daily_rates

    async def add_rates(self, daily_rates: Sequence[DailyRate]) -> int:
        """Gets all DailyRate objects for a given date."""
        # TODO fix this pseudocode to implement insertion
        pool = await self._get_pool()
        query = """
        INSERT INTO public.daily_rates
        base_currency, target_currency, currency_name, conversion_rate, rate_date, rate_time
        ($1)
        """
        async with pool.acquire() as con:
            async with con.transaction():
                rows = await con.execute(query, daily_rates)

        return len(daily_rates)

    async def upsert_daily_rates(
        self, daily_rates: Sequence[DailyRate]
    ) -> list[Tuple[UUID, bool, str]]:
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.daily_rates (
                id,
                base_currency,
                target_currency,
                currency_name,
                conversion_rate,
                rate_date,
                rate_time,
                updated_by,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            )
            ON CONFLICT (base_currency, target_currency, rate_date) DO UPDATE SET
                currency_name = EXCLUDED.currency_name,
                conversion_rate = EXCLUDED.conversion_rate,
                rate_time = EXCLUDED.rate_time,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            RETURNING id, (xmax = 0) AS was_inserted;
        """
        )
        results = []
        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                for rate in daily_rates:
                    try:
                        args = (
                            rate.id,
                            rate.base_currency.strip(),
                            rate.target_currency.strip(),
                            rate.currency_name.strip(),
                            rate.conversion_rate,
                            rate.rate_date,
                            rate.rate_time,
                            rate.updated_by,
                            datetime.now(),
                        )
                        row = await con.fetchrow(query, *args)
                        if row:
                            # Append log ID and whether it was an insert (True) or an update (False)
                            results.append((row["id"], row["was_inserted"], ""))
                    except UniqueViolationError:
                        # Construct a more user-friendly error message
                        error_message = (
                            f"A record for {rate.target_currency} from date"
                            f"{rate.rate_date} already exists."
                        )
                        results.append((rate.id, False, error_message))
        return results

    async def get_currency_for_date(
        self, rate_date: date, target_currency: str, base_currency: str
    ) -> Optional[DailyRate]:
        """Gets a DailyRate object for given base and target currencies on a specific date."""
        pool = await self._get_pool()
        query = """
        SELECT *
        FROM public.daily_rates
        WHERE rate_date = $1 AND target_currency = $2 AND base_currency = $3;
        """
        async with pool.acquire() as con:
            async with con.transaction():
                res = await con.fetchrow(
                    query, rate_date, target_currency, base_currency
                )
                if res:
                    return DailyRate(**res)

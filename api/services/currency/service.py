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
from collections import defaultdict
from typing import Optional, Sequence, Tuple, Dict, List, Any
from api.services.audit.service import AuditService
from api.services.audit.models import AuditLog
from api.services.currency.models import DailyRate, PatchDailyRateRequest
from api.services.currency.repository.postgres import PostgresCurrencyRepository


class CurrencyService:
    """Service for interfacing with the currency conversion repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._audit_svc = AuditService()
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

    async def process_daily_rate_requests(
        self, daily_rate_requests: Sequence[PatchDailyRateRequest]
    ) -> dict:
        """Adds or edits daily rates in the repository."""
        messages = []
        prepared_data = [
            await self.prepare_daily_rate_data(rate_request, messages)
            for rate_request in daily_rate_requests
        ]
        valid_data = [data for data in prepared_data if data[0] is not None]
        if valid_data:
            valid_rates_to_upsert, audit_logs = zip(*valid_data)
            # Perform the upsert operation for valid logs
            results = await self._repo.upsert_daily_rates(valid_rates_to_upsert)
            inserted_count = 0
            updated_count = 0
            for _, was_inserted, error_message in results:
                if error_message:
                    messages.append(error_message)
                else:
                    if was_inserted:
                        inserted_count += 1
                    else:
                        updated_count += 1
            await self.process_audit_logs(
                [log for log in audit_logs if log is not None]
            )
        else:
            audit_logs = []
        summarized_audit_logs = self.summarize_audit_logs(audit_logs)

        return {
            "summarized_audit_logs": summarized_audit_logs,
            "messages": messages,
        }

    async def process_audit_logs(self, audit_logs):
        """Calls audit service to insert audit logs to the database."""
        await self._audit_svc.add_audit_logs(audit_logs)

    def summarize_audit_logs(self, audit_logs: List) -> Dict[str, Any]:
        """Gives an overview of audit logs with counts for updates and inserts."""
        summary = defaultdict(lambda: defaultdict(int))  # Using int to keep counts

        for audit_log in audit_logs:
            category = audit_log.table_name
            action = audit_log.action
            summary[category][action] += 1

        # Convert defaultdict to a regular dict for JSON serialization
        summary_dict = {
            category: dict(actions) for category, actions in summary.items()
        }

        return summary_dict

    async def prepare_daily_rate_data(
        self, rate_request: PatchDailyRateRequest, messages: list[str]
    ) -> Tuple[Optional[DailyRate], Optional[AuditLog]]:
        """Resolves and prepares an agency patch for insertion or update."""
        # Check if this agency exists and needs updating

        # Check for a name conflict with a different agency
        existing_rate = await self.get_currency_for_date(
            rate_request.target_currency,
            rate_request.rate_date,
            rate_request.base_currency,
        )
        print(rate_request)

        if existing_rate:
            if (
                rate_request.target_currency == existing_rate.target_currency
                and rate_request.base_currency == existing_rate.base_currency
                and rate_request.currency_name == existing_rate.currency_name
                and rate_request.conversion_rate == existing_rate.conversion_rate
            ):
                # No changes detected, return a message indicating so
                error_message = "No changes were detected."
                messages.append(error_message)
                return None, None
            # If updating, return the existing agency with possibly updated fields
            updated_rate = DailyRate(
                base_currency=rate_request.base_currency,
                target_currency=rate_request.target_currency,
                currency_name=rate_request.currency_name,
                conversion_rate=rate_request.conversion_rate,
                rate_date=rate_request.rate_date,
                rate_time=rate_request.rate_time,
                updated_by=rate_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="daily_rates",
                record_id=existing_rate.id,
                user_name=updated_rate.updated_by,
                before_value=existing_rate.dict(),
                after_value=updated_rate.dict(),
                action="update",
            )
            return updated_rate, audit_log
        else:
            # If new, prepare the new agency data
            new_rate = DailyRate(
                base_currency=rate_request.base_currency,
                target_currency=rate_request.target_currency,
                currency_name=rate_request.currency_name,
                conversion_rate=rate_request.conversion_rate,
                rate_date=rate_request.rate_date,
                rate_time=rate_request.rate_time,
                updated_by=rate_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="daily_rates",
                record_id=new_rate.id,
                user_name=new_rate.updated_by,
                before_value={},
                after_value=new_rate.dict(),
                action="insert",
            )
            return new_rate, audit_log

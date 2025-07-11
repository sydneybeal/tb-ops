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
from datetime import datetime
from typing import Iterable, Optional

import json

# from typing import Tuple
# from uuid import UUID
# from typing import Optional, Sequence
from textwrap import dedent

# from asyncpg.connection import inspect

from api.adapters.repository import PostgresMixin
from api.services.audit.repository import AuditRepository
from api.services.audit.models import AuditLog


class PostgresAuditRepository(PostgresMixin, AuditRepository):
    """Implementation of the AuditRepository ABC for Postgres."""

    async def add(self, audit_logs: Iterable[str]) -> None:
        """Adds an iterable of AuditLog JSON strings to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.audit_logs (
                id,
                table_name,
                record_id,
                user_name,
                before_value,
                after_value,
                action,
                action_timestamp
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, NOW()::TIMESTAMP WITHOUT TIME ZONE
            )
            ON CONFLICT (id) 
            DO NOTHING;
        """
        )
        async with pool.acquire() as con:
            async with con.transaction():
                for audit_log_json in audit_logs:
                    # Assuming audit_log_json is a JSON string representation of your AuditLog
                    audit_log = json.loads(
                        audit_log_json
                    )  # This converts it back to a dict for access
                    await con.execute(
                        query,
                        audit_log["id"],
                        audit_log["table_name"],
                        audit_log["record_id"],
                        audit_log["user_name"],
                        json.dumps(
                            audit_log["before_value"]
                        ),  # Ensure this is a JSON-formatted string
                        json.dumps(
                            audit_log["after_value"]
                        ),  # Ensure this is a JSON-formatted string
                        audit_log["action"],
                    )
        print(f"Inserted {len(audit_logs)} audit logs into the repository.")

    async def get(
        self,
        action_timestamp: Optional[datetime] = None,
        table_name: Optional[str] = None,
        record_id: Optional[str] = None,
    ) -> Iterable[AuditLog]:
        """Returns AuditLogs for all actions in the repository after a given date.

        Args:
            action_timestamp (datetime): date/time to be filtered on

        Returns:
            List[AuditLog]
        """
        pool = await self._get_pool()
        base_query = """
        SELECT *
        FROM public.audit_logs
        """
        values = []
        conditions = []

        if action_timestamp and not (table_name and record_id):
            conditions.append("action_timestamp >= $1")
            values.append(action_timestamp)

        if table_name:
            conditions.append("table_name = ${}".format(len(values) + 1))
            values.append(table_name)

        if record_id:
            conditions.append("record_id = ${}".format(len(values) + 1))
            values.append(record_id)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        base_query += " ORDER BY action_timestamp DESC;"
        print("Audit logs query:")
        print(values)

        async with pool.acquire() as con:
            async with con.transaction():
                rows = await con.fetch(base_query, *values)

        # Process each record to handle JSON fields correctly
        audit_logs = []
        for record in rows:
            # Convert asyncpg.Record to dict to allow modifications
            record_dict = dict(record)

            # Deserialize JSON fields
            for field in ["before_value", "after_value"]:
                if record_dict[field] is not None and isinstance(
                    record_dict[field], str
                ):
                    record_dict[field] = json.loads(record_dict[field])

            # Create AuditLog instances
            audit_logs.append(AuditLog(**record_dict))

        return audit_logs

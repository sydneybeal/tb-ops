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
"""Postgres Repository for admin-related data."""
import json
from textwrap import dedent
from typing import Optional, Sequence
from uuid import UUID

from api.adapters.repository import PostgresMixin
from api.services.admin.models import AdminComment
from api.services.admin.repository import AdminRepository


class PostgresAdminRepository(PostgresMixin, AdminRepository):
    """Implementation of the AdminRepository ABC for Postgres."""

    async def upsert(self, admin_comments: Sequence[AdminComment]) -> dict:
        """Adds a sequence of AdminComment models to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.admin_comments (
                id, trip_report_id, property_id, comment_type, comment, status, reported_by, created_at, updated_at
            ) VALUES {}
            ON CONFLICT (trip_report_id, comment_type, COALESCE(property_id, '00000000-0000-0000-0000-000000000000')) DO UPDATE SET
                comment = EXCLUDED.comment,
                status = EXCLUDED.status,
                reported_by = EXCLUDED.reported_by,
                updated_at = EXCLUDED.updated_at
            RETURNING (xmax = 0) AS inserted;
            """
        )

        values = [
            (
                str(admin_comment.id),
                (
                    str(admin_comment.trip_report_id)
                    if admin_comment.trip_report_id
                    else None
                ),
                str(admin_comment.property_id) if admin_comment.property_id else None,
                admin_comment.comment_type,
                admin_comment.comment,
                admin_comment.status,
                (
                    [str(reporter) for reporter in admin_comment.reported_by]
                    if admin_comment.reported_by
                    else None
                ),
                admin_comment.created_at,
                admin_comment.updated_at,
            )
            for admin_comment in admin_comments
        ]

        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                value_str = ", ".join(
                    f"(${i * 9 + 1}, ${i * 9 + 2}, ${i * 9 + 3}, ${i * 9 + 4}, ${i * 9 + 5}, ${i * 9 + 6}, ${i * 9 + 7}, ${i * 9 + 8}, ${i * 9 + 9})"
                    for i in range(len(values))
                )
                query = query.format(value_str)
                flat_values = [item for sublist in values for item in sublist]
                result = await con.fetch(query, *flat_values)
                inserted_count = sum(1 for row in result if row["inserted"])
                updated_count = len(result) - inserted_count

        return {"inserted": inserted_count, "updated": updated_count}

    async def get(self, comment_id: Optional[UUID] = None) -> Sequence[AdminComment]:
        """Gets AdminComment models from the repository, optionally by its id."""
        pool = await self._get_pool()
        base_query = """
        SELECT *
        FROM public.admin_comments
        """
        values = []
        conditions = []

        # TODO: change this to trip report ID & property ID
        if comment_id:
            conditions.append("id = ${}".format(len(values) + 1))
            values.append(comment_id)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        base_query += " ORDER BY updated_at DESC;"
        print("Admin comments query:")
        print(values)

        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                rows = await con.fetch(base_query, *values)

        admin_comments = []
        for record in rows:
            admin_comments.append(AdminComment(**record))

        return admin_comments

    # async def get(
    #     self,
    #     action_timestamp: Optional[datetime] = None,
    #     table_name: Optional[str] = None,
    #     record_id: Optional[str] = None,
    # ) -> Iterable[AuditLog]:
    #     """Returns AuditLogs for all actions in the repository after a given date.

    #     Args:
    #         action_timestamp (datetime): date/time to be filtered on

    #     Returns:
    #         List[AuditLog]
    #     """
    #     pool = await self._get_pool()
    #     base_query = """
    #     SELECT *
    #     FROM public.audit_logs
    #     """
    #     values = []
    #     conditions = []

    #     if action_timestamp and not (table_name and record_id):
    #         conditions.append("action_timestamp >= $1")
    #         values.append(action_timestamp)

    #     if table_name:
    #         conditions.append("table_name = ${}".format(len(values) + 1))
    #         values.append(table_name)

    #     if record_id:
    #         conditions.append("record_id = ${}".format(len(values) + 1))
    #         values.append(record_id)

    #     if conditions:
    #         base_query += " WHERE " + " AND ".join(conditions)

    #     base_query += " ORDER BY action_timestamp DESC;"
    #     print("Audit logs query:")
    #     print(values)

    #     async with pool.acquire() as con:
    #         async with con.transaction():
    #             rows = await con.fetch(base_query, *values)

    #     # Process each record to handle JSON fields correctly
    #     audit_logs = []
    #     for record in rows:
    #         # Convert asyncpg.Record to dict to allow modifications
    #         record_dict = dict(record)

    #         # Deserialize JSON fields
    #         for field in ["before_value", "after_value"]:
    #             if record_dict[field] is not None and isinstance(
    #                 record_dict[field], str
    #             ):
    #                 record_dict[field] = json.loads(record_dict[field])

    #         # Create AuditLog instances
    #         audit_logs.append(AuditLog(**record_dict))

    #     return audit_logs

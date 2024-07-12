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
from api.services.admin.models import AdminComment, AdminCommentSummary
from api.services.admin.repository import AdminRepository
from api.services.auth.models import UserSummary


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

    async def get_summaries(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminCommentSummary]:
        """Gets AdminCommentSummary models from the repository, optionally by IDs."""
        pool = await self._get_pool()
        base_query = """
            SELECT
                ac.id,
                ac.trip_report_id,
                ac.property_id,
                p.name AS property_name,
                c.name AS property_country,
                cd.name AS property_core_destination,
                ac.comment_type,
                ac.comment,
                ac.status,
                ac.created_at,
                ac.updated_at,
                array_agg(u.email) AS reported_by_emails,
                array_agg(u.role) AS reported_by_roles
            FROM
                public.admin_comments ac
            LEFT JOIN
                public.properties p ON ac.property_id = p.id
            LEFT JOIN
                public.countries c ON p.country_id = c.id
            LEFT JOIN
                public.core_destinations cd ON p.core_destination_id = cd.id
            LEFT JOIN LATERAL (
                SELECT
                    u.id, u.email, u.role
                FROM
                    public.users u
                WHERE
                    u.id = ANY (
                        SELECT jsonb_array_elements_text(ac.reported_by)::uuid
                    )
            ) u ON true
            WHERE ac.comment <> ''
            GROUP BY
                ac.id, ac.trip_report_id, ac.property_id, p.name, c.name, cd.name
            ORDER BY
                ac.updated_at DESC
        """
        values = []
        conditions = []

        if comment_id:
            conditions.append("ac.id = ${}".format(len(values) + 1))
            values.append(comment_id)

        if trip_report_id:
            conditions.append("ac.trip_report_id = ${}".format(len(values) + 1))
            values.append(comment_id)

        if property_id:
            conditions.append("ac.property_id = ${}".format(len(values) + 1))
            values.append(comment_id)

        if conditions:
            base_query += " AND ".join(conditions)

        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                rows = await con.fetch(base_query, *values)

        admin_comments = []
        for record in rows:
            reported_by_users = []
            for email, role in zip(
                record["reported_by_emails"], record["reported_by_roles"]
            ):
                reported_by_users.append(UserSummary(email=email, role=role))
            admin_comments.append(
                AdminCommentSummary(
                    **{
                        k: v
                        for k, v in record.items()
                        if k not in ["reported_by_emails", "reported_by_roles"]
                    },
                    reported_by=reported_by_users,
                )
            )

        return admin_comments

    async def get(
        self,
        trip_report_id: Optional[UUID] = None,
        property_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminComment]:
        """Gets AdminComment models from the repository, optionally by IDs."""
        pool = await self._get_pool()
        base_query = """
            SELECT
            *
            FROM
            public.admin_comments
        """
        values = []
        conditions = []

        if comment_id:
            conditions.append("id = ${}".format(len(values) + 1))
            values.append(comment_id)

        if trip_report_id:
            conditions.append("trip_report_id = ${}".format(len(values) + 1))
            values.append(trip_report_id)

        if property_id:
            conditions.append("property_id = ${}".format(len(values) + 1))
            values.append(property_id)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

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

    async def delete(
        self,
        comment_ids: Sequence[UUID],
    ) -> bool:
        """Deletes AdminComment models from the repository by IDs."""
        if not comment_ids:
            print("No comment IDs provided, nothing to delete.")
            return False

        pool = await self._get_pool()
        # Convert UUIDs to strings that can be used in SQL query
        ids = tuple(str(id) for id in comment_ids)

        query = dedent(
            f"""
            DELETE FROM public.admin_comments
            WHERE id = ANY($1::uuid[])
            """
        )

        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                # Execute the delete query with parameterized input to prevent SQL injection
                result = await con.execute(query, ids)
                # `execute` returns a string like 'DELETE 1' if a row was deleted successfully
                deleted_rows = int(result.split()[1])
                if deleted_rows == 0:
                    print(
                        f"No comments found with IDs: {comment_ids}, nothing was deleted."
                    )
                    return False
                print(f"Successfully deleted {deleted_rows} admin comments.")
                return True

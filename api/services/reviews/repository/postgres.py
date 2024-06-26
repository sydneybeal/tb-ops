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

"""Postgres repository for data related to travel reviews/trip reports."""
import datetime
import json
from typing import Optional
from uuid import UUID
from textwrap import dedent
from typing import Sequence
from api.adapters.repository import PostgresMixin
from api.services.reviews.models import (
    TripReport,
    TripReportSummary,
    AdminComment,
    SegmentSummary,
    ActivitySummary,
)
from api.services.auth.models import User, UserSummary
from api.services.reviews.repository import ReviewsRepository


class PostgresReviewsRepository(PostgresMixin, ReviewsRepository):
    """Abstract repository for travel-related models."""

    # TripReport
    async def upsert_trip_report(self, trip_report: TripReport) -> dict:
        """Adds a TripReport model to the repository."""
        pool = await self._get_pool()
        query = dedent(
            """
            INSERT INTO public.trip_reviews (
                id, travelers, properties, activities, review_status, created_at, updated_at, updated_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
            )
            ON CONFLICT (id) DO UPDATE SET
                travelers = EXCLUDED.travelers,
                properties = EXCLUDED.properties,
                activities = EXCLUDED.activities,
                review_status = EXCLUDED.review_status,
                updated_at = EXCLUDED.updated_at,
                updated_by = EXCLUDED.updated_by
            RETURNING (xmax = 0) AS inserted;
            """
        )

        # Convert UUIDs to strings for insertion
        travelers = (
            [str(traveler) for traveler in trip_report.travelers]
            if trip_report.travelers
            else None
        )
        properties = (
            [seg.model_dump() for seg in trip_report.properties]
            if trip_report.properties
            else None
        )
        activities = (
            [act.model_dump() for act in trip_report.activities]
            if trip_report.activities
            else None
        )

        values = (
            str(trip_report.id),
            travelers,
            json.dumps(properties, default=str),  # Serialize properties to JSON string
            json.dumps(activities, default=str),  # Serialize activities to JSON string
            trip_report.review_status,
            trip_report.created_at,  # Pass datetime object directly
            trip_report.updated_at,  # Pass datetime object directly
            trip_report.updated_by,
        )

        async with pool.acquire() as con:
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                result = await con.fetch(query, *values)
                inserted_count = sum(1 for row in result if row["inserted"])
                updated_count = len(result) - inserted_count

        return {"inserted": inserted_count, "updated": updated_count}

    def safe_json_loads(self, data):
        try:
            if not data or data == "null":
                return []
            return json.loads(data)
        except json.JSONDecodeError:
            print("Failed to decode JSON:", data)
            return []
        except TypeError:
            print("TypeError with data:", data)
            return []

    async def get_trip_reports(
        self, trip_report_id: Optional[UUID] = None
    ) -> Optional[Sequence[TripReportSummary]]:
        """Gets TripReports model in the repository, optionally by its id."""
        pool = await self._get_pool()

        base_query = """
            SELECT 
                tr.id,
                tr.properties,
                tr.activities,
                tr.review_status,
                tr.created_at,
                tr.updated_at,
                tr.updated_by,
                jsonb_agg(DISTINCT jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS traveler_details,
                jsonb_agg(DISTINCT jsonb_build_object('property_id', attr_comments.property_id, 'comment', attr_comments.comment)) AS attribute_comments,
                json_agg(DISTINCT doc_comments.comment) FILTER (WHERE doc_comments.comment IS NOT NULL) AS document_updates
            FROM public.trip_reviews tr
            LEFT JOIN LATERAL (
                SELECT u.id, u.email, u.role
                FROM public.users u
                WHERE u.id = ANY(
                    SELECT jsonb_array_elements_text(
                        CASE jsonb_typeof(tr.travelers) 
                            WHEN 'array' THEN tr.travelers 
                            ELSE '[]'::jsonb 
                        END
                    )::uuid
                )
            ) u ON true
            LEFT JOIN public.admin_comments doc_comments ON doc_comments.trip_report_id = tr.id AND doc_comments.comment_type = 'document_update'
            LEFT JOIN public.admin_comments attr_comments ON attr_comments.trip_report_id = tr.id AND attr_comments.comment_type = 'attribute_update'
        """

        if trip_report_id:
            query = base_query + " WHERE tr.id = $1 GROUP BY tr.id"
        else:
            query = base_query + " GROUP BY tr.id"

        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                if trip_report_id:
                    res = await con.fetch(query, trip_report_id)
                else:
                    res = await con.fetch(query)

                if not res:
                    return None

                trip_reports = []
                for row in res:
                    data = dict(row)
                    raw_travelers = data.get("traveler_details", [])
                    travelers = [
                        traveler
                        for traveler in raw_travelers
                        if all(
                            traveler.get(key) is not None
                            for key in ["id", "email", "role"]
                        )
                    ]

                    # Map traveler UUIDs to their details
                    traveler_ids = {
                        UUID(traveler["id"]): traveler for traveler in travelers
                    }

                    properties_json = self.safe_json_loads(data["properties"])
                    activities_json = self.safe_json_loads(data["activities"])
                    attribute_comments = data["attribute_comments"]

                    comments_by_property = {}
                    for comment in attribute_comments:
                        property_id = str(comment.get("property_id"))
                        comment_text = comment.get("comment", "")
                        if property_id not in comments_by_property:
                            comments_by_property[property_id] = []
                        comments_by_property[property_id].append(comment_text)

                    processed_properties = []
                    processed_activities = []

                    for prop in properties_json:
                        prop["travelers"] = [
                            traveler_ids.get(UUID(tid), {})
                            for tid in prop.get("travelers", [])
                        ]
                        prop["ratings"] = prop.get("ratings", [])
                        prop["comments"] = prop.get("comments", [])
                        prop_comments = comments_by_property.get(
                            str(prop["property_id"]), []
                        )
                        # Filter out None values and ensure all elements are strings
                        prop_comments = [
                            str(comment)
                            for comment in prop_comments
                            if comment is not None
                        ]
                        prop["attribute_updates_comments"] = " ".join(prop_comments)
                        processed_properties.append(SegmentSummary(**prop))

                    for act in activities_json:
                        act["travelers"] = [
                            traveler_ids.get(UUID(tid), {})
                            for tid in act.get("travelers", [])
                        ]
                        if (
                            all(
                                act.get(key) is None
                                for key in [
                                    "name",
                                    "visit_date",
                                    "type",
                                    "location",
                                    "rating",
                                    "comments",
                                ]
                            )
                            and not act["travelers"]
                        ):
                            # Skip appending this activity since it's effectively empty
                            continue
                        processed_activities.append(ActivitySummary(**act))

                    data["travelers"] = [
                        UserSummary(**traveler) for traveler in travelers
                    ]
                    data["properties"] = processed_properties
                    data["activities"] = processed_activities

                    # Ensure document_updates is a list, use empty list if None
                    document_updates = (
                        data.get("document_updates")
                        if data.get("document_updates") is not None
                        else []
                    )

                    # Join the comments, ensuring none are None
                    if document_updates:
                        data["document_updates"] = " ".join(
                            comment for comment in document_updates
                        )

                    trip_reports.append(TripReportSummary(**data))

                return trip_reports if trip_reports else None

    # AdminComment
    async def upsert_admin_comments(
        self, admin_comments: Sequence[AdminComment]
    ) -> dict:
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
                    json.dumps(
                        [str(reporter) for reporter in admin_comment.reported_by]
                    )
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

    async def get_admin_comment(self, admin_comment_id: UUID) -> AdminComment:
        """Gets a single AdminComment model in the repository by its id."""
        raise NotImplementedError

    async def get_admin_comments(self) -> Sequence[AdminComment]:
        """Gets all AdminComment models in the repository."""
        raise NotImplementedError

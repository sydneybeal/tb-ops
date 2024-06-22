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
            trip_report.status,
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

    async def get_trip_report(
        self, trip_report_id: UUID
    ) -> Optional[TripReportSummary]:
        """Gets a single TripReport model in the repository by its id."""
        pool = await self._get_pool()
        query = """
            SELECT 
                tr.id,
                tr.properties,
                tr.activities,
                tr.review_status,
                tr.created_at,
                tr.updated_at,
                tr.updated_by,
                jsonb_agg(DISTINCT jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS traveler_details,
                doc_comments.comment AS document_updates,
                attr_comments.property_id AS attr_property_id,
                attr_comments.comment AS attribute_updates_comments
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
            WHERE tr.id = $1
            GROUP BY tr.id, doc_comments.comment, attr_comments.property_id, attr_comments.comment
        """
        async with pool.acquire() as con:
            await con.set_type_codec(
                "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            await con.set_type_codec(
                "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
            )
            async with con.transaction():
                res = await con.fetch(query, trip_report_id)
                if res:
                    data = dict(res[0])  # Use the first row to initialize data
                    travelers = data["traveler_details"]

                    if travelers:
                        data["travelers"] = [
                            UserSummary(**traveler)
                            for traveler in travelers
                            if traveler["id"] and traveler["email"] and traveler["role"]
                        ]
                    else:
                        data["travelers"] = []

                    properties = (
                        json.loads(data["properties"]) if data["properties"] else []
                    )
                    activities = (
                        json.loads(data["activities"]) if data["activities"] else []
                    )

                    # Initialize empty lists if properties or activities are None
                    data["properties"] = []
                    data["activities"] = []

                    comments_by_property = {}
                    for record in res:
                        property_id = record["attr_property_id"]
                        comment = record["attribute_updates_comments"]
                        if property_id:
                            property_id_str = str(property_id)
                            if property_id_str not in comments_by_property:
                                comments_by_property[property_id_str] = []
                            comments_by_property[property_id_str].append(comment)

                    # Join users for properties and activities travelers
                    traveler_ids = {
                        traveler.id: traveler for traveler in data["travelers"]
                    }

                    def get_user_summary(user_id):
                        return traveler_ids.get(UUID(user_id))

                    for prop in properties:
                        if "travelers" in prop and prop["travelers"]:
                            prop["travelers"] = [
                                get_user_summary(tid)
                                for tid in prop["travelers"]
                                if get_user_summary(tid)
                            ]
                        prop["attribute_updates_comments"] = " ".join(
                            comments_by_property.get(str(prop["property_id"]), [])
                        )
                        data["properties"].append(SegmentSummary(**prop))

                    for act in activities:
                        if "travelers" in act and act["travelers"]:
                            act["travelers"] = [
                                get_user_summary(tid)
                                for tid in act["travelers"]
                                if get_user_summary(tid)
                            ]
                        data["activities"].append(ActivitySummary(**act))

                    # Add document updates
                    data["document_updates"] = res[0]["document_updates"]

                    ret = TripReportSummary(**data)
                    return ret
                return None

    # async def get_trip_report(
    #     self, trip_report_id: UUID
    # ) -> Optional[TripReportSummary]:
    #     """Gets a single TripReport model in the repository by its id."""
    #     pool = await self._get_pool()
    #     query = """
    #         SELECT
    #             tr.id,
    #             tr.properties,
    #             tr.activities,
    #             tr.review_status,
    #             tr.created_at,
    #             tr.updated_at,
    #             tr.updated_by,
    #             jsonb_agg(DISTINCT jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS traveler_details,
    #             doc_comments.comment AS document_updates,
    #             attr_comments.property_id AS attr_property_id,
    #             attr_comments.comment AS attribute_updates_comments
    #         FROM public.trip_reviews tr
    #         LEFT JOIN LATERAL (
    #             SELECT u.id, u.email, u.role
    #             FROM public.users u
    #             WHERE u.id = ANY(
    #                 SELECT jsonb_array_elements_text(
    #                     CASE jsonb_typeof(tr.travelers)
    #                         WHEN 'array' THEN tr.travelers
    #                         ELSE '[]'::jsonb
    #                     END
    #                 )::uuid
    #             )
    #         ) u ON true
    #         LEFT JOIN public.admin_comments doc_comments ON doc_comments.trip_report_id = tr.id AND doc_comments.comment_type = 'document_update'
    #         LEFT JOIN public.admin_comments attr_comments ON attr_comments.trip_report_id = tr.id AND attr_comments.comment_type = 'attribute_update'
    #         WHERE tr.id = $1
    #         GROUP BY tr.id, doc_comments.comment, attr_comments.property_id, attr_comments.comment
    #     """
    #     async with pool.acquire() as con:
    #         await con.set_type_codec(
    #             "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         await con.set_type_codec(
    #             "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         async with con.transaction():
    #             res = await con.fetchrow(query, trip_report_id)
    #             if res:
    #                 data = dict(res)
    #                 travelers = data["traveler_details"]

    #                 if travelers:
    #                     data["travelers"] = [
    #                         UserSummary(**traveler)
    #                         for traveler in travelers
    #                         if traveler["id"] and traveler["email"] and traveler["role"]
    #                     ]
    #                 else:
    #                     data["travelers"] = []

    #                 properties = (
    #                     json.loads(data["properties"]) if data["properties"] else []
    #                 )
    #                 activities = (
    #                     json.loads(data["activities"]) if data["activities"] else []
    #                 )

    #                 # Initialize empty lists if properties or activities are None
    #                 data["properties"] = []
    #                 data["activities"] = []

    #                 comments_by_property = {}
    #                 for record in res:
    #                     property_id = record["attr_property_id"]
    #                     comment = record["attribute_updates_comments"]
    #                     if property_id:
    #                         property_id_str = str(property_id)
    #                         if property_id_str not in comments_by_property:
    #                             comments_by_property[property_id_str] = []
    #                         comments_by_property[property_id_str].append(comment)

    #                 # Join users for properties and activities travelers
    #                 traveler_ids = {
    #                     traveler.id: traveler for traveler in data["travelers"]
    #                 }

    #                 def get_user_summary(user_id):
    #                     return traveler_ids.get(UUID(user_id))

    #                 for prop in properties:
    #                     if "travelers" in prop and prop["travelers"]:
    #                         prop["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in prop["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["properties"].append(SegmentSummary(**prop))

    #                 for act in activities:
    #                     if "travelers" in act and act["travelers"]:
    #                         act["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in act["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["activities"].append(ActivitySummary(**act))

    #                 # Add document updates and attribute updates comments
    #                 print(res["document_updates"])
    #                 data["document_updates"] = res["document_updates"]

    #                 properties_dicts = [prop for prop in properties]

    #                 # Update properties with comments
    #                 updated_properties_dicts = [
    #                     {
    #                         **prop,
    #                         "attribute_updates_comments": comments_by_property.get(
    #                             str(prop["property_id"]), []
    #                         ),
    #                         "site_inspection_only": prop.get(
    #                             "site_inspection_only", False
    #                         ),  # Ensure boolean
    #                     }
    #                     for prop in properties_dicts
    #                 ]

    #                 # Convert dictionaries back to SegmentSummary objects
    #                 data["properties"] = [
    #                     SegmentSummary(**prop) for prop in updated_properties_dicts
    #                 ]

    #                 ret = TripReportSummary(**data)
    #                 return ret
    #             return None

    # async def get_trip_report(
    #     self, trip_report_id: UUID
    # ) -> Optional[TripReportSummary]:
    #     """Gets a single TripReport model in the repository by its id."""
    #     pool = await self._get_pool()
    #     query = """
    #         SELECT
    #             tr.id,
    #             tr.properties,
    #             tr.activities,
    #             tr.review_status,
    #             tr.created_at,
    #             tr.updated_at,
    #             tr.updated_by,
    #             jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS traveler_details
    #         FROM public.trip_reviews tr
    #         LEFT JOIN LATERAL (
    #             SELECT u.id, u.email, u.role
    #             FROM public.users u
    #             WHERE u.id = ANY(
    #                 SELECT jsonb_array_elements_text(
    #                     CASE jsonb_typeof(tr.travelers)
    #                         WHEN 'array' THEN tr.travelers
    #                         ELSE '[]'::jsonb
    #                     END
    #                 )::uuid
    #             )
    #         ) u ON true
    #         WHERE tr.id = $1
    #         GROUP BY tr.id
    #     """
    #     async with pool.acquire() as con:
    #         await con.set_type_codec(
    #             "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         await con.set_type_codec(
    #             "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         async with con.transaction():
    #             res = await con.fetchrow(query, trip_report_id)
    #             if res:
    #                 data = dict(res)
    #                 travelers = data["traveler_details"]
    #                 print(travelers)

    #                 if travelers:
    #                     data["travelers"] = [
    #                         UserSummary(**traveler)
    #                         for traveler in travelers
    #                         if traveler["id"] and traveler["email"] and traveler["role"]
    #                     ]
    #                 else:
    #                     data["travelers"] = []

    #                 properties = (
    #                     json.loads(data["properties"]) if data["properties"] else []
    #                 )
    #                 activities = (
    #                     json.loads(data["activities"]) if data["activities"] else []
    #                 )

    #                 # Initialize empty lists if properties or activities are None
    #                 data["properties"] = []
    #                 data["activities"] = []

    #                 # Join users for properties and activities travelers
    #                 traveler_ids = {
    #                     traveler.id: traveler for traveler in data["travelers"]
    #                 }

    #                 def get_user_summary(user_id):
    #                     return traveler_ids.get(UUID(user_id))

    #                 for prop in properties:
    #                     if "travelers" in prop and prop["travelers"]:
    #                         prop["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in prop["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["properties"].append(SegmentSummary(**prop))

    #                 for act in activities:
    #                     if "travelers" in act and act["travelers"]:
    #                         act["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in act["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["activities"].append(ActivitySummary(**act))

    #                 return TripReportSummary(**data)
    #             return None

    # async def get_trip_report(
    #     self, trip_report_id: UUID
    # ) -> Optional[TripReportSummary]:
    #     """Gets a single TripReport model in the repository by its id."""
    #     pool = await self._get_pool()
    #     query = """
    #         SELECT tr.*,
    #         jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS travelers
    #         FROM public.trip_reviews tr
    #         LEFT JOIN LATERAL (
    #             SELECT u.id, u.email, u.role
    #             FROM public.users u
    #             WHERE u.id = ANY(
    #                 SELECT uuid FROM (
    #                     SELECT jsonb_array_elements_text(
    #                         CASE jsonb_typeof(tr.travelers)
    #                             WHEN 'array' THEN tr.travelers
    #                             ELSE '[]'::jsonb
    #                         END
    #                     )::uuid AS uuid
    #                     FROM public.trip_reviews tr_inner
    #                     WHERE tr_inner.id = tr.id
    #                 ) AS subquery
    #             )
    #         ) u ON true
    #         WHERE tr.id = $1
    #         GROUP BY tr.id
    #     """
    #     async with pool.acquire() as con:
    #         await con.set_type_codec(
    #             "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         await con.set_type_codec(
    #             "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         async with con.transaction():
    #             res = await con.fetchrow(query, trip_report_id)
    #             if res:
    #                 data = dict(res)
    #                 travelers = data["travelers"]
    #                 print(data["travelers"])

    #                 if travelers:
    #                     data["travelers"] = [
    #                         UserSummary(**traveler)
    #                         for traveler in travelers
    #                         if traveler["id"] and traveler["email"] and traveler["role"]
    #                     ]
    #                 else:
    #                     data["travelers"] = []

    #                 print(data["travelers"])

    #                 properties = (
    #                     json.loads(data["properties"]) if data["properties"] else []
    #                 )
    #                 activities = (
    #                     json.loads(data["activities"]) if data["activities"] else []
    #                 )

    #                 # Initialize empty lists if properties or activities are None
    #                 data["properties"] = []
    #                 data["activities"] = []

    #                 # Join users for properties and activities travelers
    #                 traveler_ids = {
    #                     traveler.id: traveler for traveler in data["travelers"]
    #                 }

    #                 def get_user_summary(user_id):
    #                     return traveler_ids.get(UUID(user_id))

    #                 for prop in properties:
    #                     if "travelers" in prop and prop["travelers"]:
    #                         prop["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in prop["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["properties"].append(SegmentSummary(**prop))

    #                 for act in activities:
    #                     if "travelers" in act and act["travelers"]:
    #                         act["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in act["travelers"]
    #                             if get_user_summary(tid)
    #                         ]
    #                     data["activities"].append(ActivitySummary(**act))

    #                 return TripReportSummary(**data)
    #             return None

    # async def get_trip_report(
    #     self, trip_report_id: UUID
    # ) -> Optional[TripReportSummary]:
    #     """Gets a single TripReport model in the repository by its id."""
    #     pool = await self._get_pool()
    #     query = """
    #         SELECT tr.*,
    #         jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS travelers
    #         FROM public.trip_reviews tr
    #         LEFT JOIN LATERAL (
    #             SELECT u.id, u.email, u.role
    #             FROM public.users u
    #             WHERE u.id = ANY(
    #                 SELECT uuid FROM (
    #                     SELECT jsonb_array_elements_text(
    #                         CASE jsonb_typeof(tr.travelers)
    #                             WHEN 'array' THEN tr.travelers
    #                             ELSE '[]'::jsonb
    #                         END
    #                     )::uuid AS uuid
    #                     FROM public.trip_reviews tr_inner
    #                     WHERE tr_inner.id = tr.id
    #                 ) AS subquery
    #             )
    #         ) u ON true
    #         WHERE tr.id = $1
    #         GROUP BY tr.id
    #     """
    #     async with pool.acquire() as con:
    #         await con.set_type_codec(
    #             "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         await con.set_type_codec(
    #             "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         async with con.transaction():
    #             res = await con.fetchrow(query, trip_report_id)
    #             if res:
    #                 data = dict(res)
    #                 travelers = data["travelers"]

    #                 if travelers:
    #                     data["travelers"] = [
    #                         UserSummary(**traveler)
    #                         for traveler in travelers
    #                         if traveler["id"] and traveler["email"] and traveler["role"]
    #                     ]
    #                 else:
    #                     data["travelers"] = []

    #                 properties = (
    #                     json.loads(data["properties"]) if data["properties"] else []
    #                 )
    #                 activities = (
    #                     json.loads(data["activities"]) if data["activities"] else []
    #                 )

    #                 # Join users for properties and activities travelers
    #                 traveler_ids = {
    #                     traveler.id: traveler for traveler in data["travelers"]
    #                 }

    #                 def get_user_summary(user_id):
    #                     return traveler_ids.get(UUID(user_id))

    #                 for prop in properties:
    #                     if "travelers" in prop and prop["travelers"]:
    #                         prop["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in prop["travelers"]
    #                             if get_user_summary(tid)
    #                         ]

    #                 for act in activities:
    #                     if "travelers" in act and act["travelers"]:
    #                         act["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in act["travelers"]
    #                             if get_user_summary(tid)
    #                         ]

    #                 data["properties"] = [Segment(**prop) for prop in properties]
    #                 data["activities"] = [Activity(**act) for act in activities]

    #                 return TripReportSummary(**data)
    #             return None

    # async def get_trip_report(
    #     self, trip_report_id: UUID
    # ) -> Optional[TripReportSummary]:
    #     """Gets a single TripReport model in the repository by its id."""
    #     pool = await self._get_pool()
    #     query = """
    #         SELECT tr.*,
    #         jsonb_agg(jsonb_build_object('id', u.id, 'email', u.email, 'role', u.role)) AS travelers
    #         FROM public.trip_reviews tr
    #         LEFT JOIN LATERAL (
    #             SELECT u.id, u.email, u.role
    #             FROM public.users u
    #             WHERE u.id = ANY(
    #                 SELECT uuid FROM (
    #                     SELECT jsonb_array_elements_text(
    #                         CASE jsonb_typeof(tr.travelers)
    #                             WHEN 'array' THEN tr.travelers
    #                             ELSE '[]'::jsonb
    #                         END
    #                     )::uuid AS uuid
    #                     FROM public.trip_reviews tr_inner
    #                     WHERE tr_inner.id = tr.id
    #                 ) AS subquery
    #             )
    #         ) u ON true
    #         WHERE tr.id = $1
    #         GROUP BY tr.id
    #     """
    #     async with pool.acquire() as con:
    #         await con.set_type_codec(
    #             "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         await con.set_type_codec(
    #             "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #         )
    #         async with con.transaction():
    #             res = await con.fetchrow(query, trip_report_id)
    #             if res:
    #                 data = dict(res)
    #                 data["travelers"] = (
    #                     [UserSummary(**traveler) for traveler in data["travelers"]]
    #                     if data["travelers"]
    #                     else []
    #                 )

    #                 properties = (
    #                     json.loads(data["properties"]) if data["properties"] else []
    #                 )
    #                 activities = (
    #                     json.loads(data["activities"]) if data["activities"] else []
    #                 )

    #                 # Join users for properties and activities travelers
    #                 traveler_ids = {
    #                     traveler.id: traveler for traveler in data["travelers"]
    #                 }

    #                 def get_user_summary(user_id):
    #                     return traveler_ids.get(UUID(user_id))

    #                 for prop in properties:
    #                     if "travelers" in prop and prop["travelers"]:
    #                         prop["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in prop["travelers"]
    #                             if get_user_summary(tid)
    #                         ]

    #                 for act in activities:
    #                     if "travelers" in act and act["travelers"]:
    #                         act["travelers"] = [
    #                             get_user_summary(tid)
    #                             for tid in act["travelers"]
    #                             if get_user_summary(tid)
    #                         ]

    #                 data["properties"] = [Segment(**prop) for prop in properties]
    #                 data["activities"] = [Activity(**act) for act in activities]

    #                 return TripReportSummary(**data)
    #             return None
    # async with pool.acquire() as con:
    #     await con.set_type_codec(
    #         "json", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #     )
    #     await con.set_type_codec(
    #         "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    #     )
    #     async with con.transaction():
    #         res = await con.fetchrow(query, trip_report_id)
    #         print(res)
    #         if res:
    #             # Transform the data to match the Pydantic models
    #             data = dict(res)
    #             data["travelers"] = (
    #                 [UUID(t) for t in json.loads(data["travelers"])]
    #                 if data["travelers"]
    #                 else []
    #             )
    #             data["properties"] = (
    #                 [Segment(**seg) for seg in json.loads(data["properties"])]
    #                 if data["properties"]
    #                 else []
    #             )
    #             data["activities"] = (
    #                 [Activity(**act) for act in json.loads(data["activities"])]
    #                 if data["activities"]
    #                 else []
    #             )
    #             return TripReport(**data)
    #         return None

    async def get_trip_reports(self) -> Sequence[TripReport]:
        """Gets all TripReport models in the repository."""
        raise NotImplementedError

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
            ON CONFLICT (trip_report_id, COALESCE(property_id, '00000000-0000-0000-0000-000000000000')) DO UPDATE SET
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

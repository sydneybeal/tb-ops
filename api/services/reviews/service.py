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

"""Services for interacting with travel entries."""
import asyncio
from re import S, T
from typing import Optional, Sequence, List
from uuid import UUID, uuid4
from api.services.admin.service import AdminService
from api.services.audit.service import AuditService
from api.services.summaries.service import SummaryService
from api.services.admin.models import AdminComment
from api.services.audit.models import AuditLog
from api.services.reviews.models import (
    Activity,
    Comment,
    PatchTripReportRequest,
    Segment,
    Rating,
    TripReport,
    TripReportSummary,
)
from api.services.reviews.repository.postgres import PostgresReviewsRepository


class ReviewService:
    """Service for interfacing with the trip report/review repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresReviewsRepository()
        self._audit_svc = AuditService()
        self._admin_svc = AdminService()
        self._summary_svc = SummaryService()

    async def get_trip_report(
        self, trip_report_id: UUID
    ) -> Optional[TripReportSummary]:
        trip_report = await self._repo.get_trip_reports(trip_report_id)
        if trip_report:
            trip_report = trip_report[0]  # Assume get_trip_reports returns a list
            if trip_report.properties:
                # Collect tasks to fetch property details for each property
                property_details_tasks = [
                    self._summary_svc.get_property_details_by_id(prop.property_id)
                    for prop in trip_report.properties
                    if prop.property_id
                ]
                # Execute tasks concurrently
                property_details = await asyncio.gather(*property_details_tasks)

                # Update properties with fetched details
                properties_iterator = iter(property_details)
                for prop in trip_report.properties:
                    if prop.property_id:
                        prop.property_details = next(
                            properties_iterator
                        )  # Assuming SegmentSummary has a property_details field

            return trip_report
        return None

    async def get_all_trip_reports(self) -> Optional[Sequence[TripReportSummary]]:
        trip_reports = await self._repo.get_trip_reports()  # Fetch all trip reports
        if trip_reports:
            # Process each trip report
            for trip_report in trip_reports:
                if trip_report.properties:
                    # Collect tasks to fetch property details for each property in each trip report
                    property_details_tasks = [
                        self._summary_svc.get_property_details_by_id(prop.property_id)
                        for prop in trip_report.properties
                        if prop.property_id
                    ]
                    # Execute tasks concurrently
                    property_details = await asyncio.gather(*property_details_tasks)

                    # Update properties with fetched details
                    properties_iterator = iter(property_details)
                    for prop in trip_report.properties:
                        if prop.property_id:
                            prop.property_details = next(
                                properties_iterator
                            )  # Update property details
        return trip_reports

    async def process_trip_report_request(
        self,
        trip_report_request: PatchTripReportRequest,
    ) -> dict:
        trip_report_id = trip_report_request.trip_report_id or uuid4()
        admin_comments = []
        properties = []
        activities = []

        # If any document_updates, process them as AdminComment models
        if trip_report_request.document_updates is not None:
            admin_comment = AdminComment(
                trip_report_id=trip_report_id,
                comment_type="document_update",
                comment=trip_report_request.document_updates,
                reported_by=trip_report_request.travelers,
            )
            admin_comments.append(admin_comment)

        # Process each segment/property of the trip report
        if trip_report_request.properties:
            for segment in trip_report_request.properties:
                if not any(
                    segment.values()
                ):  # Skip if segment has all None or empty values
                    continue
                # TODO if the segment doesn't have property ID
                ## i.e. it is a new property that needs to go to admin zone
                ## put it in the properties table with status = "unverified"
                property_id = segment.get(
                    "property_id"
                )  # TODO update the property_id to a new property's ID if applicable
                # If any attribute_updates, process them as AdminComment models
                if segment.get("attribute_updates_comments") is not None:
                    admin_comment = AdminComment(
                        trip_report_id=trip_report_id,
                        property_id=property_id,
                        comment_type="attribute_update",
                        comment=segment["attribute_updates_comments"],
                        reported_by=segment.get("travelers"),
                    )
                    admin_comments.append(admin_comment)

                # Convert each segment to an Segment model
                properties.append(self.process_segment(segment))

        # print(admin_comments)
        # print(properties)

        # Process each segment/property of the trip report
        if trip_report_request.activities:
            for activity in trip_report_request.activities:
                # Convert each activity to an Activity model
                activities.append(self.process_activity(activity))

        # print(activities)

        trip_report = TripReport(
            id=trip_report_id,
            travelers=trip_report_request.travelers,
            properties=properties,
            activities=activities,
            review_status=trip_report_request.review_status,
            updated_by=trip_report_request.updated_by,
        )

        # print(trip_report)

        return_value = await self.upsert_trip_report_and_comments(
            trip_report=trip_report, admin_comments=admin_comments
        )

        return_value["trip_report_id"] = str(trip_report_id)
        return_value["admin_comment_uuids"] = {
            "document_updates": None,
            "attribute_updates": {},
        }
        return return_value

    def process_segment(self, segment_dict: dict) -> Segment:
        """Process properties and their attribute updates."""
        rating_attributes = [
            "accommodation_rating",
            "service_rating",
            "food_rating",
            "guide_rating",
            "overall_rating",
        ]

        comment_attributes = [
            "food_and_beverage_comments",
            "management_comments",
            "guiding_comments",
            "animal_viewing_comments",
            "seasonality_comments",
            "clientele_comments",
            "pairing_comments",
            "insider_comments",
        ]

        # Create Rating instances
        ratings = [
            Rating(attribute=attr, rating=str(segment_dict[attr]))
            for attr in rating_attributes
            if segment_dict.get(attr) is not None
        ]

        # Create Comment instances
        comments = [
            Comment(attribute=attr, comments=segment_dict[attr])
            for attr in comment_attributes
            if segment_dict.get(attr) is not None
        ]

        return Segment(
            date_in=segment_dict["date_in"],
            date_out=segment_dict.get("date_out"),
            property_id=segment_dict.get("property_id"),
            travelers=segment_dict.get("travelers"),
            site_inspection_only=segment_dict.get("site_inspection_only", False),
            ratings=ratings,
            comments=comments,
        )

    def process_activity(self, activity_dict: dict) -> Activity:
        rating_value = activity_dict.get("rating")
        return Activity(
            name=activity_dict.get("name", ""),
            visit_date=activity_dict.get("visit_date", ""),
            travelers=activity_dict.get("travelers"),
            type=activity_dict.get("type"),
            location=activity_dict.get("location"),
            rating=str(rating_value) if rating_value is not None else None,
            comments=activity_dict.get("comments"),
        )

    async def upsert_trip_report_and_comments(
        self, trip_report: TripReport, admin_comments: List[AdminComment]
    ) -> dict:
        return_value = {
            "success": True,
            "trip_report": {
                "success": False,
                "details": {"inserted": 0, "updated": 0},
            },
            "admin_comments": {
                "success": False,
                "details": {"inserted": 0, "updated": 0},
            },
        }

        # Insert or update trip report in the database
        try:
            trip_report_result = await self._repo.upsert_trip_report(trip_report)
            return_value["trip_report"]["success"] = (
                trip_report_result["inserted"] == 1
                or trip_report_result["updated"] == 1
            )
            return_value["trip_report"]["details"] = trip_report_result
        except Exception as e:
            print(f"Failed to upsert trip report: {e}")
            return_value["trip_report"]["success"] = False
            return_value["success"] = False

        # Insert or update admin comments in the database if there are any
        if admin_comments:
            try:
                admin_comments_result = await self._admin_svc.add_admin_comments(
                    admin_comments
                )
                return_value["admin_comments"]["success"] = (
                    admin_comments_result["inserted"] > 0
                    or admin_comments_result["updated"] > 0
                )
                return_value["admin_comments"]["details"]["inserted"] = (
                    admin_comments_result["inserted"]
                )
                return_value["admin_comments"]["details"]["updated"] = (
                    admin_comments_result["updated"]
                )
            except Exception as e:
                print(f"Failed to upsert admin comments: {e}")
                return_value["admin_comments"]["success"] = False
                return_value["success"] = False

        return return_value

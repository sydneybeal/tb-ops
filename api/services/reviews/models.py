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

"""Models for travel entries."""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from api.services.auth.models import UserSummary
from api.services.summaries.models import PropertyDetailSummary
from pydantic import BaseModel, Field, computed_field


class Activity(BaseModel):
    """Model for an activity/restaurant of a trip report segment."""

    name: Optional[str] = None
    visit_date: Optional[date] = None
    travelers: Optional[List[UUID]] = None
    type: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class Rating(BaseModel):
    """Model for a rating of a trip report segment."""

    attribute: str
    rating: Optional[str] = None


class Comment(BaseModel):
    """Model for a comment of a trip report segment."""

    attribute: str
    comments: Optional[str] = None


class Segment(BaseModel):
    """Model for a segment of a trip report."""

    date_in: Optional[date] = None
    date_out: Optional[date] = None
    site_inspection_only: bool = False
    attribute_update_comment_id: Optional[UUID] = None
    travelers: Optional[List[UUID]] = None
    property_id: Optional[UUID] = None
    ratings: Optional[List[Rating]] = None
    comments: Optional[List[Comment]] = None

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class TripReport(BaseModel):
    """Record for a trip report."""

    id: UUID = Field(default_factory=uuid4)
    properties: Optional[List[Segment]] = None
    travelers: Optional[List[UUID]] = None
    activities: Optional[List[Activity]] = None
    review_status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

    class Config:
        json_encoders = {UUID: lambda v: str(v)}


class AdminComment(BaseModel):
    """Record for a comment to be processed by an admin."""

    id: UUID = Field(default_factory=uuid4)
    trip_report_id: UUID
    property_id: Optional[UUID] = None
    comment_type: str
    comment: str
    status: str = "unreviewed"
    reported_by: Optional[List[UUID]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class PatchTripReportRequest(BaseModel):
    """Model for updating an existing trip report."""

    trip_report_id: Optional[UUID] = None
    travelers: Optional[List[UUID]] = None
    document_updates: Optional[str] = None
    document_update_comment_id: Optional[UUID] = None
    properties: Optional[List[dict]]  # Accept any dictionary that represents properties
    activities: Optional[List[dict]]  # Accept any dictionary that represents activities
    review_status: str = "draft"
    updated_by: str

    class Config:
        extra = "allow"


class ActivitySummary(BaseModel):
    """Model for an activity/restaurant joined with its foreign key fields."""

    name: Optional[str] = None
    visit_date: Optional[date] = None
    travelers: Optional[List[UserSummary]] = None
    type: Optional[str] = None
    location: Optional[str] = None
    rating: Optional[str] = None
    comments: Optional[str] = None


class SegmentSummary(BaseModel):
    """Model for a segment joined with its foreign key fields."""

    date_in: Optional[date] = None
    date_out: Optional[date] = None
    site_inspection_only: bool = False
    attribute_update_comment_id: Optional[UUID] = None
    attribute_updates_comments: Optional[str] = None
    travelers: Optional[List[UserSummary]] = None
    property_id: Optional[UUID] = None
    ratings: Optional[List[Rating]] = None
    comments: Optional[List[Comment]] = None
    # Embed PropertyDetailSummary directly
    property_details: Optional[PropertyDetailSummary] = None


class TripReportSummary(BaseModel):
    """Record for a trip report joined with its foreign key fields."""

    id: UUID = Field(default_factory=uuid4)
    # TODO join with admin_comments to get the document updates string
    document_updates: Optional[str] = None
    properties: Optional[List[SegmentSummary]] = None
    travelers: Optional[List[UserSummary]] = None
    activities: Optional[List[ActivitySummary]] = None
    review_status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str

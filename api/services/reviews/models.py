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
from typing import Optional, List
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, computed_field


class Activity(BaseModel):
    """Model for an activity/restaurant of a trip report segment."""

    name: str
    comments: Optional[str] = None


class Rating(BaseModel):
    """Model for a rating of a trip report segment."""

    attribute: str
    rating: Optional[int] = None


class Comment(BaseModel):
    """Model for a comment of a trip report segment."""

    attribute: str
    comments: Optional[str] = None


class Segment(BaseModel):
    """Model for a segment of a trip report."""

    property_id: UUID
    date_in: date
    date_out: Optional[date] = None
    is_inspection_only: bool = False
    ratings: Optional[List[Rating]] = None
    comments: Optional[List[Comment]] = None
    # TODO compare to form fields


class TripReport(BaseModel):
    """Record for a trip report."""

    id: UUID = Field(default_factory=uuid4)
    document_comments: Optional[str] = None
    segments: Optional[List[Segment]] = None
    travelers: Optional[List[UUID]] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    updated_by: str


class TripReportSummary(BaseModel):
    """Record for a trip report joined with its foreign key fields."""

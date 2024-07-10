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

"""Models for admin entries."""
from datetime import datetime
from uuid import UUID, uuid4
from pydantic import BaseModel, Field
from typing import Optional, List


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

    class Config:
        json_encoders = {UUID: lambda v: str(v)}
        from_attributes = True

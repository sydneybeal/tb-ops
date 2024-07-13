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

"""Models for client entries."""
from datetime import datetime, date
from uuid import UUID
from typing import Optional

from pydantic import BaseModel


class Client(BaseModel):
    """Data model for a client."""

    id: UUID
    first_name: str
    last_name: str
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    subjective_score: Optional[int] = None
    birth_date: Optional[date] = None
    referred_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    updated_by: str

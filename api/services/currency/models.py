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

"""Models for currency conversion entries."""
# from uuid import UUID, uuid4
from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, Field


class DailyRate(BaseModel):
    """Data model for currency conversion rates."""

    base_currency: str = Field(..., min_length=3, max_length=3)
    target_currency: str = Field(..., min_length=3, max_length=3)
    currency_name: str
    conversion_rate: Decimal
    rate_date: date
    rate_time: time

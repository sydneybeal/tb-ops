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

"""Models for audit entries."""
import json
from datetime import datetime, date
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# Custom encoder function
def custom_json_encoder(obj):
    """Specifies return values for non-serializable fields."""
    if isinstance(obj, UUID):
        return str(obj)
    elif isinstance(obj, datetime) or isinstance(obj, date):
        return obj.isoformat()
    # Add more custom encodings here if necessary
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")


class AuditLog(BaseModel):
    """Data model for edit history."""

    id: UUID = Field(default_factory=uuid4)
    table_name: str
    record_id: UUID
    user_name: str
    before_value: dict
    after_value: dict
    action: str
    action_timestamp: datetime = Field(default_factory=datetime.now)

    def to_json(self, **kwargs):
        """Convert the model to a dict, then serialize the dict using the custom encoder."""
        model_dict = self.dict()
        return json.dumps(model_dict, default=custom_json_encoder, **kwargs)

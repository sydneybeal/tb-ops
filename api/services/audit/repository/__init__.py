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

"""Repositories for audit-related data."""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Iterable
from api.services.audit.models import AuditLog


class AuditRepository(ABC):
    """Abstract repository for travel-related models."""

    @abstractmethod
    async def add(self, audit_logs: Iterable[AuditLog]) -> None:
        """Adds an iterable of AuditLog models to the repository."""

    @abstractmethod
    async def get(self, action_timestamp: datetime) -> Iterable[AuditLog]:
        """Returns audit logs for all actions in the repository."""
        raise NotImplementedError

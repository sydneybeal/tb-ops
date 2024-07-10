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
from typing import Optional, Sequence
from uuid import UUID

from api.services.admin.models import AdminComment
from api.services.admin.repository.postgres import PostgresAdminRepository


class AdminService:
    """Service for interfacing with the audit repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresAdminRepository()

    async def add_admin_comments(self, admin_comments: Sequence[AdminComment]) -> dict:
        """Inserts a sequence of admin comments."""
        return await self._repo.upsert(admin_comments)

    async def get_admin_comments(
        self, comment_id: Optional[UUID] = None
    ) -> Sequence[AdminComment]:
        """Gets a sequence of admin comments."""
        return await self._repo.get(comment_id)

    # async def add_audit_logs(
    #     self, audit_logs: Union[AuditLog, Iterable[AuditLog]]
    # ) -> None:
    #     """Adds new AuditLog to the repository."""
    #     if isinstance(audit_logs, AuditLog):
    #         audit_logs = [audit_logs]
    #     audit_logs_to_insert = [log.to_json() for log in audit_logs]
    #     await self._repo.add(audit_logs_to_insert)

    # async def get_audit_logs(
    #     self,
    #     action_timestamp: Optional[datetime] = None,
    #     table_name: Optional[str] = None,
    #     record_id: Optional[str] = None,
    # ) -> Iterable[AuditLog]:
    #     """Returns AuditLogs from the repository given a timestamp filter."""
    #     return await self._repo.get(action_timestamp, table_name, record_id)

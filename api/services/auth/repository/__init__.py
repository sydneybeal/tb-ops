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

"""Repositories for travel-related data."""
import datetime
from uuid import UUID
from abc import ABC, abstractmethod
from typing import Sequence, Callable

from api.services.auth.models import User, UserSummary


class AuthRepository(ABC):
    """Abstract repository for auth-related models."""

    async def get_user(self, email: str):
        """Gets a user from the repository by email."""
        raise NotImplementedError

    async def add_user(self, users: Sequence[User]):
        """Adds a sequence of User models to the repository."""
        raise NotImplementedError

    async def get_all_users(self) -> Sequence[UserSummary]:
        """Gets all users as UserSummary models from the repository."""
        raise NotImplementedError

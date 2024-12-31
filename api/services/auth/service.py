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

"""Services for authenticating within the app."""
from datetime import datetime, timedelta, time
import os
from typing import Sequence

from passlib.context import CryptContext
from jose import jwt

from api.services.auth.repository.postgres import PostgresAuthRepository
from api.services.auth.models import User, UserSummary


class AuthService:
    """Service for interfacing with the auth repository."""

    SECRET_KEY = os.environ["SECRET_KEY"]
    ALGORITHM = os.environ["ALGORITHM"]
    # ACCESS_TOKEN_EXPIRE_MINUTES = 10080

    def __init__(self):
        """Initializes with a configured repository."""
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._repo = PostgresAuthRepository()

    def hash_password(self, password: str) -> str:
        """Hashes a password string."""
        ret = self.pwd_context.hash(password)
        return ret

    def verify_password(self, plain_password, hashed_password) -> bool:
        """Validates a password string based on its hash."""
        ret = self.pwd_context.verify(plain_password, hashed_password)
        return ret

    def create_access_token(self, data: dict, expires_delta: timedelta = None) -> str:
        """Creates access token."""
        to_encode = data.copy()
        now = datetime.utcnow()
        # Calculate the next occurrence of 8 AM
        next_8am = datetime.combine(now.date(), time(8, 0))
        if now.time() >= time(8, 0):  # If it's past today's 8 AM, go to tomorrow's
            next_8am += timedelta(days=1)

        if expires_delta is not None:
            expire = now + expires_delta
        else:
            expire = next_8am

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    async def authenticate_user(self, email: str, password: str):
        """Validates a user's password hash."""
        user = await self._repo.get_user(email)
        if user and self.verify_password(password, user.hashed_password):
            return user
        return None

    async def get_user(self, email: str):
        """Gets a user by email."""
        user = await self._repo.get_user(email)
        return user

    async def add_user(self, users: Sequence[User]):
        """Adds a user model to the repository."""
        to_be_added = [
            user for user in users if not await self._repo.get_user(user.email)
        ]
        await self._repo.add_user(to_be_added)

    async def get_all_users(self) -> Sequence[UserSummary]:
        """Adds a user model to the repository."""
        return await self._repo.get_all_users()

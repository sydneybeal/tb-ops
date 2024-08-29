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

"""Seeds users into application database."""
import csv
import uuid
from datetime import datetime
import asyncio
import asyncpg
from api.services.auth.models import User
from api.services.auth.service import AuthService
from user_passwords import users


class UserBuilder:
    """Populates the database with users."""

    def __init__(self):
        """Initializes the source data to be seeded."""
        self._auth_service = AuthService()

    async def seed_users(self):
        """Seeds the database table with users."""
        users_to_add = []
        for user in users:
            # hash password
            hashed_password = self._auth_service.hash_password(user["password"])
            auth_user = User(
                email=user["email"], hashed_password=hashed_password, role=user["role"]
            )
            users_to_add.append(auth_user)
        # print(users_to_add)
        await self._auth_service.add_user(users_to_add)


if __name__ == "__main__":
    user_builder = UserBuilder()
    asyncio.run(user_builder.seed_users())

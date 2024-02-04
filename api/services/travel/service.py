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
from typing import Sequence, Iterable
from api.services.travel.models import (
    CoreDestination,
    Country,
    Consultant,
    Property,
    AccommodationLog,
    Agency,
    BookingChannel,
)
from api.services.travel.repository.postgres import PostgresTravelRepository


class TravelService:
    """Service for interfacing with the travel repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresTravelRepository()

    async def add_country(self, models: Sequence[Country]) -> None:
        """Adds country model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model for model in models if not await self._repo.get_country(model.name)
        ]
        await self._repo.add_country(to_be_added)

    async def get_country(self, names: Sequence[str]) -> Sequence[Country]:
        """Gets a sequence of Country models by country name"""
        await self._repo.get_country(names)

    async def add_core_destination(self, models: Sequence[CoreDestination]) -> None:
        """Adds core destination model to the repository."""
        # Only get pipelines that don't already exist
        # to_be_added = [model for model in models if not await self.get(model.id)]
        # if len(to_be_added) == 0:
        # Raise an AlreadyExists Error if all models in list exists
        # print("Already exists")
        # raise AlreadyExists(
        #     f"All Pipeline models already exists in repository. {[model.id for model in models]}"
        # )

        await self._repo.add_core_destination(models)

    async def get_core_destination(
        self, names: Sequence[str]
    ) -> Sequence[CoreDestination]:
        """Gets a sequence of CoreDestination models by core destination name"""
        return await self._repo.get_core_destination(names)

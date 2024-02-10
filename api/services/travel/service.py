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

    # AccommodationLog
    async def add_accommodation_log(self, models: Sequence[AccommodationLog]) -> None:
        """Adds accommodation log model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_accommodation_log(
                model.primary_traveler, model.property_id, model.date_in, model.date_out
            )
        ]
        await self._repo.add_accommodation_log(to_be_added)

    # Country
    async def add_country(self, models: Sequence[Country]) -> None:
        """Adds country model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_country_by_name(model.name)
        ]
        await self._repo.add_country(to_be_added)

    async def get_country_by_name(self, name: str) -> Country:
        """Gets a single Country model by name."""
        # print(f"In service.py searching for country by name {name}")
        return await self._repo.get_country_by_name(name)

    async def get_countries_by_name(self, names: Sequence[str]) -> Sequence[Country]:
        """Gets a sequence of Country models by country name."""
        return await self._repo.get_countries_by_name(names)

    # CoreDestination
    async def add_core_destination(self, models: Sequence[CoreDestination]) -> None:
        """Adds core destination model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_core_destination_by_name(model.name)
        ]

        await self._repo.add_core_destination(to_be_added)

    async def get_core_destination_by_name(self, name: str) -> CoreDestination:
        """Gets a sequence of CoreDestination models by core destination name"""
        return await self._repo.get_core_destination_by_name(name)

    # Property
    async def add_property(self, models: Sequence[Property]) -> None:
        """Adds Property models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_property_by_name(
                model.name, model.portfolio, model.country_id, model.core_destination_id
            )
        ]
        await self._repo.add_property(to_be_added)

    async def get_property_by_name(
        self,
        name: str,
        portfolio_name: str,
        country_id: Optional[str],
        core_destination_id: Optional[str],
    ) -> Property:
        """Gets a single Property model by name, portfolio, country, core_destination."""
        return await self._repo.get_property_by_name(
            name, portfolio_name, country_id, core_destination_id
        )

    # Agency
    async def add_agency(self, models: Sequence[Agency]) -> None:
        """Adds Agency models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_agency_by_name(model.name)
        ]
        await self._repo.add_agency(to_be_added)

    async def get_agency_by_name(self, name: str) -> None:
        """Gets a single Agency model by name."""
        return await self._repo.get_agency_by_name(name)

    # BookingChannel
    async def add_booking_channel(self, models: Sequence[BookingChannel]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_booking_channel_by_name(model.name)
        ]
        await self._repo.add_booking_channel(to_be_added)

    async def get_booking_channel_by_name(self, name: str) -> None:
        """Gets a single BookingChannel model by name."""
        return await self._repo.get_booking_channel_by_name(name)

    # Consultant
    async def add_consultant(self, models: Sequence[Consultant]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_consultant_by_name(
                model.first_name, model.last_name
            )
        ]
        await self._repo.add_consultant(to_be_added)

    async def get_all_consultants(self) -> Sequence[Consultant]:
        """Gets all Country models."""
        return await self._repo.get_all_consultants()

    async def get_consultant_by_name(
        self, first_name: str, last_name: str
    ) -> Consultant:
        """Gets a single Consultant model by name."""
        return await self._repo.get_consultant_by_name(first_name, last_name)

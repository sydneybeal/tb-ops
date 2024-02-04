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
from abc import ABC, abstractmethod
from typing import Sequence, Callable
from api.services.travel.models import (
    AccommodationLog,
    Property,
    CoreDestination,
    Country,
    Consultant,
    Agency,
    BookingChannel,
)


class TravelRepository(ABC):
    """Abstract repository for travel-related models."""

    # AccommodationLog
    @abstractmethod
    async def add_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Adds a sequence of AccommodationLog models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Updates a sequence of AccommodationLog models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Deletes a sequence of AccommodationLog models from the repository."""
        raise NotImplementedError

    # Property
    @abstractmethod
    async def add_property(self, properties: Sequence[Property]) -> None:
        """Adds a sequence of Property models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_property(self, properties: Sequence[Property]) -> None:
        """Updates a sequence of Property models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_property(self, properties: Sequence[Property]) -> None:
        """Deletes a sequence of Property models from the repository."""
        raise NotImplementedError

    # Consultant
    @abstractmethod
    async def add_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Adds a sequence of Consultant models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Updates a sequence of Consultant models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Deletes a sequence of Consultant models from the repository."""
        raise NotImplementedError

    # CoreDestination
    @abstractmethod
    async def add_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Adds a sequence of CoreDestination models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_core_destination(self, names: Sequence[str]) -> None:
        """Gets a sequence of CoreDestination models based on names."""
        raise NotImplementedError

    @abstractmethod
    async def update_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Updates a sequence of CoreDestination models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Deletes a sequence of CoreDestination models from the repository."""
        raise NotImplementedError

    # Country
    @abstractmethod
    async def add_country(self, countries: Sequence[Country]) -> None:
        """Adds a sequence of Country models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_country(self, names: Sequence[str]) -> None:
        """Gets a sequence of Country models based on names."""
        raise NotImplementedError

    @abstractmethod
    async def update_country(self, countries: Sequence[Country]) -> None:
        """Updates a sequence of Country models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_country(self, countries: Sequence[Country]) -> None:
        """Deletes a sequence of Country models from the repository."""
        raise NotImplementedError

    # Agency
    @abstractmethod
    async def add_agency(self, agencies: Sequence[Agency]) -> None:
        """Adds a sequence of Agency models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_agency(self, agencies: Sequence[Agency]) -> None:
        """Updates a sequence of Agency models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_agency(self, agencies: Sequence[Agency]) -> None:
        """Deletes a sequence of Agency models from the repository."""
        raise NotImplementedError

    # BookingChannel
    @abstractmethod
    async def add_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Adds a sequence of BookingChannel models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Updates a sequence of BookingChannel models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Deletes a sequence of BookingChannel models from the repository."""
        raise NotImplementedError

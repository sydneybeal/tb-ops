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
from typing import Sequence, Callable, Tuple
from api.services.travel.models import (
    AccommodationLog,
    Property,
    PropertyDetail,
    CoreDestination,
    Country,
    Consultant,
    Agency,
    BookingChannel,
    Portfolio,
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
    async def upsert_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Upserts a sequence of AccommodationLog models into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_accommodation_log(self, log_id: UUID) -> bool:
        """Deletes an AccommodationLog model from the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_accommodation_log(
        self,
        primary_traveler: str,
        property_id: str,
        date_in: datetime.date,
        date_out: datetime.date,
    ) -> AccommodationLog:
        """Gets a single AccommodationLog model in the repository by name."""
        raise NotImplementedError

    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLog]:
        """Gets all AccommodationLog models."""
        raise NotImplementedError

    @abstractmethod
    async def get_accommodation_log_by_id(
        self,
        log_id: UUID,
    ) -> AccommodationLog:
        """Gets a single AccommodationLog model in the repository by ID."""
        raise NotImplementedError

    @abstractmethod
    async def update_accommodation_log(
        self, accommodation_logs: Sequence[AccommodationLog]
    ) -> None:
        """Updates a sequence of AccommodationLog models in the repository."""
        raise NotImplementedError

    # Property
    @abstractmethod
    async def add_property(self, properties: Sequence[Property]) -> None:
        """Adds a sequence of Property models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_property_by_name(
        self,
        name: str,
        portfolio_id: UUID,
        country_id: UUID,
        core_destination_id: UUID,
    ) -> Property:
        """Returns a single Property model in the repository by name."""

    @abstractmethod
    async def get_property_by_id(
        self,
        property_id: UUID,
    ) -> Property:
        """Returns a single Property model in the repository by id."""

    @abstractmethod
    async def update_property(self, properties: Sequence[Property]) -> None:
        """Updates a sequence of Property models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_property(self, property_data: Property) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a property into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_property(self, property_id: UUID) -> None:
        """Deletes a sequence of Property models from the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_properties(self) -> Sequence[Property]:
        """Gets all Property models."""
        raise NotImplementedError

    # PropertyDetail
    @abstractmethod
    async def get_property_detail_by_id(
        self,
        property_id: UUID,
    ) -> PropertyDetail:
        """Returns a single PropertyDetail model in the repository by id."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_property_detail(
        self, property_data: PropertyDetail
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a property's detail into the repository."""
        raise NotImplementedError

    # Consultant
    @abstractmethod
    async def get_all_consultants(self) -> Sequence[Consultant]:
        """Gets all Consultant models."""
        raise NotImplementedError

    @abstractmethod
    async def add_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Adds a sequence of Consultant models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_consultant_by_name(
        self, first_name: str, last_name: str
    ) -> Consultant:
        """Gets a single Consultant model based on name."""
        raise NotImplementedError

    @abstractmethod
    async def get_consultant_by_id(self, consultant_id: UUID) -> Consultant:
        """Gets a single Consultant model based on id."""
        raise NotImplementedError

    @abstractmethod
    async def update_consultant(self, consultants: Sequence[Consultant]) -> None:
        """Updates a sequence of Consultant models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_consultant(
        self, consultant_data: Consultant
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a consultant into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_consultant(self, consultant_id: UUID) -> bool:
        """Deletes a Consultant model from the repository."""
        raise NotImplementedError

    # CoreDestination
    @abstractmethod
    async def add_core_destination(
        self, core_destinations: Sequence[CoreDestination]
    ) -> None:
        """Adds a sequence of CoreDestination models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_core_destination_by_name(self, name: str) -> CoreDestination:
        """Gets a single CoreDestination model based on names."""
        raise NotImplementedError

    @abstractmethod
    async def get_core_destination_by_id(
        self, core_destination_id: UUID
    ) -> CoreDestination:
        """Gets a single CoreDestination model based on ID."""
        raise NotImplementedError

    @abstractmethod
    async def get_core_destinations_by_name(
        self, names: Sequence[str]
    ) -> Sequence[CoreDestination]:
        """Gets a sequence of CoreDestination models based on names."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_core_destinations(self) -> Sequence[CoreDestination]:
        """Gets all of CoreDestination models from the repository."""
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
    async def get_country_by_id(self, country_id: UUID) -> None:
        """Gets a single Country model based on ID."""
        raise NotImplementedError

    async def get_all_countries(self) -> Sequence[Country]:
        """Gets all Country models."""
        raise NotImplementedError

    @abstractmethod
    async def get_country_by_name(self, name: str) -> None:
        """Gets a single Country model based on name."""
        raise NotImplementedError

    @abstractmethod
    async def get_countries_by_name(self, names: Sequence[str]) -> None:
        """Gets a sequence of Country models based on names."""
        raise NotImplementedError

    @abstractmethod
    async def update_country(self, countries: Sequence[Country]) -> None:
        """Updates a sequence of Country models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_country(self, country_id: UUID) -> None:
        """Deletes a sequence of Country models from the repository."""
        raise NotImplementedError

    # Agency
    @abstractmethod
    async def add_agency(self, agencies: Sequence[Agency]) -> None:
        """Adds a sequence of Agency models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_agencies(self) -> Sequence[Agency]:
        """Gets all Agency models from the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_agency_by_name(self, name: str) -> Agency:
        """Gets a single Agency model from the repository by name."""
        raise NotImplementedError

    @abstractmethod
    async def get_agency_by_id(self, agency_id: UUID) -> Agency:
        """Gets a single Agency model based on id."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_agency(self, agency_data: Agency) -> list[Tuple[UUID, bool]]:
        """Updates or inserts an agency into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_agency(self, agencies: Sequence[Agency]) -> None:
        """Updates a sequence of Agency models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_agency(self, agency_id: UUID) -> bool:
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
    async def get_all_booking_channels(self) -> Sequence[BookingChannel]:
        """Gets all BookingChannel models from the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_booking_channel_by_name(self, name: str) -> BookingChannel:
        """Gets a single BookingChannel model from the repository by name."""
        raise NotImplementedError

    @abstractmethod
    async def get_booking_channel_by_id(
        self, booking_channel_id: UUID
    ) -> BookingChannel:
        """Gets a single BookingChannel model based on id."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_booking_channel(
        self, booking_channel_data: BookingChannel
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a booking channel into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def update_booking_channel(
        self, booking_channels: Sequence[BookingChannel]
    ) -> None:
        """Updates a sequence of BookingChannel models in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def delete_booking_channel(self, booking_channel_id: UUID) -> bool:
        """Deletes a sequence of BookingChannel models from the repository."""
        raise NotImplementedError

    # Portfolio
    @abstractmethod
    async def add_portfolio(self, portfolios: Sequence[Portfolio]) -> None:
        """Adds a sequence of Portfolio models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def upsert_portfolio(
        self, portfolio_data: Portfolio
    ) -> list[Tuple[UUID, bool]]:
        """Updates or inserts a portfolio into the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_portfolio_by_name(self, name: str) -> Portfolio:
        """Gets a single Portfolio model based on name."""
        raise NotImplementedError

    @abstractmethod
    async def get_portfolio_by_id(self, portfolio_id: UUID) -> Portfolio:
        """Gets a single Portfolio model based on id."""
        raise NotImplementedError

    @abstractmethod
    async def delete_portfolio(self, portfolio_id: UUID) -> bool:
        """Deletes a sequence of Portfolio models from the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_portfolios(self) -> Sequence[Portfolio]:
        """Gets all Portfolio models."""
        raise NotImplementedError

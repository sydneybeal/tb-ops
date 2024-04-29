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
import uuid
from abc import ABC, abstractmethod
from typing import Sequence
from api.services.summaries.models import (
    AccommodationLogSummary,
    AgencySummary,
    BedNightReport,
    BookingChannelSummary,
    CountrySummary,
    PortfolioSummary,
    PropertyDetailSummary,
    PropertySummary,
    TripSummary,
)
from api.services.travel.models import Trip


class SummaryRepository(ABC):
    """Abstract repository for data summary models."""

    # BedNightReport
    @abstractmethod
    async def get_bed_night_report(self, input_args: dict) -> BedNightReport:
        """Creates a BedNightReport model given the inputs and repo data."""
        raise NotImplementedError

    # AccommodationLog
    @abstractmethod
    async def get_accommodation_log(
        self,
        primary_traveler: str,
        property_id: str,
        date_in: datetime.date,
        date_out: datetime.date,
    ) -> AccommodationLogSummary:
        """Gets a single AccommodationLog model in the repository by name."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_accommodation_logs(self) -> Sequence[AccommodationLogSummary]:
        """Gets all AccommodationLog models in the repository, joined with their foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_accommodation_logs_by_filter(
        self, filters: dict
    ) -> Sequence[AccommodationLogSummary]:
        """Gets AccommodationLogSummary models in the repository by a filter."""
        raise NotImplementedError

    # Property
    @abstractmethod
    async def get_property(
        self,
        name: str,
        portfolio_name: str,
        country_id: uuid,
        core_destination_id: uuid,
    ) -> PropertySummary:
        """Returns a single Property model in the repository by name."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_properties(self) -> Sequence[PropertySummary]:
        """Gets all Property models in the repository, joined with their foreign keys."""
        raise NotImplementedError

    # PropertyDetailSummary
    @abstractmethod
    async def get_property_details(self) -> Sequence[PropertyDetailSummary]:
        """Gets all PropertyDetail models in the repository, joined with their foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_property_details_by_id(self) -> PropertyDetailSummary:
        """Gets a PropertyDetail models in the repository by ID, joined with foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_countries(self) -> Sequence[CountrySummary]:
        """Gets all Country models joined with their foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_booking_channels(self) -> Sequence[BookingChannelSummary]:
        """Gets all BookingChannel models in the repository, joined with their foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_agencies(self) -> Sequence[AgencySummary]:
        """Gets all Agency models joined with their foreign keys."""
        raise NotImplementedError

    @abstractmethod
    async def get_all_portfolios(self) -> Sequence[PortfolioSummary]:
        """Gets all Portfolio models joined with their foreign keys."""
        raise NotImplementedError

    # Trips
    @abstractmethod
    async def get_all_trips(self) -> Sequence[TripSummary]:
        """Gets all TripSummary models."""

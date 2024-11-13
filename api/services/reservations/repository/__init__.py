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

"""Repositories for reservation-related data."""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Iterable
from api.services.reservations.models import Reservation


class ReservationRepository(ABC):
    """Abstract repository for reservation-related models."""

    @abstractmethod
    async def add(self, reservations: Iterable[Reservation]) -> None:
        """Adds an iterable of Reservation models to the repository."""

    @abstractmethod
    async def get(self) -> Iterable[Reservation]:
        """Returns Reservations in the repository."""
        raise NotImplementedError

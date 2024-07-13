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

"""Services for interacting with reservation entries."""
# from typing import Optional, Sequence, Union
# from uuid import UUID
from datetime import datetime
from typing import Iterable, Union, Optional
from api.services.reservations.models import Reservation
from api.services.reservations.repository.postgres import PostgresReservationRepository


class ReservationService:
    """Service for interfacing with the reservations repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresReservationRepository()

    async def add(
        self, reservations: Union[Reservation, Iterable[Reservation]]
    ) -> None:
        """Adds new Reservation to the repository."""
        if isinstance(reservations, Reservation):
            reservations = [reservations]
        await self._repo.add(reservations)

    async def get(
        self,
    ) -> Iterable[Reservation]:
        """Returns Reservations from the repository."""
        return await self._repo.get()

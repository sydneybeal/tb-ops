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
from typing import Iterable, Union, Sequence
from api.services.clients.models import Client, ClientSummary
from api.services.clients.repository.postgres import PostgresClientRepository
from api.services.reservations.service import ReservationService


class ClientService:
    """Service for interfacing with the client repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresClientRepository()
        self._reservation_service = ReservationService()

    async def add(self, reservations: Union[Client, Iterable[Client]]) -> None:
        """Adds new Client to the repository."""
        if isinstance(reservations, Client):
            reservations = [reservations]
        await self._repo.add(reservations)

    async def get(
        self,
    ) -> Sequence[Client]:
        """Returns Clients from the repository."""
        return await self._repo.get()

    async def get_summaries(
        self,
    ) -> Sequence[ClientSummary]:
        """Returns ClientSummary instances from the repository."""
        client_summaries = await self._repo.get_summaries()
        reservations = await self._reservation_service.get()
        # Create a dictionary to map client_id to reservations
        reservations_by_client_id = {}
        for res in reservations:
            if res.client_id not in reservations_by_client_id:
                reservations_by_client_id[res.client_id] = []
            reservations_by_client_id[res.client_id].append(res)

        # Attach reservations to their respective client summaries
        for summary in client_summaries:
            if summary.id in reservations_by_client_id:
                summary.reservations = reservations_by_client_id[summary.id]
            else:
                summary.reservations = []

        return client_summaries

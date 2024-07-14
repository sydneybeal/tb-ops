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

"""Repositories for client-related data."""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Iterable
from api.services.clients.models import Client, ClientSummary


class ClientRepository(ABC):
    """Abstract repository for client-related models."""

    @abstractmethod
    async def add(self, clients: Iterable[Client]) -> None:
        """Adds an iterable of Client models to the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get(self) -> Iterable[Client]:
        """Returns Clients in the repository."""
        raise NotImplementedError

    @abstractmethod
    async def get_summaries(self) -> Iterable[ClientSummary]:
        """Returns ClientSummary instances in the repository."""
        raise NotImplementedError

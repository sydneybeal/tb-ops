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
"""Adapters for plugging functionality into repositories."""

from __future__ import annotations

import os
from typing import Type

import asyncpg


def connection_configuration() -> dict:
    """Generates postgresql connection configuration based on the repository."""
    # TODO: Move to proper module and provide real implementation.
    return {
        "user": os.getenv("POSTGRES_USER", "postgres"),
        "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
        "database": os.getenv("POSTGRES_DB", "tb-ops"),
        "host": os.getenv("POSTGRES_HOST", "localhost"),
        "port": int(os.getenv("POSTGRES_PORT", "5432")),
        "min_size": int(os.getenv("POSTGRES_MIN_POOL_SIZE", "4")),
        "max_size": int(os.getenv("POSTGRES_MAX_POOL_SIZE", "18")),
    }


class ConnectionPoolManager:
    """Manages the postgresql connection pools for postgresql repositories."""

    __pool: asyncpg.Pool | None = None

    @classmethod
    async def get(cls) -> asyncpg.Pool:
        """Provides connection pool for the repository."""
        if cls.__pool is None:
            configuration = connection_configuration()
            cls.__pool = await asyncpg.create_pool(**configuration)
            assert cls.__pool is not None
        return cls.__pool


class KeyValueStoreManager:
    """Manages the key value stores of key value repositories."""

    __stores: dict = {}

    @classmethod
    def get(cls, repo_type: Type[KeyValueStoreMixin]) -> dict:
        """Provides key value store for the repository."""
        if repo_type not in cls.__stores:
            cls.__stores[repo_type] = {}
        return cls.__stores[repo_type]


class PostgresMixin:
    """Adds functionality to obtain a pool from the connection pool manager."""

    async def _get_pool(self) -> asyncpg.Pool:
        return await ConnectionPoolManager.get()


class KeyValueStoreMixin:
    """Adds a key value store at `self._repo` to serve as the storage layer."""

    def __new__(cls, *args, **kwargs):
        """Assigns key value store during instance creation."""
        instance = super().__new__(cls)
        cls._repo = KeyValueStoreManager.get(repo_type=cls)
        return instance

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

"""Postgres Connection helper."""
import os
from dataclasses import dataclass

import asyncpg


@dataclass(slots=True, frozen=True)
class PostgresConfig:
    """Postgres Connection configuration."""

    host: str
    username: str
    password: str
    dbname: str
    port: int = 5432
    min_pool_size: int = 4
    max_pool_size: int = 40

    @classmethod
    def from_env(cls) -> "PostgresConfig":
        """Load connection from postgres standard env vars."""
        return PostgresConfig(
            os.getenv("POSTGRES_HOST", "localhost"),
            os.getenv("POSTGRES_USER", "postgres"),
            os.getenv("POSTGRES_PASSWORD", "postgres"),
            os.getenv("POSTGRES_DB", "tb-ops"),
            int(os.getenv("POSTGRES_PORT", "5432")),
            int(os.getenv("POSTGRES_MIN_POOL_SIZE", "4")),
            int(os.getenv("POSTGRES_MAX_POOL_SIZE", "40")),
        )


async def make_conn(conf: PostgresConfig) -> asyncpg.Connection:
    """Create an async Postgres Connection.

    Args:
        conf (PostgresConfig): Postgresonnection config

    Returns:
        asyncpg.Connection
    """
    return await asyncpg.connect(
        user=conf.username,
        password=conf.password,
        database=conf.dbname,
        host=conf.host,
        port=conf.port,
    )


async def make_pool(conf: PostgresConfig) -> asyncpg.Pool:
    """Make a connection pool.

    Args:
        conf (PostgresConfig): DB Connection config

    Returns:
        asyncpg.Pool
    """
    return await asyncpg.create_pool(
        user=conf.username,
        password=conf.password,
        database=conf.dbname,
        host=conf.host,
        port=conf.port,
        min_size=conf.min_pool_size,
        max_size=conf.max_pool_size,
    )


class ConnectionManager:
    """Manages connection pools."""

    __pools: dict[str, asyncpg.Pool] = {}

    def __contains__(self, host: str) -> bool:
        """Check if a database connection pool for a host exists within the manager."""
        return host in ConnectionManager.__pools

    @classmethod
    async def get(cls, conn_config: PostgresConfig) -> asyncpg.Pool:
        """Get a pool if exists, else creates and returns it."""
        if conn_config.host not in ConnectionManager.__pools:
            ConnectionManager.__pools[conn_config.host] = await make_pool(conn_config)

        return ConnectionManager.__pools[conn_config.host]

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

"""Migration runner."""
import asyncio
import logging
import os

from api.config.postgres import PostgresConfig, make_conn


async def main() -> int:
    """Entrypoint script for running migrations."""
    log = logging.getLogger()
    logging.basicConfig()
    log.setLevel(logging.INFO)
    log.info("Attempting connection to postgres")
    conn = await make_conn(
        PostgresConfig(
            os.getenv("POSTGRES_HOST", "localhost"),
            os.getenv("POSTGRES_USER", "postgres"),
            os.getenv("POSTGRES_PASSWORD", "postgres"),
            os.getenv("POSTGRES_DB", "tb-ops"),
            int(os.getenv("POSTGRES_PORT", "5432")),
        )
    )
    assert not conn.is_closed()
    migrations = list(
        sorted(
            filter(
                lambda x: x.endswith(".sql"),
                os.listdir(os.path.join(os.path.dirname(__file__), "ddl")),
            )
        )
    )
    for f in migrations:
        log.info("running migration: %s", f)
        with open(
            os.path.join(os.path.dirname(__file__), "ddl", f), encoding="utf-8"
        ) as fd:
            structure = fd.read()
            await conn.execute(structure)
            log.info("successfully executed %s\n\n", structure)
    log.info("done migrations")

    return 0


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    raise SystemExit(loop.run_until_complete(main()))

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


async def count_rows(conn, table, condition=None):
    condition = f" WHERE {condition}" if condition else ""
    copy_sql = f"SELECT COUNT(*) FROM {table}{condition};"
    async with conn.transaction():
        result = await conn.fetchval(copy_sql)
        return result


async def fetch_data(prod_conn, table, condition=None):
    query = f"SELECT * FROM {table}"
    if condition:
        query += f" WHERE {condition}"
    async with prod_conn.transaction():
        return await prod_conn.fetch(query)


async def insert_data(uat_conn, table, data):
    if not data:
        return
    # Assuming all rows have the same columns, get columns from the first row
    columns = list(data[0].keys())
    values_placeholder = ", ".join([f"${i+1}" for i in range(len(columns))])

    # Construct the INSERT INTO statement
    columns_placeholder = ", ".join(columns)
    insert_query = f"""
      INSERT INTO {table} ({columns_placeholder})
      VALUES ({values_placeholder})
      ON CONFLICT DO NOTHING;
    """

    # Prepare the values to be inserted
    # Convert each row's values to a list
    values_to_insert = [list(row.values()) for row in data]

    async with uat_conn.transaction():
        await uat_conn.executemany(insert_query, values_to_insert)


async def main() -> None:
    """Entrypoint script for running migrations."""
    log = logging.getLogger()
    logging.basicConfig()
    log.setLevel(logging.INFO)
    log.info("Attempting connection to postgres prod")
    conn = await make_conn(
        PostgresConfig(
            os.getenv("POSTGRES_HOST_UAT", "localhost"),
            os.getenv("POSTGRES_USER_UAT", "postgres"),
            os.getenv("POSTGRES_PASSWORD_UAT", "postgres"),
            os.getenv("POSTGRES_DB_UAT", "postgres"),
            int(os.getenv("POSTGRES_PORT", "5432")),
        )
    )
    log.info("Attempting connection to postgres local")
    uat_conn = await make_conn(
        PostgresConfig(
            os.getenv("POSTGRES_HOST_PROD", "localhost"),
            os.getenv("POSTGRES_USER_PROD", "postgres"),
            os.getenv("POSTGRES_PASSWORD_PROD", "postgres"),
            os.getenv("POSTGRES_DB_PROD", "postgres"),
            int(os.getenv("POSTGRES_PORT", "5432")),
        )
    )
    assert not conn.is_closed()
    assert not uat_conn.is_closed()

    # Ingest from the following tables in prod into corresponding in UAT
    tables = [
        # "public.core_destinations",
        # "public.countries",
        # "public.agencies",
        # "public.booking_channels",
        # "public.portfolios",
        # "public.consultants",
        # "public.properties",
        # "public.accommodation_logs",
        # "public.property_details",
        # "public.users",
        # "public.trips",
        "public.daily_rates",
    ]

    for table in tables:
        if table == "public.accommodation_logs":
            prod_count = await count_rows(conn, table, "date_in > '2022-07-01'")
            uat_count = await count_rows(uat_conn, table, "date_in > '2022-07-01'")
        else:
            prod_count = await count_rows(conn, table)
            uat_count = await count_rows(uat_conn, table)
        print(f"Table {table} - Prod Count: {prod_count}, UAT Count: {uat_count}")

    for table in tables:
        condition = (
            "date_in > '2022-07-01'" if table == "public.accommodation_logs" else None
        )
        data = await fetch_data(conn, table, condition)
        await insert_data(uat_conn, table, data)
        print(f"Data copied for table: {table}")

    # first print out a select count(*) from each in Prod and UAT to show me they're being accessed correctly
    # implement insert select * to insert into UAT
    # For accommodation_logs, only use date_in > 2024-01-01


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    raise SystemExit(loop.run_until_complete(main()))

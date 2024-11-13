# Copyright 2023 SH

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Pytest fixtures shared across the test suites."""
import os

os.environ["POSTGRES_DB"] = "rr_test"
os.environ["SECRET_KEY"] = "test"
os.environ["ALGORITHM"] = "HS256"


import asyncio
from datetime import datetime
from fastapi import FastAPI
from httpx import AsyncClient
import logging
import pytest
from unittest.mock import AsyncMock, Mock


from api.services.audit.service import AuditService
from api.services.auth.service import AuthService
from api.cmd.migrations import runner
from api.config.postgres import PostgresConfig
from api.services.clients.service import ClientService
from api.services.currency.service import CurrencyService
from api.services.reservations.service import ReservationService
from api.services.summaries.service import SummaryService
from api.services.travel.service import TravelService
from api.services.quality.service import QualityService
from api.adapters.repository import ConnectionPoolManager
from api.cmd.api.main import make_app
from api.cmd.api.main import get_current_user
from datetime import datetime

log = logging.getLogger("rr")


def now() -> datetime:
    return datetime.now()


# Needed to monkeypatch as part of session scoped fixture
@pytest.fixture(scope="session")
def monkeysession():
    with pytest.MonkeyPatch.context() as monkeypatch:
        yield monkeypatch


@pytest.fixture
async def mock_auth_service():
    mock_service = Mock(spec=AuthService)
    mock_service.SECRET_KEY = "testsecretkey"
    mock_service.ALGORITHM = "HS256"
    mock_service.get_user = AsyncMock(
        return_value={
            "email": "testuser@example.com",
            "password": "testpassword",
            "role": "sales_support",
        }
    )
    return mock_service


@pytest.fixture
def travel_service(postgres_test_database):
    return TravelService()


@pytest.fixture
def summary_service(postgres_test_database):
    return SummaryService()


@pytest.fixture
def auth_service(postgres_test_database):
    return AuthService()


@pytest.fixture
def audit_service():
    return AuditService()


@pytest.fixture
def quality_service():
    return QualityService()


@pytest.fixture
def client_service(postgres_test_database):
    return ClientService()


@pytest.fixture
def currency_service():
    return CurrencyService()


@pytest.fixture
def reservation_service(postgres_test_database):
    return ReservationService()


@pytest.fixture
def app(
    travel_service,
    summary_service,
    auth_service,
    audit_service,
    quality_service,
    client_service,
    reservation_service,
    currency_service,
) -> FastAPI:
    app = make_app(
        travel_service,
        summary_service,
        auth_service,
        audit_service,
        quality_service,
        client_service,
        reservation_service,
        currency_service,
    )

    class MockUser:
        def __init__(self):
            self.email = "test@abc.com"

    async def override_get_current_user():
        return MockUser()

    app.dependency_overrides[get_current_user] = override_get_current_user

    return app


@pytest.fixture
async def ac(app) -> AsyncClient:
    ac = AsyncClient(base_url="http://test", app=app)
    yield ac
    await ac.aclose()


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the event loop for the entire session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def conn_cfg():
    """Fixture for testing DB config"""
    print(PostgresConfig.from_env())
    return PostgresConfig.from_env()


@pytest.fixture(scope="session", autouse=True)
async def postgres_test_database(event_loop):
    """Set up and tear down the PostgreSQL test database."""
    asyncio.set_event_loop(event_loop)
    test_db_name = "rr_test"
    original_db_name = "postgres"
    log.info("Spinning up PostgreSQL test database...")

    # Temporarily set the environment variable to the original database
    os.environ["POSTGRES_DB"] = original_db_name

    pool = await ConnectionPoolManager.get()
    async with pool.acquire() as connection:
        await connection.execute(f"DROP DATABASE IF EXISTS {test_db_name}")
        await connection.execute(f"CREATE DATABASE {test_db_name}")
    await pool.close()
    ConnectionPoolManager._pool = None

    # Change back to the test database
    os.environ["POSTGRES_DB"] = test_db_name

    log.info("Running migrations on test database.")
    pool = await ConnectionPoolManager.get()
    await runner.main()
    log.info("PostgreSQL test database initialized.")

    yield

    # Teardown code
    log.info("Closing connection to test database.")
    await pool.close()
    ConnectionPoolManager._pool = None
    log.info("Changing connection to main database.")
    os.environ["POSTGRES_DB"] = original_db_name
    pool = await ConnectionPoolManager.get()
    async with pool.acquire() as connection:
        await connection.execute(f"DROP DATABASE {test_db_name}")
    log.info("Tore down PostgreSQL test database.")

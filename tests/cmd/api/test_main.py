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
"""API tests."""
import os
from httpx import AsyncClient
from api.services.auth.models import User
import logging
from jose import jwt
from datetime import datetime, timedelta

log = logging.getLogger("rr")

# import json


async def test_get_empty_accommodation_logs(ac: AsyncClient):
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    assert len(accommodation_logs) == 0


def create_test_token(email: str, secret_key: str, algorithm: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {"sub": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


async def test_get_current_user_endpoint(ac: AsyncClient, auth_service):
    user_data = {
        "email": "testuser@example.com",
        "password": "testpassword",
        "role": "sales_support",
    }
    hashed_password = auth_service.hash_password(user_data["password"])
    auth_user = User(
        email=user_data["email"],
        hashed_password=hashed_password,
        role=user_data["role"],
    )
    # Create the user using AuthService
    await auth_service.add_user([auth_user])
    data = {"email": user_data["email"], "password": user_data["password"]}
    auth_res = await ac.post(url="/token", data=data)
    assert auth_res.status_code == 200
    auth_res = auth_res.json()
    assert auth_res["role"] == "sales_support"

    # user = await auth_service.get_user(email=user_data["email"])
    # print(user)
    # token = create_test_token(
    #     email=user.email,
    #     secret_key=os.environ["SECRET_KEY"],
    #     algorithm=os.environ["ALGORITHM"],
    # )
    # headers = {"Authorization": f"Bearer {token}"}
    # response = await ac.get("/v1/accommodation_logs", headers=headers)
    # assert response.status_code == 200


async def test_get_bad_endpoint(ac: AsyncClient):
    res = await ac.get(
        url="/v1/bad_endpoint",
    )
    assert res.status_code == 404


async def test_get_bad_token(ac: AsyncClient):
    data = {"email": "bad@email.com", "password": "badpassword"}
    auth_res = await ac.post(url="/token", data=data)
    assert auth_res.status_code == 401


async def test_get_root(ac: AsyncClient):
    res = await ac.get(url="/")
    return res.status_code == 200


async def add_core_destination(ac: AsyncClient):
    data = {
        "core_destination_id": None,
        "name": "Test Core Destination",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/core_destinations", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_core_destinations(ac: AsyncClient):
    res = await ac.get(url="/v1/core_destinations")
    assert len(res.json()) == 1
    return res.json()


async def add_country(ac: AsyncClient, core_destination_id: str):
    data = {
        "country_id": None,
        "name": "Test Country",
        "core_destination_id": core_destination_id,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/countries", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_countries(ac: AsyncClient):
    res = await ac.get(url="/v1/countries")
    assert len(res.json()) == 1
    return res.json()


async def add_portfolio(ac: AsyncClient):
    data = {
        "portfolio_id": None,
        "name": "Test Portfolio",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/portfolios", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_portfolios(ac: AsyncClient):
    res = await ac.get(url="/v1/portfolios")
    assert len(res.json()) == 1
    return res.json()


async def add_property(ac: AsyncClient, country_id: str, portfolio_id: str):
    data = {
        "property_id": None,
        "country_id": country_id,
        "portfolio_id": portfolio_id,
        "name": "Test Property",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/properties", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_properties(ac: AsyncClient):
    res = await ac.get(url="/v1/properties")
    assert len(res.json()) == 1
    return res.json()


async def add_consultant(ac: AsyncClient):
    data = {
        "consultant_id": None,
        "first_name": "Test",
        "last_name": "Test",
        "is_active": True,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/consultants", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_consultants(ac: AsyncClient):
    res = await ac.get(url="/v1/consultants")
    assert len(res.json()) == 1
    return res.json()


async def add_booking_channel(ac: AsyncClient):
    data = {
        "booking_channel_id": None,
        "name": "Test Booking Channel",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/booking_channels", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_booking_channels(ac: AsyncClient):
    res = await ac.get(url="/v1/booking_channels")
    assert len(res.json()) == 1
    return res.json()


async def add_agency(ac: AsyncClient):
    data = {
        "agency_id": None,
        "name": "Test Agency",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/agencies", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_agencies(ac: AsyncClient):
    res = await ac.get(url="/v1/agencies")
    assert len(res.json()) == 1
    return res.json()


async def add_accommodation_log(
    ac: AsyncClient,
    property_id: str,
    consultant_id: str,
    booking_channel_id: str,
    agency_id: str,
):
    data = [
        {
            "log_id": None,
            "property_id": property_id,
            "new_property_name": None,
            "new_property_portfolio_id": None,
            "new_property_portfolio_name": None,
            "new_property_country_id": None,
            "new_property_core_destination_id": None,
            "new_property_core_destination_name": None,
            "consultant_id": consultant_id,
            "primary_traveler": "Test/Test",
            "num_pax": 2,
            "date_in": "2024-01-01",
            "date_out": "2024-01-04",
            "booking_channel_id": booking_channel_id,
            "new_booking_channel_name": None,
            "agency_id": agency_id,
            "new_agency_name": None,
            "updated_by": "Test Package Runner",
        }
    ]
    res = await ac.patch(url="/v1/accommodation_logs", json=data)
    assert res.status_code == 200

    assert res.json() == {
        "summarized_audit_logs": {"accommodation_logs": {"insert": 1}},
        "messages": [],
    }


async def test_entry_elements_crud(ac: AsyncClient):
    log.info("In test_add_accommodation_logs")

    # seed a new core destination, get the response
    await add_core_destination(ac)
    core_destination_res = await get_core_destinations(ac)
    if core_destination_res:
        core_destination = core_destination_res[0]

    # using the new core destination, seed a new country, get the response
    await add_country(ac, core_destination["id"])
    country_res = await get_countries(ac)
    if country_res:
        country = country_res[0]

    await add_portfolio(ac)
    portfolio_res = await get_portfolios(ac)
    if portfolio_res:
        portfolio = portfolio_res[0]

    # using country & portfolio, seed a new property, get the response
    await add_property(ac, country["id"], portfolio["id"])
    property_res = await get_properties(ac)
    if property_res:
        property = property_res[0]

    # seed a consultant
    await add_consultant(ac)
    consultant_res = await get_consultants(ac)
    if consultant_res:
        consultant = consultant_res[0]

    # seed a booking channel
    await add_booking_channel(ac)
    bc_res = await get_booking_channels(ac)
    if bc_res:
        booking_channel = bc_res[0]

    # seed an agency
    await add_agency(ac)
    agency_res = await get_agencies(ac)
    if agency_res:
        agency = agency_res[0]

    await add_accommodation_log(
        ac,
        property_id=property["id"],
        consultant_id=consultant["id"],
        booking_channel_id=booking_channel["id"],
        agency_id=agency["id"],
    )


async def test_in_line_element_creation(ac: AsyncClient):
    # Tests a payload where the user created new agency/BC/property in the form
    consultant_res = await get_consultants(ac)
    if consultant_res:
        consultant = consultant_res[0]
    country_res = await get_countries(ac)
    if country_res:
        country = country_res[0]
        print(country)
    portfolio_res = await get_portfolios(ac)
    if portfolio_res:
        portfolio = portfolio_res[0]
    data = [
        {
            "log_id": None,
            # test with fill-in-the-blank property
            "property_id": None,
            "new_property_name": "Test In-Line Property",
            "new_property_portfolio_id": portfolio["id"],
            # TODO fix failure for fill-in-the-blank portfolio
            "new_property_portfolio_name": None,
            "new_property_country_id": country["id"],
            "new_property_core_destination_id": country["core_destination_id"],
            # TODO is new core destination in-line supported?
            "new_property_core_destination_name": None,
            "consultant_id": consultant["id"],
            "primary_traveler": "Test/Test",
            "num_pax": 2,
            "date_in": "2024-01-01",
            "date_out": "2024-01-04",
            # test with fill-in-the-blank booking channel
            "booking_channel_id": None,
            "new_booking_channel_name": "Test In-Line Booking Channel",
            # test with fill-in-the-blank agency
            "agency_id": None,
            "new_agency_name": "Test In-Line Agency",
            "updated_by": "Test Package Runner",
        }
    ]
    res = await ac.patch(url="/v1/accommodation_logs", json=data)
    assert res.status_code == 200

    assert res.json() == {
        "summarized_audit_logs": {
            "accommodation_logs": {"insert": 1},
            "agencies": {"insert": 1},
            "booking_channels": {"insert": 1},
            "properties": {"insert": 1},
        },
        "messages": [],
    }


async def test_get_accommodation_logs(ac: AsyncClient):
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    assert len(accommodation_logs) == 2
    for al in accommodation_logs:
        assert al["primary_traveler"] == "Test/Test"
        assert al["core_destination_name"] == "Test Core Destination"
        assert al["country_name"] == "Test Country"
        assert al["num_pax"] == 2
        assert al["date_in"] == "2024-01-01"
        assert al["date_out"] == "2024-01-04"
        assert al["bed_nights"] == 6
        assert al["property_portfolio"] == "Test Portfolio"
        if "In-Line" in al["property_name"]:
            assert al["property_name"] == "Test In-Line Property"
            assert al["agency_name"] == "Test In-Line Agency"
            assert al["booking_channel_name"] == "Test In-Line Booking Channel"
        else:
            assert al["property_name"] == "Test Property"
            assert al["agency_name"] == "Test Agency"
            assert al["booking_channel_name"] == "Test Booking Channel"
        assert al["consultant_first_name"] == "Test"
        assert al["consultant_last_name"] == "Test"
        assert al["consultant_display_name"] == "Test/Test"

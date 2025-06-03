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
"""API tests."""

from httpx import AsyncClient
from uuid import uuid4
import logging
from datetime import datetime
import pytest


log = logging.getLogger("rr")

# import json


async def test_get_empty_accommodation_logs(ac: AsyncClient):
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    assert len(accommodation_logs) == 0


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


async def add_country(
    ac: AsyncClient, core_destination_id: str, country_name: str | None = None
):
    data = {
        "country_id": None,
        "name": country_name if country_name else "Test Country",
        "core_destination_id": core_destination_id,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/countries", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_countries(ac: AsyncClient):
    res = await ac.get(url="/v1/countries")
    assert len(res.json()) == 1
    return res.json()


async def add_portfolio(ac: AsyncClient, portfolio_name: str | None = None):
    data = {
        "portfolio_id": None,
        "name": portfolio_name if portfolio_name else "Test Portfolio",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/portfolios", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_portfolios(ac: AsyncClient):
    res = await ac.get(url="/v1/portfolios")
    assert len(res.json()) == 1
    return res.json()


async def add_property(
    ac: AsyncClient,
    country_id: str,
    portfolio_id: str,
    new_property_name: str | None = None,
):
    data = {
        "property_id": None,
        "country_id": country_id,
        "portfolio_id": portfolio_id,
        "name": new_property_name if new_property_name else "Test Property",
        "property_location": "Test Location",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/properties", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_properties(ac: AsyncClient):
    res = await ac.get(url="/v1/properties")
    assert len(res.json()) > 0
    return res.json()


async def add_consultant(
    ac: AsyncClient, first_name: str | None = None, last_name: str | None = None
):
    data = {
        "consultant_id": None,
        "first_name": first_name if first_name else "Test",
        "last_name": last_name if last_name else "Test",
        "is_active": True,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/consultants", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_consultants(ac: AsyncClient):
    res = await ac.get(url="/v1/consultants")
    assert len(res.json()) == 1
    return res.json()


async def add_booking_channel(ac: AsyncClient, bc_name: str | None = None):
    data = {
        "booking_channel_id": None,
        "name": bc_name if bc_name else "Test Booking Channel",
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/booking_channels", json=data)
    assert res.json() == {"inserted_count": 1, "updated_count": 0}


async def get_booking_channels(ac: AsyncClient):
    res = await ac.get(url="/v1/booking_channels")
    assert len(res.json()) == 1
    return res.json()


async def add_agency(ac: AsyncClient, agency_name: str | None = None):
    data = {
        "agency_id": None,
        "name": agency_name if agency_name else "Test Agency",
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
    sample_al_id: str
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
        sample_al_id = al["id"]

    # test get by id:
    res = await ac.get(url=f"/v1/accommodation_logs/{sample_al_id}")
    assert res.status_code == 200
    res = res.json()
    assert res["primary_traveler"] == "Test/Test"

    # test get by bad id:
    res = await ac.get(url=f"/v1/accommodation_logs/{uuid4()}")
    assert res.status_code == 200
    res = res.json()
    assert res["message"] == "Accommodation log not found"

    # test delete by id:
    res = await ac.delete(url=f"/v1/accommodation_logs/{sample_al_id}")
    assert res.status_code == 200
    res = res.json()
    assert res["message"] == "Accommodation log deleted successfully"

    # test get by id:
    res = await ac.delete(url=f"/v1/accommodation_logs/{uuid4()}")
    assert res.status_code == 404
    assert res.json()["detail"] == "Accommodation log not found"


async def test_get_related_entries(ac: AsyncClient):
    property_res = await ac.get(url="/v1/properties")
    property = property_res.json()[0]
    data = {"identifier": property["id"], "identifier_type": "property_id"}
    res = await ac.get(url="/v1/related_entries", params=data)
    assert res.status_code == 200
    related_entries = res.json()
    assert related_entries["can_modify"] == False
    assert len(related_entries["affected_logs"]) == 1


async def test_get_overlaps(ac: AsyncClient):
    res = await ac.get(url="/v1/overlaps")
    assert res.status_code == 200


async def test_get_bed_night_report(ac: AsyncClient):
    res = await ac.get(url="/v1/bed_night_report")
    assert res.status_code == 200


async def test_get_bed_night_report_property_names(ac: AsyncClient):
    res = await ac.get(url="/v1/bed_night_report?property_names=Test%20Property")
    assert res.status_code == 200


async def test_get_bed_night_report_property_location(ac: AsyncClient):
    res = await ac.get(url="/v1/bed_night_report?property_location=Test%20Location")
    assert res.status_code == 200


async def test_export_bed_night_report(ac: AsyncClient):
    params = {"report_title": "Test Report"}
    res = await ac.get(url="/v1/export_bed_night_report", params=params)
    assert res.status_code == 200


async def test_export_bed_night_report_missing_title(ac: AsyncClient):
    params = {"bad": "params"}
    with pytest.raises(KeyError) as exc_info:
        await ac.get(url="/v1/export_bed_night_report", params=params)
    assert exc_info.value.args[0] == "report_title"


async def test_export_custom_report(ac: AsyncClient):
    params = {
        "report_title": "Test Report",
        "calculation_type": "bed_nights",
        "time_granularity": "month",
        "property_granularity": "property_name",
    }
    res = await ac.get(url="/v1/export_custom_report", params=params)
    assert res.status_code == 200


async def test_export_custom_report_missing_params(ac: AsyncClient):
    params = {"bad": "params"}
    with pytest.raises(KeyError) as exc_info:
        await ac.get(url="/v1/export_custom_report", params=params)
    assert exc_info.value.args[0] == "report_title"


async def test_export_custom_report_missing_report_params(ac: AsyncClient):
    params = {
        "report_title": "Test Report",
    }
    res = await ac.get(url="/v1/export_custom_report", params=params)
    assert res.status_code == 404
    assert res.json()["detail"] == "Missing required parameters for report generation."


async def test_get_audit_logs(ac: AsyncClient):
    res = await ac.get(url="/v1/audit_logs")
    assert res.status_code == 200
    # log.info(f"Number of audit logs: {len(res.json())}")
    # Number of audit logs generated thusfar during testing
    assert len(res.json()) == 17


async def test_get_trips(ac: AsyncClient):
    res = await ac.get(url="/v1/trips")
    assert res.status_code == 200
    print(res)


async def test_update_trip_inserts_when_not_found(ac: AsyncClient):
    # Use a non-existent trip ID (simulate not found) but expect the endpoint to create a new trip.
    fake_id = str(uuid4())
    patch_payload = {
        "id": fake_id,
        "trip_name": "Inserted Trip",
        "updated_by": "tester",
        "updated_at": datetime.now().isoformat(),
    }
    res = await ac.patch("/v1/trips", json=patch_payload)
    assert res.status_code == 200
    data = res.json()
    assert "inserted_count" in data
    assert data.get("inserted_count", 0) > 0


async def test_update_trip_insert_success(ac: AsyncClient):
    # Create a new trip via PATCH (insert)
    new_trip_payload = {
        "trip_name": "Successful Trip Insert",
        "updated_at": datetime.now().isoformat(),
        "updated_by": "tester",
    }
    res = await ac.patch("/v1/trips", json=new_trip_payload)
    assert res.status_code == 200
    data = res.json()
    # For an insert, expect inserted_count to be positive (or at least present)
    assert "inserted_count" in data or "updated_count" in data


async def test_update_trip_update_success(ac: AsyncClient):
    # First, create a new trip via PATCH (insert)
    trip_id = str(uuid4())
    new_trip_payload = {
        "id": trip_id,
        "trip_name": "Successful Trip Update",
        "updated_at": datetime.now().isoformat(),
        "updated_by": "tester",
    }
    create_res = await ac.patch("/v1/trips", json=new_trip_payload)
    assert create_res.status_code == 200
    print(create_res.json())

    # Now update the trip using the same generated ID.
    patch_payload = {
        "id": trip_id,
        "trip_name": "Successful Trip Update - Modified",
        "updated_at": datetime.now().isoformat(),
        "updated_by": "tester",
    }
    res = await ac.patch("/v1/trips", json=patch_payload)
    assert res.status_code == 200
    data = res.json()
    # Check that the response indicates an update was processed
    assert "inserted_count" in data or "updated_count" in data

    trip = await ac.get(f"/v1/trips/{str(trip_id)}")
    trip_data = trip.json()
    print(trip)
    assert trip_data["updated_by"] == "tester"
    assert trip_data["trip_name"] == "Successful Trip Update - Modified"


async def test_upsert_creates_and_updates_trip(ac: AsyncClient):
    # 1. Get a valid travel advisor id from the /v1/users endpoint
    users_res = await ac.get("/v1/users")
    assert users_res.status_code == 200
    users = users_res.json()
    # Ensure we have at least one user
    assert len(users) > 0
    travel_advisor_id = users[0]["id"]
    travel_advisor_name = users[0]["email"]

    # 2. Create a new trip via PATCH (this will insert since the trip doesn't exist)
    initial_id = str(uuid4())
    # build with initial trip data, some unknowns
    initial_payload = {
        "id": initial_id,
        "trip_name": "Original Trip",
        "lead_source": "Tripadvisor",
        "inquiry_date": "2024-11-01",
        "deposit_date": "2024-11-28",
        "final_payment_date": "2025-07-10",
        "sell_price": 82000.0,
        "cost_from_suppliers": 70000.0,
        "notes": "Initial notes",
        "flights_handled_by": None,
        "full_coverage_policy": None,
        "travel_advisor_id": None,
        "updated_at": datetime.now().isoformat(),
        "updated_by": "tester",
    }
    res = await ac.patch("/v1/trips", json=initial_payload)
    assert res.status_code == 200
    data = res.json()
    # We expect an insert operation (since the trip did not exist before)
    assert "inserted_count" in data
    assert data.get("inserted_count", 0) > 0

    # 3. Update the trip via PATCH (this will perform an update on the existing record)
    # complete trip information, new full cost etc
    updated_payload = {
        "id": initial_id,
        "trip_name": "Updated Trip",
        "lead_source": "Referral",
        "inquiry_date": "2024-11-01",
        "deposit_date": "2024-11-28",
        "final_payment_date": "2025-07-11",
        "sell_price": 84000.0,
        "cost_from_suppliers": 72000.0,
        "notes": "Updated notes",
        "flights_handled_by": "TB",
        "full_coverage_policy": True,
        "travel_advisor_id": travel_advisor_id,
        "updated_at": datetime.now().isoformat(),
        "updated_by": "tester2",
    }
    res = await ac.patch("/v1/trips", json=updated_payload)
    assert res.status_code == 200
    data = res.json()
    # We now expect an update operation
    assert "updated_count" in data
    assert data.get("updated_count", 0) > 0

    # 4. Retrieve the trip to verify all fields have been updated.
    # Assuming there is a GET endpoint at `/v1/trips/{trip_id}`.
    res_get = await ac.get(f"/v1/trips/{initial_id}")
    assert res_get.status_code == 200
    trip = res_get.json()

    # Assert that each field matches the updated payload.
    assert trip["trip_name"] == "Updated Trip"
    assert trip["lead_source"] == "Referral"
    assert trip["inquiry_date"] == "2024-11-01"
    assert trip["deposit_date"] == "2024-11-28"
    assert trip["final_payment_date"] == "2025-07-11"
    assert trip["sell_price"] == 84000.0
    assert trip["cost_from_suppliers"] == 72000.0
    assert trip["notes"] == "Updated notes"
    assert trip["flights_handled_by"] == "TB"
    assert trip["full_coverage_policy"] is True
    assert trip["updated_by"] == "tester2"
    assert trip["travel_advisor_id"] == travel_advisor_id
    assert trip["travel_advisor_name"] == travel_advisor_name


# Starting to delete, so do everything that requires entry elements above
async def test_delete_property_related_entries(ac: AsyncClient):
    # test for property attached to accommodation log
    property_res = await ac.get(url="/v1/properties")
    property = property_res.json()[0]
    res = await ac.delete(url=f"/v1/properties/{property['id']}")
    assert res.status_code == 400


async def test_delete_property_no_related_entries(ac: AsyncClient):
    # test for property not attached to accommodation log
    country_res = await get_countries(ac)
    if country_res:
        country = country_res[0]

    portfolio_res = await get_portfolios(ac)
    if portfolio_res:
        portfolio = portfolio_res[0]

    # using country & portfolio, seed a new property, get the response
    await add_property(
        ac,
        country["id"],
        portfolio["id"],
        "Test Unused Property",
    )
    property_res = await ac.get(url=f"/v1/properties")
    properties = property_res.json()
    test_unused_property = None
    for prop in properties:
        if prop.get("name") == "Test Unused Property":
            test_unused_property = prop
            break

    if not test_unused_property:
        pytest.fail("Test Unused Property was not found in the properties list.")

    res = await ac.delete(url=f"/v1/properties/{test_unused_property['id']}")
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_property_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/properties/{uuid4()}")
    assert res.status_code == 404


async def test_patch_property_details(ac: AsyncClient):
    property_res = await ac.get(url=f"/v1/properties")
    sample_property = property_res.json()[0]
    data = {
        "property_id": sample_property["id"],
        "property_type": "luxury hotel",
        "price_range": None,
        "num_tents": None,
        "has_trackers": False,
        "has_wifi_in_room": True,
        "has_wifi_in_common_areas": True,
        "has_hairdryers": True,
        "has_pool": True,
        "has_heated_pool": None,
        "has_credit_card_tipping": None,
        "is_child_friendly": None,
        "is_handicap_accessible": None,
        "updated_by": "Test Package Runner",
    }

    res = await ac.patch(url="/v1/property_details", json=data)
    assert res.status_code == 200
    res = res.json()
    log.info(res)


async def test_get_property_details(ac: AsyncClient):
    res = await ac.get(url=f"/v1/property_details")
    assert res.status_code == 200
    properties = res.json()
    # only has the number of properties that have details added
    assert len(properties) == 1

    property_with_details = properties[0]
    assert property_with_details["property_type"] == "luxury hotel"
    assert property_with_details["has_trackers"] == False

    res = await ac.get(
        url=f"/v1/property_details/{property_with_details['property_id']}"
    )
    assert res.status_code == 200
    res = res.json()
    assert res["property_type"] == "luxury hotel"
    assert res["has_trackers"] == False


async def test_delete_country_related_entries(ac: AsyncClient):
    # test for country attached to another entity
    country_res = await ac.get(url="/v1/countries")
    country = country_res.json()[0]
    res = await ac.delete(url=f"/v1/countries/{country['id']}")
    assert res.status_code == 400


async def test_delete_country_no_related_entries(ac: AsyncClient):
    core_destination_res = await get_core_destinations(ac)
    if core_destination_res:
        core_destination = core_destination_res[0]
    await add_country(
        ac,
        core_destination["id"],
        "Test Unused Country",
    )
    country_res = await ac.get(url=f"/v1/countries")
    countries = country_res.json()
    test_unused_country = None
    for country in countries:
        if country.get("name") == "Test Unused Country":
            test_unused_country = country
            break

    if not test_unused_country:
        pytest.fail("Test Unused Country was not found in the countries list.")

    res = await ac.delete(url=f"/v1/countries/{test_unused_country['id']}")
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_country_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/countries/{uuid4()}")
    assert res.status_code == 404


async def test_delete_consultant_related_entries(ac: AsyncClient):
    # test for consultant attached to another entity
    consultant_res = await ac.get(url="/v1/consultants")
    consultant = consultant_res.json()[0]
    res = await ac.delete(url=f"/v1/consultants/{consultant['id']}")
    assert res.status_code == 400


async def test_delete_consultant_no_related_entries(ac: AsyncClient):
    await add_consultant(
        ac,
        "Unused",
        "Consultant",
    )
    consultant_res = await ac.get(url=f"/v1/consultants")
    consultants = consultant_res.json()
    test_unused_consultant = None
    for cons in consultants:
        if cons.get("display_name") == "Consultant/Unused":
            test_unused_consultant = cons
            break

    if not test_unused_consultant:
        pytest.fail("Test Unused Consultant was not found in the properties list.")

    res = await ac.delete(url=f"/v1/consultants/{test_unused_consultant['id']}")
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_consultant_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/consultants/{uuid4()}")
    assert res.status_code == 404


async def test_delete_booking_channel_related_entries(ac: AsyncClient):
    # test for booking_channel attached to another entity
    # find a booking channel to attempt to delete from an accommodation log
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    found_used_booking_channel_id = None
    for al in accommodation_logs:
        if al.get("booking_channel_id"):
            found_used_booking_channel_id = al.get("booking_channel_id")

    if not found_used_booking_channel_id:
        pytest.fail("Test Used Booking Channel was not found in the properties list.")

    res = await ac.delete(url=f"/v1/booking_channels/{found_used_booking_channel_id}")
    assert res.status_code == 400


async def test_delete_booking_channel_no_related_entries(ac: AsyncClient):
    await add_booking_channel(ac, "Unused Booking Channel")
    bc_res = await ac.get(url=f"/v1/booking_channels")
    booking_channels = bc_res.json()
    test_unused_booking_channel = None
    for bc in booking_channels:
        if bc.get("name") == "Unused Booking Channel":
            test_unused_booking_channel = bc
            break

    if not test_unused_booking_channel:
        pytest.fail("Test Unused Booking Channel was not found in the properties list.")

    res = await ac.delete(
        url=f"/v1/booking_channels/{test_unused_booking_channel['id']}"
    )
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_booking_channel_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/booking_channels/{uuid4()}")
    assert res.status_code == 404


async def test_delete_agency_related_entries(ac: AsyncClient):
    # test for agency attached to another entity
    # find an agency to attempt to delete from an accommodation log
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    found_used_agency_id = None
    for al in accommodation_logs:
        if al.get("agency_id"):
            found_used_agency_id = al.get("agency_id")

    if not found_used_agency_id:
        pytest.fail("Test Used Agency was not found in the properties list.")

    res = await ac.delete(url=f"/v1/agencies/{found_used_agency_id}")
    assert res.status_code == 400


async def test_delete_agency_no_related_entries(ac: AsyncClient):
    await add_agency(ac, "Unused Agency")
    ag_res = await ac.get(url=f"/v1/agencies")
    agencies = ag_res.json()
    test_unused_agency = None
    for ag in agencies:
        if ag.get("name") == "Unused Agency":
            test_unused_agency = ag
            break

    if not test_unused_agency:
        pytest.fail("Test Unused Agency was not found in the properties list.")

    res = await ac.delete(url=f"/v1/agencies/{test_unused_agency['id']}")
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_agency_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/agencies/{uuid4()}")
    assert res.status_code == 404


async def test_delete_portfolio_entries(ac: AsyncClient):
    # test for portfolio attached to another entity
    # find an portfolio to attempt to delete from an accommodation log
    res = await ac.get(url="/v1/accommodation_logs")
    assert res.status_code == 200
    accommodation_logs = res.json()
    found_used_portfolio_id = None
    for al in accommodation_logs:
        if al.get("property_portfolio_id"):
            found_used_portfolio_id = al.get("property_portfolio_id")

    if not found_used_portfolio_id:
        pytest.fail("Test Used Portfolio was not found in the properties list.")

    res = await ac.delete(url=f"/v1/portfolios/{found_used_portfolio_id}")
    assert res.status_code == 400


async def test_delete_portfolio_no_related_entries(ac: AsyncClient):
    await add_portfolio(ac, "Unused Portfolio")
    p_res = await ac.get(url=f"/v1/portfolios")
    portfolios = p_res.json()
    test_unused_portfolio = None
    for portfolio in portfolios:
        if portfolio.get("name") == "Unused Portfolio":
            test_unused_portfolio = portfolio
            break

    if not test_unused_portfolio:
        pytest.fail("Test Unused Portfolio was not found in the properties list.")

    res = await ac.delete(url=f"/v1/portfolios/{test_unused_portfolio['id']}")
    assert res.status_code == 200
    log.info(res.json())


async def test_delete_portfolio_not_found(ac: AsyncClient):
    res = await ac.delete(url=f"/v1/portfolios/{uuid4()}")
    assert res.status_code == 404

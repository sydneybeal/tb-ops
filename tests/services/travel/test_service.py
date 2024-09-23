"""Tests for Travel Service."""

import os
import pytest
from typing import Iterable
from api.services.travel.service import TravelService
from api.services.travel.models import AccommodationLog


@pytest.fixture
def accommodation_logs():
    accommodation_logs = [
        {
            "id": "59eb9a25-e618-4c51-9ff8-c190cd99a590",
            "primary_traveler": "Test/Test",
            "core_destination_name": "Asia",
            "core_destination_id": "0469f025-a697-428a-ae00-82d0b5e5649b",
            "country_name": "Thailand",
            "country_id": "633e7daa-3634-437d-b171-5456cec19cb8",
            "date_in": "2024-02-11",
            "date_out": "2024-02-14",
            "num_pax": 2,
            "property_name": "Test Standard Hotel",
            "property_type": "standard hotel",
            "property_location": "Chiang Mai",
            "property_latitude": 18.78017,
            "property_longitude": 99.00456,
            "property_portfolio_id": "5edf45bb-1ec1-4d65-b9bc-77c279a15769",
            "property_portfolio": "Ind. Owned",
            "booking_channel_name": "Test Travel",
            "agency_name": "n/a",
            "consultant_id": "902a2df3-f770-4bde-8224-ecd2cc5fcd13",
            "consultant_first_name": "Test",
            "consultant_last_name": "Test",
            "consultant_is_active": True,
            "property_id": "119e6035-a928-4b5d-bd1a-10ccd37035c0",
            "booking_channel_id": "193d92da-72c4-4076-b862-c50ff9ecc718",
            "agency_id": "09fad795-726c-4514-a46a-838733fa528b",
            "trip_id": None,
            "trip_name": None,
            "created_at": "2024-03-14T01:21:53.129748Z",
            "updated_at": "2024-03-14T01:21:53.129749Z",
            "updated_by": "Test",
            "bed_nights": 6,
            "consultant_display_name": "Test/Test",
        }
    ]
    return [AccommodationLog(**al) for al in accommodation_logs]


@pytest.fixture
def test_email():
    return "test@travelbeyond.com"


# async def test_accommodation_logs_crud(
#     accommodation_logs: Iterable[AccommodationLog], test_email: str
# ) -> None:
#     travel_service = TravelService()

#     print(f"{travel_service._repo}")

# First delete just in case there are leftovers
# for accommodation_log in accommodation_logs:
#     await travel_service.delete_accommodation_log(accommodation_log.id, test_email)

# tests/factories.py

import uuid
from typing import List
from api.services.travel.service import TravelService
from api.services.travel.models import (
    Country,
    Portfolio,
    CoreDestination,
    BookingChannel,
    Property,
    AccommodationLog,
)


async def create_country(
    travel_service: TravelService, name: str = "Test Country"
) -> Country:
    country = Country(
        name=name,
        updated_by="Test Package Runner",
    )
    await travel_service.add_country(country)
    return country


async def create_portfolio(
    travel_service: TravelService, name: str = "Test Portfolio"
) -> Portfolio:
    portfolio = Portfolio(
        name=name,
        updated_by="Test Package Runner",
    )
    await travel_service.add_portfolio([portfolio])
    return portfolio


async def create_core_destination(
    travel_service: TravelService, name: str = "Test Core Destination"
) -> CoreDestination:
    core_destination = CoreDestination(
        name=name,
        updated_by="Test Package Runner",
    )
    await travel_service.add_core_destination(core_destination)
    return core_destination


async def create_booking_channel(
    travel_service: TravelService, name: str = "Test Booking Channel"
) -> BookingChannel:
    booking_channel = BookingChannel(
        name=name,
        updated_by="Test Package Runner",
    )
    await travel_service.add_booking_channel(booking_channel)
    return booking_channel


async def create_property(
    travel_service: TravelService,
    name: str = "Test Property",
    portfolio: Portfolio = None,
    country: Country = None,
    core_destination: CoreDestination = None,
    property_type: str = "Luxury Hotel",
    location: str = "Test Location",
    latitude: float = 12.345678,
    longitude: float = 98.765432,
) -> Property:
    if not all([portfolio, country, core_destination]):
        raise ValueError(
            "Portfolio, Country, and Core Destination must be provided to create a Property."
        )

    property = Property(
        name=name,
        portfolio_id=portfolio.id,
        country_id=country.id,
        core_destination_id=core_destination.id,
        property_type=property_type,
        location=location,
        latitude=latitude,
        longitude=longitude,
        updated_by="Test",
    )
    await travel_service.add_property(property)
    return property


async def create_accommodation_log(
    travel_service: TravelService,
    property: Property,
    booking_channel: BookingChannel,
    primary_traveler: str = "Test/Test",
    core_destination_name: str = "Asia",
    core_destination_id: str = None,
    country_name: str = "Thailand",
    country_id: str = None,
    date_in: str = "2024-02-11",
    date_out: str = "2024-02-14",
    num_pax: int = 2,
    property_name: str = "Test Standard Hotel",
    property_type: str = "Standard Hotel",
    property_location: str = "Chiang Mai",
    property_latitude: float = 18.78017,
    property_longitude: float = 99.00456,
    property_portfolio_id: str = None,
    property_portfolio: str = "Ind. Owned",
    booking_channel_name: str = "Test Travel",
    agency_name: str = "n/a",
    consultant_id: str = "902a2df3-f770-4bde-8224-ecd2cc5fcd13",
    consultant_first_name: str = "Test",
    consultant_last_name: str = "Test",
    consultant_is_active: bool = True,
    agency_id: str = "09fad795-726c-4514-a46a-838733fa528b",
    trip_id: str = None,
    trip_name: str = None,
    bed_nights: int = 6,
    consultant_display_name: str = "Test/Test",
) -> AccommodationLog:
    accommodation_log = AccommodationLog(
        id=str(uuid.uuid4()),
        primary_traveler=primary_traveler,
        core_destination_id=core_destination_id
        or "0469f025-a697-428a-ae00-82d0b5e5649b",
        country_id=country_id or "633e7daa-3634-437d-b171-5456cec19cb8",
        date_in=date_in,
        date_out=date_out,
        num_pax=num_pax,
        consultant_id=consultant_id,
        property_id=property.id,
        booking_channel_id=booking_channel.id,
        agency_id=agency_id,
        trip_id=trip_id,
        created_at=None,
        updated_at=None,
        updated_by="Test",
    )
    await travel_service.add_accommodation_log(accommodation_log)
    return accommodation_log

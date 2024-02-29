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

"""Services for interacting with travel entries."""
import datetime
from typing import Optional, Sequence, Union
from uuid import UUID
from api.services.travel.models import (
    AccommodationLog,
    PatchAccommodationLogRequest,
    Agency,
    PatchAgencyRequest,
    BookingChannel,
    PatchBookingChannelRequest,
    Consultant,
    PatchConsultantRequest,
    CoreDestination,
    Country,
    Property,
    PatchPropertyRequest,
)
from api.services.travel.repository.postgres import PostgresTravelRepository


class TravelService:
    """Service for interfacing with the travel repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresTravelRepository()

    # AccommodationLog
    async def add_accommodation_log(self, models: Sequence[AccommodationLog]) -> None:
        """Adds accommodation log model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_accommodation_log(
                model.primary_traveler, model.property_id, model.date_in, model.date_out
            )
        ]
        await self._repo.add_accommodation_log(to_be_added)

    async def get_accommodation_log(
        self,
        primary_traveler: str,
        property_id: str,
        date_in: datetime.date,
        date_out: datetime.date,
    ) -> Optional[AccommodationLog]:
        """Finds existing accommodation log."""
        # Assuming log_request has all necessary fields to match an existing log
        return await self._repo.get_accommodation_log(
            primary_traveler,
            property_id,
            date_in,
            date_out,
        )

    async def delete_accommodation_log(self, log_id: UUID):
        """Deletes an AccommodationLog."""
        return await self._repo.delete_accommodation_log(log_id)

    async def get_accommodation_log_by_id(
        self,
        log_id: UUID,
    ) -> Optional[AccommodationLog]:
        """Finds existing accommodation log by its ID."""
        # Assuming log_request has all necessary fields to match an existing log
        return await self._repo.get_accommodation_log_by_id(log_id)

    async def process_accommodation_log_requests(
        self, log_requests: Sequence[PatchAccommodationLogRequest]
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        prepared_logs = [
            await self.prepare_accommodation_log_data(log_request)
            for log_request in log_requests
        ]
        valid_logs_to_upsert = [log for log in prepared_logs if log is not None]

        # Perform the upsert operation for valid logs
        inserted_count = 0
        updated_count = 0
        if valid_logs_to_upsert:
            results = await self._repo.upsert_accommodation_log(valid_logs_to_upsert)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        return {
            "inserted_count": 0,
            "updated_count": 0,
            "message": "No logs were processed.",
        }

    async def prepare_accommodation_log_data(
        self, log_request: PatchAccommodationLogRequest
    ) -> Optional[AccommodationLog]:
        """Processes an accommodation log add or update request."""
        # Resolve entity IDs
        agency_id = await self.resolve_agency_id(log_request)
        booking_channel_id = await self.resolve_booking_channel_id(log_request)
        property_id = await self.resolve_property_id(log_request)

        # # Check if this log exists and needs updating or if it's a new log
        if log_request.log_id:
            existing_log = await self.get_accommodation_log_by_id(log_request.log_id)
        else:
            existing_log = await self.get_accommodation_log(
                log_request.primary_traveler,
                log_request.property_id,
                log_request.date_in,
                log_request.date_out,
            )
        if existing_log:
            print("Accommodation log already existed")
            updated_log_data = self.prepare_updated_log_data(
                log_request, existing_log, property_id, booking_channel_id, agency_id
            )
            return updated_log_data
        # If new, prepare the new log data
        new_log_data = self.prepare_new_log_data(
            log_request, property_id, booking_channel_id, agency_id
        )
        return new_log_data  # Return the prepared data for insertion

    def prepare_new_log_data(
        self,
        log_request: PatchAccommodationLogRequest,
        property_id: UUID,
        booking_channel_id: UUID,
        agency_id: UUID,
    ) -> AccommodationLog:
        """Prepares a new AccommodationLog with the required fields."""
        new_log = AccommodationLog(
            property_id=property_id,
            consultant_id=log_request.consultant_id,
            primary_traveler=log_request.primary_traveler,
            num_pax=log_request.num_pax,
            date_in=log_request.date_in,
            date_out=log_request.date_out,
            booking_channel_id=booking_channel_id,
            agency_id=agency_id,
            updated_by=log_request.updated_by,
        )
        return new_log

    def prepare_updated_log_data(
        self,
        log_request: PatchAccommodationLogRequest,
        existing_log: AccommodationLog,
        property_id: UUID,
        booking_channel_id: UUID,
        agency_id: UUID,
    ) -> AccommodationLog:
        """Prepares an updated AccommodationLog with the updated fields."""
        # Compare fields between log_request and existing_log
        # Only include fields in the update that have changed
        # This example assumes you will create a new AccommodationLog object with potentially updated values
        updated_log = AccommodationLog(
            id=existing_log.id,  # Keep the same ID
            property_id=property_id,
            consultant_id=log_request.consultant_id,
            primary_traveler=log_request.primary_traveler,
            num_pax=log_request.num_pax,
            date_in=log_request.date_in,
            date_out=log_request.date_out,
            booking_channel_id=booking_channel_id,
            agency_id=agency_id,
            updated_by=log_request.updated_by,
        )
        return updated_log

    async def resolve_agency_id(
        self, log_request: PatchAccommodationLogRequest
    ) -> UUID:
        """Gets or creates an agency based on either agency ID or new agency name."""
        if log_request.agency_id:
            return log_request.agency_id
        elif log_request.new_agency_name:
            existing_agency = await self.get_agency_by_name(log_request.new_agency_name)
            if existing_agency:
                print("Passed a new agency name and found it in the database already.")
                return existing_agency.id
            else:
                # Create a new Agency model instance
                new_agency = Agency(
                    name=log_request.new_agency_name, updated_by=log_request.updated_by
                )
                # Pass a list of Agency instances to add_agency
                await self.add_agency([new_agency])
                # Fetch the newly created or existing agency by name to get its ID
                agency_created = await self.get_agency_by_name(
                    log_request.new_agency_name
                )
                return agency_created.id
        else:
            return None

    async def resolve_booking_channel_id(
        self, log_request: PatchAccommodationLogRequest
    ) -> UUID:
        """Gets or creates a booking channel based on either ID or new booking channel name."""
        if log_request.booking_channel_id:
            return log_request.booking_channel_id
        elif log_request.new_booking_channel_name:
            existing_booking_channel = await self.get_booking_channel_by_name(
                log_request.new_booking_channel_name
            )
            if existing_booking_channel:
                print(
                    "Passed a new booking channel name and found it in the database already."
                )
                return existing_booking_channel.id
            else:
                # Create a new BookingChannel model instance
                new_booking_channel = BookingChannel(
                    name=log_request.new_booking_channel_name,
                    updated_by=log_request.updated_by,
                )
                # Pass a list of BooikingChannel instances to add_booking_channel
                await self.add_booking_channel([new_booking_channel])
                # Fetch the newly created or existing booking channel by name to get its ID
                booking_channel_created = await self.get_booking_channel_by_name(
                    log_request.new_booking_channel_name
                )
                return booking_channel_created.id
        else:
            return None

    async def resolve_property_id(
        self, log_request: PatchAccommodationLogRequest
    ) -> UUID:
        """Gets or creates a property based on either property ID or new property name."""
        if log_request.property_id:
            return log_request.property_id
        existing_property = await self.get_property_by_name(
            log_request.new_property_name,
            log_request.new_property_portfolio_name,
            log_request.new_property_country_id,
            log_request.new_property_core_destination_id,
        )
        if existing_property:
            print("Passed a new property and found it in the database already.")
            return existing_property.id
        else:
            # Create a new Property model instance
            new_property = Property(
                name=log_request.new_property_name,
                portfolio=log_request.new_property_portfolio_name,
                country_id=log_request.new_property_country_id,
                core_destination_id=log_request.new_property_core_destination_id,
                updated_by=log_request.updated_by,
            )
            # Pass a list of Property instances to add_property
            await self.add_property([new_property])
            # Fetch the newly created or existing property by name to get its ID
            property_created = await self.get_property_by_name(
                log_request.new_property_name,
                log_request.new_property_portfolio_name,
                log_request.new_property_country_id,
                log_request.new_property_core_destination_id,
            )
            return property_created.id

    # Country
    async def add_country(self, models: Sequence[Country]) -> None:
        """Adds country model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_country_by_name(model.name)
        ]
        await self._repo.add_country(to_be_added)

    async def get_country_by_id(self, country_id: UUID) -> Country:
        """Gets a single Country model by name."""
        return await self._repo.get_country_by_id(country_id)

    async def get_country_by_name(self, name: str) -> Country:
        """Gets a single Country model by name."""
        return await self._repo.get_country_by_name(name)

    async def get_countries_by_name(self, names: Sequence[str]) -> Sequence[Country]:
        """Gets a sequence of Country models by country name."""
        return await self._repo.get_countries_by_name(names)

    # CoreDestination
    async def add_core_destination(self, models: Sequence[CoreDestination]) -> None:
        """Adds core destination model to the repository."""
        # Only add countries that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_core_destination_by_name(model.name)
        ]

        await self._repo.add_core_destination(to_be_added)

    async def get_core_destination_by_name(self, name: str) -> CoreDestination:
        """Gets a sequence of CoreDestination models by core destination name"""
        return await self._repo.get_core_destination_by_name(name)

    # Property
    async def add_property(self, models: Sequence[Property]) -> None:
        """Adds Property models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_property_by_name(
                model.name, model.portfolio, model.country_id, model.core_destination_id
            )
        ]
        await self._repo.add_property(to_be_added)

    async def process_property_request(
        self, property_request: PatchPropertyRequest
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        prepared_data_or_error = await self.prepare_property_data(property_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a name conflict
            return {"error": prepared_data_or_error["error"]}

        if prepared_data_or_error:
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_property(prepared_data_or_error)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid property data provided for processing."}

    async def prepare_property_data(
        self, property_request: PatchPropertyRequest
    ) -> Property:
        """Resolves and prepares a property patch for insertion."""
        # Check if this property exists and needs updating

        country = await self._repo.get_country_by_id(property_request.country_id)
        core_destination_id = country.core_destination_id
        if core_destination_id is None:
            raise ValueError("Invalid country_id")

        existing_property_by_id = None
        if property_request.property_id:
            existing_property_by_id = await self.get_property_by_id(
                property_request.property_id
            )

        # Check for a name conflict with a different property
        existing_property_by_name = await self.get_property_by_name(
            property_request.name,
            property_request.portfolio,
            property_request.country_id,
            core_destination_id,
        )
        if existing_property_by_name and (
            not existing_property_by_id
            or existing_property_by_id.id != existing_property_by_name.id
        ):
            # Found a name conflict with another property
            return {
                "error": f"Property '{property_request.name}' in {country.name} already exists."
            }

        if existing_property_by_id:
            if (
                existing_property_by_id.name == property_request.name
                and existing_property_by_id.portfolio == property_request.portfolio
                and existing_property_by_id.country_id == property_request.country_id
                and existing_property_by_id.core_destination_id == core_destination_id
            ):
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing property with possibly updated fields
            return Property(
                id=existing_property_by_id.id,  # Keep the same ID
                name=property_request.name,
                portfolio=property_request.portfolio,
                country_id=property_request.country_id,
                core_destination_id=core_destination_id,
                updated_by=property_request.updated_by,
            )
        else:
            # If new, prepare the new property data
            return Property(
                name=property_request.name,
                portfolio=property_request.portfolio,
                country_id=property_request.country_id,
                core_destination_id=core_destination_id,
                updated_by=property_request.updated_by,
            )

    async def get_property_by_name(
        self,
        name: str,
        portfolio_name: str,
        country_id: Optional[str],
        core_destination_id: Optional[str],
    ) -> Property:
        """Gets a single Property model by name, portfolio, country, core_destination."""
        return await self._repo.get_property_by_name(
            name, portfolio_name, country_id, core_destination_id
        )

    async def get_property_by_id(self, property_id: UUID) -> Property:
        """Gets a single Property model by id."""
        return await self._repo.get_property_by_id(property_id)

    async def delete_property(self, property_id: UUID):
        """Deletes a Property."""
        return await self._repo.delete_property(property_id)

    # Agency
    async def add_agency(self, models: Sequence[Agency]) -> None:
        """Adds Agency models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_agency_by_name(model.name)
        ]
        await self._repo.add_agency(to_be_added)

    async def get_all_agencies(self) -> Sequence[Agency]:
        """Gets all Agency models."""
        return await self._repo.get_all_agencies()

    async def get_agency_by_name(self, name: str) -> Agency:
        """Gets a single Agency model by name."""
        return await self._repo.get_agency_by_name(name)

    async def get_agency_by_id(self, agency_id: UUID) -> Agency:
        """Gets a single Agency model by id."""
        return await self._repo.get_agency_by_id(agency_id)

    async def process_agency_request(self, agency_request: PatchAgencyRequest) -> dict:
        """Adds or edits agency models in the repository."""
        prepared_data_or_error = await self.prepare_agency_data(agency_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a name conflict
            return {"error": prepared_data_or_error["error"]}

        if prepared_data_or_error:
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_agency(prepared_data_or_error)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid agency data provided for processing."}

    async def prepare_agency_data(
        self, agency_request: PatchAgencyRequest
    ) -> Union[Agency, dict]:
        """Resolves and prepares an agency patch for insertion or update."""
        # Check if this agency exists and needs updating
        existing_agency_by_id = None
        if agency_request.agency_id:
            existing_agency_by_id = await self.get_agency_by_id(
                agency_request.agency_id
            )

        # Check for a name conflict with a different agency
        existing_agency_by_name = await self.get_agency_by_name(agency_request.name)
        if existing_agency_by_name and (
            not existing_agency_by_id
            or existing_agency_by_id.id != existing_agency_by_name.id
        ):
            # Found a name conflict with another agency
            return {
                "error": f"An agency with the name '{agency_request.name}' already exists."
            }

        if existing_agency_by_id:
            if existing_agency_by_id.name == agency_request.name:
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing agency with possibly updated fields
            return Agency(
                id=existing_agency_by_id.id,  # Keep the same ID
                name=agency_request.name,
                updated_by=agency_request.updated_by,
            )
        else:
            # If new, prepare the new agency data
            return Agency(
                name=agency_request.name,
                updated_by=agency_request.updated_by,
            )

    async def delete_agency(self, agency_id: UUID):
        """Deletes an Agency."""
        return await self._repo.delete_agency(agency_id)

    # BookingChannel
    async def add_booking_channel(self, models: Sequence[BookingChannel]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_booking_channel_by_name(model.name)
        ]
        await self._repo.add_booking_channel(to_be_added)

    async def get_all_booking_channels(self) -> Sequence[BookingChannel]:
        """Gets all BookingChannel models."""
        return await self._repo.get_all_booking_channels()

    async def get_booking_channel_by_name(self, name: str) -> BookingChannel:
        """Gets a single BookingChannel model by name."""
        return await self._repo.get_booking_channel_by_name(name)

    async def get_booking_channel_by_id(
        self, booking_channel_id: UUID
    ) -> BookingChannel:
        """Gets a single BookingChannel model by id."""
        return await self._repo.get_booking_channel_by_id(booking_channel_id)

    async def process_booking_channel_request(
        self, booking_channel_request: PatchBookingChannelRequest
    ) -> dict:
        """Adds or edits booking channel models in the repository."""
        prepared_data_or_error = await self.prepare_booking_channel_data(
            booking_channel_request
        )

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a name conflict
            return {"error": prepared_data_or_error["error"]}

        if prepared_data_or_error:
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_booking_channel(prepared_data_or_error)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid booking channel data provided for processing."}

    async def prepare_booking_channel_data(
        self, booking_channel_request: PatchBookingChannelRequest
    ) -> Union[BookingChannel, dict]:
        """Resolves and prepares a booking channel patch for insertion."""
        # Check if this booking channel exists and needs updating
        existing_booking_channel_by_id = None
        if booking_channel_request.booking_channel_id:
            existing_booking_channel_by_id = await self.get_booking_channel_by_id(
                booking_channel_request.booking_channel_id
            )

        # Check for a name conflict with a different booking channel
        existing_booking_channel_by_name = await self.get_booking_channel_by_name(
            booking_channel_request.name
        )
        if existing_booking_channel_by_name and (
            not existing_booking_channel_by_id
            or existing_booking_channel_by_id.id != existing_booking_channel_by_name.id
        ):
            # Found a name conflict with another booking channel
            return {
                "error": f"A booking channel with the name '{booking_channel_request.name}' already exists."
            }

        if existing_booking_channel_by_id:
            if existing_booking_channel_by_id.name == booking_channel_request.name:
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing booking channel with possibly updated fields
            return BookingChannel(
                id=existing_booking_channel_by_id.id,  # Keep the same ID
                name=booking_channel_request.name,
                updated_by=booking_channel_request.updated_by,
            )
        else:
            # If new, prepare the new booking channel data
            return BookingChannel(
                name=booking_channel_request.name,
                updated_by=booking_channel_request.updated_by,
            )

    async def delete_booking_channel(self, booking_channel_id: UUID):
        """Deletes a BookingChannel."""
        return await self._repo.delete_booking_channel(booking_channel_id)

    # Consultant
    async def add_consultant(self, models: Sequence[Consultant]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if not await self._repo.get_consultant_by_name(
                model.first_name, model.last_name
            )
        ]
        await self._repo.add_consultant(to_be_added)

    async def get_all_consultants(self) -> Sequence[Consultant]:
        """Gets all Consultant models."""
        return await self._repo.get_all_consultants()

    async def get_consultant_by_name(
        self, first_name: str, last_name: str
    ) -> Consultant:
        """Gets a single Consultant model by name."""
        return await self._repo.get_consultant_by_name(first_name, last_name)

    async def get_consultant_by_id(self, consultant_id: UUID) -> Consultant:
        """Gets a single Consultant model by id."""
        return await self._repo.get_consultant_by_id(consultant_id)

    async def process_consultant_request(
        self, consultant_request: PatchConsultantRequest
    ) -> dict:
        """Adds or edits consultant models in the repository."""
        prepared_data_or_error = await self.prepare_consultant_data(consultant_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a name conflict
            return {"error": prepared_data_or_error["error"]}

        if prepared_data_or_error:
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_consultant(prepared_data_or_error)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid consultant data provided for processing."}

    async def prepare_consultant_data(
        self, consultant_request: PatchConsultantRequest
    ) -> Union[Consultant, dict]:
        """Resolves and prepares a consultant patch for insertion."""
        # Check if this consultant exists and needs updating
        existing_consultant_by_id = None
        if consultant_request.consultant_id:
            existing_consultant_by_id = await self.get_consultant_by_id(
                consultant_request.consultant_id
            )

        # Check for a name conflict with a different consultant
        existing_consultant_by_name = await self.get_consultant_by_name(
            consultant_request.first_name,
            consultant_request.last_name,
        )
        if existing_consultant_by_name and (
            not existing_consultant_by_id
            or existing_consultant_by_id.id != existing_consultant_by_name.id
        ):
            # Found a name conflict with another consultant
            return {
                "error": f"A consultant with the name '{consultant_request.last_name}/{consultant_request.first_name}' already exists."
            }

        if existing_consultant_by_id:
            if (
                existing_consultant_by_id.first_name == consultant_request.first_name
                and existing_consultant_by_id.last_name == consultant_request.last_name
                and existing_consultant_by_id.is_active == consultant_request.is_active
            ):
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing booking channel with possibly updated fields
            return Consultant(
                id=existing_consultant_by_id.id,  # Keep the same ID
                first_name=consultant_request.first_name,
                last_name=consultant_request.last_name,
                is_active=consultant_request.is_active,
                updated_by=consultant_request.updated_by,
            )
        else:
            # If new, prepare the new booking channel data
            return Consultant(
                first_name=consultant_request.first_name,
                last_name=consultant_request.last_name,
                is_active=consultant_request.is_active,
                updated_by=consultant_request.updated_by,
            )

    async def delete_consultant(self, consultant_id: UUID):
        """Deletes a Consultant."""
        return await self._repo.delete_consultant(consultant_id)

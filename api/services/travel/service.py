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
from collections import defaultdict
from re import S
from typing import Optional, Sequence, Union, Tuple, Dict, List, Any
from uuid import UUID
from api.services.audit.service import AuditService
from api.services.audit.models import AuditLog
from api.services.summaries.service import SummaryService
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
    PatchCoreDestinationRequest,
    Country,
    PatchCountryRequest,
    PatchTripRequest,
    Portfolio,
    PatchPortfolioRequest,
    Property,
    PatchPropertyRequest,
    PropertyDetail,
    PatchPropertyDetailRequest,
    Trip,
)
from api.services.travel.repository.postgres import PostgresTravelRepository


class TravelService:
    """Service for interfacing with the travel repository."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._repo = PostgresTravelRepository()
        self._audit_svc = AuditService()
        self._summary_svc = SummaryService()

    # AccommodationLog
    async def add_accommodation_log(self, models: Sequence[AccommodationLog]) -> None:
        """Adds accommodation log model to the repository."""
        existing_records = await self._repo.get_all_accommodation_logs()
        existing_combinations = {
            (log.primary_traveler, log.property_id, log.date_in, log.date_out)
            for log in existing_records
        }
        to_be_added = [
            model
            for model in models
            if (
                model.primary_traveler.strip(),
                model.property_id,
                model.date_in,
                model.date_out,
            )
            not in existing_combinations
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

    async def delete_accommodation_log(self, log_id: UUID, user_email: str):
        """Deletes an AccommodationLog."""
        filters = {
            "id": log_id
        }  # Adjust the filters as necessary to match your query requirements
        accommodation_log_summary = (
            await self._summary_svc.get_accommodation_logs_by_filters(filters)
        )
        if not accommodation_log_summary:
            return False
        first_row = accommodation_log_summary[0]
        detail_before_deletion = {
            "id": first_row.id,
            "primary_traveler": first_row.primary_traveler,
            "num_pax": first_row.num_pax,
            "date_in": first_row.date_in,
            "date_out": first_row.date_out,
            "bed_nights": first_row.bed_nights,
            "property_name": first_row.property_name,
            "property_portfolio": first_row.property_portfolio,
            "core_destination_name": first_row.core_destination_name,
            "country_name": first_row.country_name,
            "booking_channel_name": first_row.booking_channel_name,
            "agency_name": first_row.agency_name,
            "consultant_display_name": first_row.consultant_display_name,
            "updated_at": first_row.updated_at,
            "updated_by": first_row.updated_by,
        }
        deleted = await self._repo.delete_accommodation_log(log_id)
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="accommodation_logs",
            record_id=log_id,
            user_name=user_email,
            before_value=detail_before_deletion,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return deleted

    async def get_accommodation_log_by_id(
        self,
        log_id: UUID,
    ) -> Optional[AccommodationLog]:
        """Finds existing accommodation log by its ID."""
        # Assuming log_request has all necessary fields to match an existing log
        logs = await self._repo.get_accommodation_log_by_ids([log_id])
        return logs[0]

    async def process_accommodation_log_requests(
        self, log_requests: Sequence[PatchAccommodationLogRequest]
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        messages = []
        prepared_data = [
            await self.prepare_accommodation_log_data(log_request, messages)
            for log_request in log_requests
        ]
        valid_data = [data for data in prepared_data if data[0] is not None]

        # Proceed only if there is valid data to upsert
        if valid_data:
            valid_logs_to_upsert, accommodation_log_audit_logs, other_audit_logs = zip(
                *valid_data
            )

            # Perform the upsert operation for valid logs
            results = await self._repo.upsert_accommodation_log(valid_logs_to_upsert)
            inserted_count = 0
            updated_count = 0
            for _, was_inserted, error_message in results:
                if error_message:
                    messages.append(error_message)
                else:
                    if was_inserted:
                        inserted_count += 1
                    else:
                        updated_count += 1

            await self.process_audit_logs(
                [log for log in accommodation_log_audit_logs if log is not None]
                + [log for sublist in other_audit_logs for log in sublist]
            )

        else:
            # If there are no valid logs to upsert, ensure variables are initialized to handle this scenario.
            accommodation_log_audit_logs = []
            other_audit_logs = []

        all_audit_logs = [
            log for log in accommodation_log_audit_logs if log is not None
        ] + [log for sublist in other_audit_logs for log in sublist]
        summarized_audit_logs = self.summarize_audit_logs(all_audit_logs)

        return {
            "summarized_audit_logs": summarized_audit_logs,
            "messages": messages,
        }

    async def process_audit_logs(self, audit_logs):
        """Calls audit service to insert audit logs to the database."""
        await self._audit_svc.add_audit_logs(audit_logs)

    def summarize_audit_logs(self, audit_logs: List) -> Dict[str, Any]:
        """Gives an overview of audit logs with counts for updates and inserts."""
        summary = defaultdict(lambda: defaultdict(int))  # Using int to keep counts

        for audit_log in audit_logs:
            category = audit_log.table_name
            action = audit_log.action
            summary[category][action] += 1

        # Convert defaultdict to a regular dict for JSON serialization
        summary_dict = {
            category: dict(actions) for category, actions in summary.items()
        }

        # Optionally, reshape summary_dict here if you need a more tailored structure
        return summary_dict

    async def prepare_accommodation_log_data(
        self, log_request: PatchAccommodationLogRequest, messages: List[str]
    ) -> Tuple[Optional[AccommodationLog], Optional[AuditLog], List[AuditLog]]:
        """Processes an accommodation log add or update request."""
        other_audit_logs = []

        # Resolve entity IDs
        agency_id, agency_audit_log = await self.resolve_agency_id(
            log_request, messages
        )
        booking_channel_id, booking_channel_audit_log = (
            await self.resolve_booking_channel_id(log_request, messages)
        )
        property_id, property_audit_log = await self.resolve_property_id(
            log_request, messages
        )

        if agency_audit_log:
            other_audit_logs.append(agency_audit_log)
        if booking_channel_audit_log:
            other_audit_logs.append(booking_channel_audit_log)
        if property_audit_log:
            other_audit_logs.append(property_audit_log)

        # Additional check for a unique constraint violation
        if log_request.log_id:
            # Check if an update would cause a duplicate record, excluding the current log being updated
            potential_conflict_log = await self.get_accommodation_log(
                log_request.primary_traveler,
                log_request.property_id,
                log_request.date_in,
                log_request.date_out,
            )
            if (
                potential_conflict_log
                and potential_conflict_log.id != log_request.log_id
            ):
                # Construct and append the error message
                error_message = (
                    f"A record for {log_request.primary_traveler} from date {log_request.date_in} to {log_request.date_out} "
                    "already exists. Updating this record would result in a duplicate entry."
                )
                messages.append(error_message)
                return None, None, other_audit_logs

        # If new or if the existing log can be safely updated, proceed with preparing the log data and audit log
        existing_log = None
        if log_request.log_id:
            existing_log = await self.get_accommodation_log_by_id(log_request.log_id)
            differences = {
                k: v
                for k, v in log_request.dict().items()
                if getattr(existing_log, k, None) != v
                and k not in ["updated_at", "updated_by", "log_id", "id"]
            }
            if not differences:
                error_message = "No changes were detected."
                messages.append(error_message)
                return None, None, other_audit_logs

        else:
            existing_log = await self.get_accommodation_log(
                log_request.primary_traveler,
                property_id,
                log_request.date_in,
                log_request.date_out,
            )
        if existing_log:
            updated_log_data = self.prepare_updated_log_data(
                log_request, existing_log, property_id, booking_channel_id, agency_id
            )
            accommodation_log_audit_log = AuditLog(
                table_name="accommodation_logs",
                record_id=existing_log.id,
                user_name=log_request.updated_by,
                before_value=existing_log.dict(),
                after_value=updated_log_data.dict(),
                action="update",
            )
            return updated_log_data, accommodation_log_audit_log, other_audit_logs
        new_log_data = self.prepare_new_log_data(
            log_request, property_id, booking_channel_id, agency_id
        )
        accommodation_log_audit_log = AuditLog(
            table_name="accommodation_logs",
            record_id=new_log_data.id,
            user_name=log_request.updated_by,
            before_value={},
            after_value=new_log_data.dict(),
            action="insert",
        )
        return new_log_data, accommodation_log_audit_log, other_audit_logs

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
        self, log_request: PatchAccommodationLogRequest, messages: List[str]
    ) -> (UUID, Optional[AuditLog]):
        """Gets or creates an agency based on either agency ID or new agency name."""
        audit_log = None
        if log_request.agency_id:
            return log_request.agency_id, audit_log
        if log_request.new_agency_name:
            existing_agency = await self.get_agency_by_name(log_request.new_agency_name)
            if existing_agency:
                print(f"Agency '{log_request.new_agency_name}' already existed.")
                messages.append(
                    f"Agency '{log_request.new_agency_name}' already existed."
                )
                return existing_agency.id, audit_log
            else:
                # Create a new Agency model instance
                new_agency = Agency(
                    name=log_request.new_agency_name, updated_by=log_request.updated_by
                )
                # Pass a list of Agency instances to add_agency
                await self.add_agency([new_agency])
                audit_log = AuditLog(
                    table_name="agencies",
                    record_id=new_agency.id,
                    user_name=log_request.updated_by,
                    before_value={},
                    after_value=new_agency.dict(),
                    action="insert",
                )
                await self.process_audit_logs(audit_log)
                # Fetch the newly created or existing agency by name to get its ID
                agency_created = await self.get_agency_by_name(
                    log_request.new_agency_name
                )
                return agency_created.id, audit_log
        else:
            return None, audit_log

    async def resolve_booking_channel_id(
        self, log_request: PatchAccommodationLogRequest, messages: List[str]
    ) -> (UUID, Optional[AuditLog]):
        """Gets or creates a booking channel based on either ID or new booking channel name."""
        audit_log = None
        if log_request.booking_channel_id:
            return log_request.booking_channel_id, audit_log
        elif log_request.new_booking_channel_name:
            existing_booking_channel = await self.get_booking_channel_by_name(
                log_request.new_booking_channel_name
            )
            if existing_booking_channel:
                print(
                    f"Booking channel '{log_request.new_booking_channel_name}' already existed."
                )
                messages.append(
                    f"Booking channel '{log_request.new_booking_channel_name}' already existed."
                )
                return existing_booking_channel.id, audit_log
            else:
                # Create a new BookingChannel model instance
                new_booking_channel = BookingChannel(
                    name=log_request.new_booking_channel_name,
                    updated_by=log_request.updated_by,
                )
                # Pass a list of BooikingChannel instances to add_booking_channel
                await self.add_booking_channel([new_booking_channel])
                audit_log = AuditLog(
                    table_name="booking_channels",
                    record_id=new_booking_channel.id,
                    user_name=log_request.updated_by,
                    before_value={},
                    after_value=new_booking_channel.dict(),
                    action="insert",
                )
                await self.process_audit_logs(audit_log)
                # Fetch the newly created or existing booking channel by name to get its ID
                booking_channel_created = await self.get_booking_channel_by_name(
                    log_request.new_booking_channel_name
                )
                return booking_channel_created.id, audit_log
        else:
            return None, audit_log

    async def resolve_property_id(
        self, log_request: PatchAccommodationLogRequest, messages: List[str]
    ) -> (UUID, Optional[AuditLog]):
        """Gets or creates a property based on either property ID or new property name."""
        audit_log = None
        if log_request.property_id:
            return log_request.property_id, audit_log

        if (
            not log_request.new_property_core_destination_id
            and log_request.new_property_core_destination_name in ["Ship", "Rail"]
        ):
            core_destination = await self.get_core_destination_by_name(
                log_request.new_property_core_destination_name
            )
            if core_destination:
                log_request.new_property_core_destination_id = core_destination.id
            else:
                messages.append(
                    f"Core destination '{log_request.new_property_core_destination_name}' not found."
                )
                return None, audit_log

        existing_property = await self.get_property_by_name(
            log_request.new_property_name,
            log_request.new_property_portfolio_id,
            log_request.new_property_country_id,
            log_request.new_property_core_destination_id,
        )
        if existing_property:
            print(
                f"Property '{log_request.new_property_name}/{log_request.new_property_portfolio_name}'"
                "already existed."
            )
            messages.append(
                f"Property '{log_request.new_property_name}/{log_request.new_property_portfolio_name}' "
                "already existed."
            )
            return existing_property.id, audit_log
        else:
            # Create a new Property model instance
            new_property = Property(
                name=log_request.new_property_name,
                portfolio_id=log_request.new_property_portfolio_id,
                country_id=log_request.new_property_country_id,
                core_destination_id=log_request.new_property_core_destination_id,
                updated_by=log_request.updated_by,
            )
            # Pass a list of Property instances to add_property
            await self.add_property([new_property])
            audit_log = AuditLog(
                table_name="properties",
                record_id=new_property.id,
                user_name=log_request.updated_by,
                before_value={},
                after_value=new_property.dict(),
                action="insert",
            )
            await self.process_audit_logs(audit_log)
            # Fetch the newly created or existing property by name to get its ID
            property_created = await self.get_property_by_name(
                log_request.new_property_name,
                log_request.new_property_portfolio_id,
                log_request.new_property_country_id,
                log_request.new_property_core_destination_id,
            )
            return property_created.id, audit_log

    # Country
    async def add_country(self, models: Sequence[Country]) -> None:
        """Adds country model to the repository."""
        # Only add countries that don't already exist
        # to_be_added = [
        #     model
        #     for model in models
        #     if not await self._repo.get_country_by_name(model.name)
        # ]
        existing_records = await self._repo.get_all_countries()
        existing_country_names = {country.name for country in existing_records}

        # Only add records that don't already exist
        to_be_added = [
            model
            for model in models
            if model.name.strip() not in existing_country_names
        ]
        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="countries",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
        await self._repo.add_country(to_be_added)

    async def get_all_countries(self) -> Sequence[Country]:
        """Gets all Country models."""
        return await self._repo.get_all_countries()

    async def get_country_by_id(self, country_id: UUID) -> Country:
        """Gets a single Country model by name."""
        return await self._repo.get_country_by_id(country_id)

    async def get_country_by_name(self, name: str) -> Country:
        """Gets a single Country model by name."""
        return await self._repo.get_country_by_name(name)

    async def get_countries_by_name(self, names: Sequence[str]) -> Sequence[Country]:
        """Gets a sequence of Country models by country name."""
        return await self._repo.get_countries_by_name(names)

    async def process_country_request(
        self, country_request: PatchCountryRequest
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        prepared_data_or_error = await self.prepare_country_data(country_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            country_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_country(country_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid country data provided for processing."}

    async def prepare_country_data(
        self, country_request: PatchCountryRequest
    ) -> Union[Dict[str, str], Tuple[Country, AuditLog]]:
        """Resolves and prepares a country patch for insertion."""
        # Check if this country exists and needs updating
        core_destination_id = None

        if country_request.core_destination_id:
            # Fetch country details based on country_id
            core_dest = await self._repo.get_core_destination_by_id(
                country_request.core_destination_id
            )
            if core_dest is None:
                raise ValueError("Invalid core_destination_id")
            # Set core_destination_id based on the country's default
            core_destination_id = core_dest.id

        existing_country_by_id = None
        if country_request.country_id:
            existing_country_by_id = await self.get_country_by_id(
                country_request.country_id
            )

        # Check for a name conflict with a different property
        existing_country_by_name = await self.get_country_by_name(
            country_request.name,
        )
        if existing_country_by_name and (
            not existing_country_by_id
            or existing_country_by_id.id != existing_country_by_name.id
        ):
            # Found a name conflict with another property
            return {"error": f"Property '{country_request.name}' already exists."}

        if existing_country_by_id:
            if (
                existing_country_by_id.name == country_request.name
                and existing_country_by_id.core_destination_id == core_destination_id
            ):
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing property with possibly updated fields
            updated_country = Country(
                id=existing_country_by_id.id,  # Keep the same ID
                name=country_request.name,
                core_destination_id=core_destination_id,
                updated_by=country_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="countries",
                record_id=existing_country_by_id.id,
                user_name=country_request.updated_by,
                before_value=existing_country_by_id.dict(),
                after_value=country_request.dict(),
                action="update",
            )
            return updated_country, audit_log
        else:
            # If new, prepare the new property data
            new_country = Country(
                name=country_request.name,
                core_destination_id=core_destination_id,
                updated_by=country_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="countries",
                record_id=new_country.id,
                user_name=new_country.updated_by,
                before_value={},
                after_value=new_country.dict(),
                action="insert",
            )

            return new_country, audit_log

    async def delete_country(self, country_id: UUID, user_email: str):
        """Deletes a Country."""
        impact_info = await self._summary_svc.get_related_records_summary(
            country_id, "country_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete country due to related records.",
                "details": affected_logs,
            }
        country_summary = await self._summary_svc.get_country_details_by_id(country_id)
        if not country_summary:
            return False
        detail_before_deletion = {
            "id": country_summary.id,
            "name": country_summary.name,
            "core_destination_name": country_summary.core_destination_name,
            "updated_at": country_summary.updated_at,
            "updated_by": country_summary.updated_by,
        }
        deleted = await self._repo.delete_country(country_id)
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="countries",
            record_id=country_id,
            user_name=user_email,
            before_value=detail_before_deletion,
            after_value={},
            action="delete",
        )

        await self.process_audit_logs(audit_log)
        return deleted

    # CoreDestination
    async def add_core_destination(self, models: Sequence[CoreDestination]) -> None:
        """Adds core destination model to the repository."""
        # Only add countries that don't already exist
        # to_be_added = [
        #     model
        #     for model in models
        #     if not await self._repo.get_core_destination_by_name(model.name)
        # ]
        existing_records = await self._repo.get_all_core_destinations()
        existing_dest_names = {dest.name for dest in existing_records}

        # Only add records that don't already exist
        to_be_added = [
            model for model in models if model.name.strip() not in existing_dest_names
        ]
        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="core_destinations",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)

        await self._repo.add_core_destination(to_be_added)

    async def get_all_core_destinations(self) -> Sequence[CoreDestination]:
        """Gets all CoreDestination models."""
        return await self._repo.get_all_core_destinations()

    async def get_core_destination_by_id(
        self, core_destination_id: UUID
    ) -> CoreDestination:
        """Gets a sequence of CoreDestination models by ID"""
        return await self._repo.get_core_destination_by_id(core_destination_id)

    async def get_core_destination_by_name(self, name: str) -> CoreDestination:
        """Gets a sequence of CoreDestination models by core destination name"""
        return await self._repo.get_core_destination_by_name(name)

    async def process_core_destination_request(
        self, core_dest_request: PatchCoreDestinationRequest
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        prepared_data_or_error = await self.prepare_core_dest_data(core_dest_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            core_dest_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_core_destination(core_dest_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid core destination data provided for processing."}

    async def prepare_core_dest_data(
        self, core_dest_request: PatchCoreDestinationRequest
    ) -> Union[Dict[str, str], Tuple[CoreDestination, AuditLog]]:
        """Resolves and prepares a core destination patch for insertion."""

        existing_core_dest_by_id = None
        if core_dest_request.core_destination_id:
            existing_core_dest_by_id = await self.get_core_destination_by_id(
                core_dest_request.core_destination_id
            )

        # Check for a name conflict with a different core destination
        existing_core_dest_by_name = await self.get_core_destination_by_name(
            core_dest_request.name,
        )

        if existing_core_dest_by_name and (
            not existing_core_dest_by_id
            or existing_core_dest_by_id.id != existing_core_dest_by_name.id
        ):
            # Found a name conflict with another core destination
            return {
                "error": f"Core Destination '{core_dest_request.name}' already exists."
            }

        if existing_core_dest_by_id:
            if existing_core_dest_by_id.name == core_dest_request.name:
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing property with possibly updated fields
            updated_core_dest = CoreDestination(
                id=existing_core_dest_by_id.id,  # Keep the same ID
                name=core_dest_request.name,
                updated_by=core_dest_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="core_destinations",
                record_id=existing_core_dest_by_id.id,
                user_name=core_dest_request.updated_by,
                before_value=existing_core_dest_by_id.dict(),
                after_value=core_dest_request.dict(),
                action="update",
            )
            return updated_core_dest, audit_log
        else:
            # If new, prepare the new property data
            new_core_dest = CoreDestination(
                name=core_dest_request.name,
                updated_by=core_dest_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="core_destinations",
                record_id=new_core_dest.id,
                user_name=new_core_dest.updated_by,
                before_value={},
                after_value=new_core_dest.dict(),
                action="insert",
            )

            return new_core_dest, audit_log

    # Property
    async def add_property(self, models: Sequence[Property]) -> None:
        """Adds Property models to the repository."""
        # Only add records that don't already exist
        # to_be_added = [
        #     model
        #     for model in models
        #     if not await self._repo.get_property_by_name(
        #         model.name,
        #         model.portfolio_id,
        #         model.country_id,
        #         model.core_destination_id,
        #     )
        # ]
        existing_records = await self._repo.get_all_properties()
        existing_combinations = {
            (prop.name, prop.portfolio_id, prop.country_id, prop.core_destination_id)
            for prop in existing_records
        }
        to_be_added = [
            model
            for model in models
            if (
                model.name.strip(),
                model.portfolio_id,
                model.country_id,
                model.core_destination_id,
            )
            not in existing_combinations
        ]

        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="properties",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
        await self._repo.add_property(to_be_added)

    async def get_all_properties(self) -> Sequence[Property]:
        """Gets all Property models."""
        return await self._repo.get_all_properties()

    async def process_property_request(
        self, property_request: PatchPropertyRequest
    ) -> dict:
        """Adds or edits accommodation log models in the repository."""
        prepared_data_or_error = await self.prepare_property_data(property_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            property_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_property(property_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid property data provided for processing."}

    async def prepare_property_data(
        self, property_request: PatchPropertyRequest
    ) -> Union[Dict[str, str], Tuple[Property, AuditLog]]:
        """Resolves and prepares a property patch for insertion."""
        # Check if this property exists and needs updating
        core_destination_id = None

        if property_request.country_id:
            # Fetch country details based on country_id
            country = await self._repo.get_country_by_id(property_request.country_id)
            if country is None:
                raise ValueError("Invalid country_id")
            # Set core_destination_id based on the country's default
            core_destination_id = country.core_destination_id

        # Override the core_destination_id if it's explicitly provided in the request (ship/rail)
        if property_request.core_destination_id:
            core_destination_id = property_request.core_destination_id

        # Validate that core_destination_id is set either by country default or manual input
        if not core_destination_id:
            raise ValueError(
                "core_destination_id is required when country_id is not provided"
            )

        existing_property_by_id = None
        if property_request.property_id:
            existing_property_by_id = await self.get_property_by_id(
                property_request.property_id
            )

        # Check for a name conflict with a different property
        existing_property_by_name = await self.get_property_by_name(
            property_request.name,
            property_request.portfolio_id,
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
                and existing_property_by_id.portfolio_id
                == property_request.portfolio_id
                and existing_property_by_id.country_id == property_request.country_id
                and existing_property_by_id.core_destination_id == core_destination_id
                and existing_property_by_id.latitude == property_request.latitude
                and existing_property_by_id.longitude == property_request.longitude
                and existing_property_by_id.location == property_request.location
                and existing_property_by_id.property_type
                == property_request.property_type
            ):
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing property with possibly updated fields
            updated_property = Property(
                id=existing_property_by_id.id,  # Keep the same ID
                name=property_request.name,
                portfolio_id=property_request.portfolio_id,
                country_id=property_request.country_id,
                core_destination_id=core_destination_id,
                latitude=property_request.latitude,
                longitude=property_request.longitude,
                location=property_request.location,
                property_type=property_request.property_type,
                updated_by=property_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="properties",
                record_id=existing_property_by_id.id,
                user_name=updated_property.updated_by,
                before_value=existing_property_by_id.dict(),
                after_value=updated_property.dict(),
                action="update",
            )
            return updated_property, audit_log
        else:
            # If new, prepare the new property data
            new_property = Property(
                name=property_request.name,
                portfolio_id=property_request.portfolio_id,
                country_id=property_request.country_id,
                core_destination_id=core_destination_id,
                latitude=property_request.latitude,
                longitude=property_request.longitude,
                location=property_request.location,
                property_type=property_request.property_type,
                updated_by=property_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="properties",
                record_id=new_property.id,
                user_name=new_property.updated_by,
                before_value={},
                after_value=new_property.dict(),
                action="insert",
            )

            return new_property, audit_log

    async def get_property_by_name(
        self,
        name: str,
        portfolio_id: UUID,
        country_id: Optional[str],
        core_destination_id: Optional[str],
    ) -> Property:
        """Gets a single Property model by name, portfolio, country, core_destination."""
        return await self._repo.get_property_by_name(
            name, portfolio_id, country_id, core_destination_id
        )

    async def get_property_by_id(self, property_id: UUID) -> Property:
        """Gets a single Property model by id."""
        return await self._repo.get_property_by_id(property_id)

    async def delete_property(
        self, property_id: UUID, user_email: str
    ) -> Union[bool, dict]:
        """Deletes a Property or returns reason that it is unable to delete."""
        impact_info = await self._summary_svc.get_related_records_summary(
            property_id, "property_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete property due to related records.",
                "details": affected_logs,
            }
        property_summary = await self._summary_svc.get_property_details_by_id(
            property_id
        )
        if not property_summary:
            return False
        detail_before_deletion = {
            "id": property_summary.property_id,
            "name": property_summary.name,
            "core_destination_name": property_summary.core_destination_name,
            "country_name": property_summary.country_name,
            "updated_at": property_summary.updated_at,
            "updated_by": property_summary.updated_by,
        }
        deleted = await self._repo.delete_property(property_id)  # returns bool
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="properties",
            record_id=property_id,
            user_name=user_email,
            before_value=detail_before_deletion,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return deleted

    # PropertyDetail
    async def get_property_detail_by_id(self, property_id: UUID) -> PropertyDetail:
        """Gets a single PropertyDetail model by id."""
        return await self._repo.get_property_detail_by_id(property_id)

    async def process_property_detail_request(
        self, property_detail_request: PatchPropertyDetailRequest
    ) -> dict:
        """Adds or edits property detail models in the repository."""
        prepared_data_or_error = await self.prepare_property_detail_data(
            property_detail_request
        )

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            property_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_property_detail(property_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid property detail data provided for processing."}

    async def prepare_property_detail_data(
        self, property_detail_request: PatchPropertyDetailRequest
    ) -> Union[Dict[str, str], Tuple[PropertyDetail, AuditLog]]:
        """Resolves and prepares a property detail patch for insertion or update."""
        existing_property_detail_by_id = None
        if property_detail_request.property_id:
            existing_property_detail_by_id = await self.get_property_detail_by_id(
                property_detail_request.property_id
            )

        if existing_property_detail_by_id:
            existing_data_dict = existing_property_detail_by_id.dict()
            request_data_dict = property_detail_request.dict(exclude_unset=True)

            # Find differences between existing data and new request, excluding 'property_id'
            differences = {
                k: v
                for k, v in request_data_dict.items()
                if existing_data_dict.get(k) != v and k != "property_id"
            }

            if not differences:
                return {"error": "No changes were detected."}

            # Update the existing record with differences
            for field, value in differences.items():
                setattr(existing_property_detail_by_id, field, value)

            updated_property_detail = (
                existing_property_detail_by_id  # Assuming this is the updated record
            )

            # Log changes
            audit_log = AuditLog(
                table_name="property_details",
                record_id=existing_property_detail_by_id.property_id,
                user_name=updated_property_detail.updated_by,
                before_value=existing_data_dict,
                after_value=updated_property_detail.dict(),
                action="update",
            )

            return updated_property_detail, audit_log

        else:
            # Exclude 'property_id' as it's used for lookup and shouldn't be part of the insert dict
            new_property_detail_data = property_detail_request.dict()
            new_property_detail = PropertyDetail(**new_property_detail_data)

            audit_log = AuditLog(
                table_name="property_details",
                record_id=new_property_detail.property_id,
                user_name=new_property_detail.updated_by,
                before_value={},
                after_value=new_property_detail.dict(),
                action="insert",
            )

            return new_property_detail, audit_log

    # Agency
    async def add_agency(self, models: Sequence[Agency]) -> None:
        """Adds Agency models to the repository."""
        # Only add records that don't already exist
        existing_records = await self._repo.get_all_agencies()
        existing_agency_names = {agency.name for agency in existing_records}

        # Only add records that don't already exist
        to_be_added = [
            model for model in models if model.name.strip() not in existing_agency_names
        ]
        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="agencies",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
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
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            agency_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_agency(agency_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid agency data provided for processing."}

    async def prepare_agency_data(
        self, agency_request: PatchAgencyRequest
    ) -> Union[Dict[str, str], Tuple[Agency, AuditLog]]:
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
            updated_agency = Agency(
                id=existing_agency_by_id.id,  # Keep the same ID
                name=agency_request.name,
                updated_by=agency_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="agencies",
                record_id=existing_agency_by_id.id,
                user_name=updated_agency.updated_by,
                before_value=existing_agency_by_id.dict(),
                after_value=updated_agency.dict(),
                action="update",
            )
            return updated_agency, audit_log
        else:
            # If new, prepare the new agency data
            new_agency = Agency(
                name=agency_request.name,
                updated_by=agency_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="agencies",
                record_id=new_agency.id,
                user_name=new_agency.updated_by,
                before_value={},
                after_value=new_agency.dict(),
                action="insert",
            )
            return new_agency, audit_log

    async def delete_agency(self, agency_id: UUID, user_email: str):
        """Deletes an Agency."""
        impact_info = await self._summary_svc.get_related_records_summary(
            agency_id, "agency_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete agency due to related records.",
                "details": affected_logs,
            }
        deleted = await self._repo.delete_agency(agency_id)
        if not deleted:
            # Handle as needed if no record was found or deleted
            return False
        audit_log = AuditLog(
            table_name="agencies",
            record_id=agency_id,
            user_name=user_email,
            before_value=deleted,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return True

    # BookingChannel
    async def add_booking_channel(self, models: Sequence[BookingChannel]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        existing_records = await self._repo.get_all_booking_channels()
        existing_bc_names = {bc.name for bc in existing_records}

        # Only add records that don't already exist
        to_be_added = [
            model for model in models if model.name.strip() not in existing_bc_names
        ]
        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="agencies",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
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
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            booking_channel_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_booking_channel(booking_channel_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid booking channel data provided for processing."}

    async def prepare_booking_channel_data(
        self, booking_channel_request: PatchBookingChannelRequest
    ) -> Union[Dict[str, str], Tuple[BookingChannel, AuditLog]]:
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
            updated_booking_channel = BookingChannel(
                id=existing_booking_channel_by_id.id,  # Keep the same ID
                name=booking_channel_request.name,
                updated_by=booking_channel_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="booking_channels",
                record_id=existing_booking_channel_by_id.id,
                user_name=updated_booking_channel.updated_by,
                before_value=existing_booking_channel_by_id.dict(),
                after_value=updated_booking_channel.dict(),
                action="update",
            )
            return updated_booking_channel, audit_log
        else:
            # If new, prepare the new booking channel data
            new_booking_channel = BookingChannel(
                name=booking_channel_request.name,
                updated_by=booking_channel_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="booking_channels",
                record_id=new_booking_channel.id,
                user_name=new_booking_channel.updated_by,
                before_value={},
                after_value=new_booking_channel.dict(),
                action="insert",
            )
            return new_booking_channel, audit_log

    async def delete_booking_channel(self, booking_channel_id: UUID, user_email: str):
        """Deletes a BookingChannel."""
        impact_info = await self._summary_svc.get_related_records_summary(
            booking_channel_id, "booking_channel_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete booking channel due to related records.",
                "details": affected_logs,
            }
        deleted = await self._repo.delete_booking_channel(booking_channel_id)
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="booking_channels",
            record_id=booking_channel_id,
            user_name=user_email,
            before_value=deleted,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return True

    # Portfolio
    async def add_portfolio(self, models: Sequence[Portfolio]) -> None:
        """Adds Portfolio models to the repository."""
        # Only add records that don't already exist
        existing_portfolios = await self._repo.get_all_portfolios()
        existing_portfolio_names = {portfolio.name for portfolio in existing_portfolios}

        # Only add records that don't already exist
        to_be_added = [
            model for model in models if model.name not in existing_portfolio_names
        ]

        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="portfolios",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
        await self._repo.add_portfolio(to_be_added)

    async def process_portfolio_request(
        self, portfolio_request: PatchPortfolioRequest
    ) -> dict:
        """Adds or edits portfolio models in the repository."""
        prepared_data_or_error = await self.prepare_portfolio_data(portfolio_request)

        if (
            isinstance(prepared_data_or_error, dict)
            and "error" in prepared_data_or_error
        ):
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            portfolio_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_portfolio(portfolio_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid portfolio data provided for processing."}

    async def prepare_portfolio_data(
        self, portfolio_request: PatchPortfolioRequest
    ) -> Union[Dict[str, str], Tuple[Agency, AuditLog]]:
        """Resolves and prepares a portfolio patch for insertion or update."""
        # Check if this portfolio exists and needs updating
        existing_portfolio_by_id = None
        if portfolio_request.portfolio_id:
            existing_portfolio_by_id = await self.get_portfolio_by_id(
                portfolio_request.portfolio_id
            )

        # Check for a name conflict with a different portfolio
        existing_portfolio_by_name = await self.get_portfolio_by_name(
            portfolio_request.name
        )
        if existing_portfolio_by_name and (
            not existing_portfolio_by_id
            or existing_portfolio_by_id.id != existing_portfolio_by_name.id
        ):
            # Found a name conflict with another portfolio
            return {
                "error": f"A portfolio with the name '{portfolio_request.name}' already exists."
            }

        if existing_portfolio_by_id:
            if existing_portfolio_by_id.name == portfolio_request.name:
                # No changes detected, return a message indicating so
                return {"error": "No changes were detected."}
            # If updating, return the existing portfolio with possibly updated fields
            updated_portfolio = Agency(
                id=existing_portfolio_by_id.id,  # Keep the same ID
                name=portfolio_request.name,
                updated_by=portfolio_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="portfolios",
                record_id=existing_portfolio_by_id.id,
                user_name=updated_portfolio.updated_by,
                before_value=existing_portfolio_by_id.dict(),
                after_value=updated_portfolio.dict(),
                action="update",
            )
            return updated_portfolio, audit_log
        else:
            # If new, prepare the new agency data
            new_portfolio = Agency(
                name=portfolio_request.name,
                updated_by=portfolio_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="portfolios",
                record_id=new_portfolio.id,
                user_name=new_portfolio.updated_by,
                before_value={},
                after_value=new_portfolio.dict(),
                action="insert",
            )
            return new_portfolio, audit_log

    async def get_portfolio_by_name(self, name: str) -> Portfolio:
        """Gets a single Portfolio model by name."""
        return await self._repo.get_portfolio_by_name(name)

    async def get_portfolio_by_id(self, portfolio_id: UUID) -> Portfolio:
        """Gets a single Portfolio model by name."""
        return await self._repo.get_portfolio_by_id(portfolio_id)

    async def get_all_portfolios(self) -> Sequence[Portfolio]:
        """Gets all Agency models."""
        return await self._repo.get_all_portfolios()

    async def delete_portfolio(self, portfolio_id: UUID, user_email: str):
        """Deletes a Portfolio."""
        impact_info = await self._summary_svc.get_related_records_summary(
            portfolio_id, "portfolio_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete portfolio due to related records.",
                "details": affected_logs,
            }
        deleted = await self._repo.delete_portfolio(portfolio_id)
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="portfolios",
            record_id=portfolio_id,
            user_name=user_email,
            before_value=deleted,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return True

    # Consultant
    async def add_consultant(self, models: Sequence[Consultant]) -> None:
        """Adds BookingChannel models to the repository."""
        # Only add records that don't already exist
        # old code - matches on first_name and last_name
        # to_be_added = [
        #     model
        #     for model in models
        #     if not await self._repo.get_consultant_by_name(
        #         model.first_name, model.last_name
        #     )
        # ]
        existing_records = await self._repo.get_all_consultants()
        # Create a set of tuples for existing first_name and last_name combinations
        existing_combinations = {
            (cons.first_name, cons.last_name) for cons in existing_records
        }

        # Only add records that don't already exist based on both first_name and last_name
        to_be_added = [
            model
            for model in models
            if (model.first_name, model.last_name) not in existing_combinations
        ]

        if to_be_added:
            await self._repo.add_consultant(to_be_added)
        # audit_logs = []
        # for model in to_be_added:
        #     audit_logs.append(
        #         AuditLog(
        #             table_name="consultants",
        #             record_id=model.id,
        #             user_name=model.updated_by,
        #             before_value={},
        #             after_value=model.dict(),
        #             action="insert",
        #         )
        #     )
        # await self.process_audit_logs(audit_logs)
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
            # Return the error message directly if there was a conflict or issue
            return {"error": prepared_data_or_error["error"]}

        # Check if the prepared data is a tuple containing property data and an audit log
        if isinstance(prepared_data_or_error, tuple):
            consultant_data, audit_logs = prepared_data_or_error
            inserted_count = 0
            updated_count = 0
            results = await self._repo.upsert_consultant(consultant_data)
            for _, was_inserted in results:
                if was_inserted:
                    inserted_count += 1
                else:
                    updated_count += 1

            # Process the audit logs
            await self.process_audit_logs(audit_logs)

            # Prepare the response based on the operation performed
            return {"inserted_count": inserted_count, "updated_count": updated_count}

        # If no data was prepared for insertion or update
        return {"error": "No valid consultant data provided for processing."}

    async def prepare_consultant_data(
        self, consultant_request: PatchConsultantRequest
    ) -> Union[Dict[str, str], Tuple[Consultant, AuditLog]]:
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
            updated_consultant = Consultant(
                id=existing_consultant_by_id.id,  # Keep the same ID
                first_name=consultant_request.first_name,
                last_name=consultant_request.last_name,
                is_active=consultant_request.is_active,
                updated_by=consultant_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="consultants",
                record_id=existing_consultant_by_id.id,
                user_name=updated_consultant.updated_by,
                before_value=existing_consultant_by_id.dict(),
                after_value=updated_consultant.dict(),
                action="update",
            )
            return updated_consultant, audit_log
        else:
            # If new, prepare the new booking channel data
            new_consultant = Consultant(
                first_name=consultant_request.first_name,
                last_name=consultant_request.last_name,
                is_active=consultant_request.is_active,
                updated_by=consultant_request.updated_by,
            )
            audit_log = AuditLog(
                table_name="consultants",
                record_id=new_consultant.id,
                user_name=new_consultant.updated_by,
                before_value={},
                after_value=new_consultant.dict(),
                action="insert",
            )
            return new_consultant, audit_log

    async def delete_consultant(self, consultant_id: UUID, user_email: str):
        """Deletes a Consultant."""
        impact_info = await self._summary_svc.get_related_records_summary(
            consultant_id, "consultant_id"
        )
        if not impact_info["can_modify"]:
            affected_logs = impact_info["affected_logs"]
            return {
                "error": "Cannot delete consultant due to related records.",
                "details": affected_logs,
            }
        deleted = await self._repo.delete_consultant(consultant_id)
        if not deleted:
            # Handle as needed if no record was found or deleted
            return False
        audit_log = AuditLog(
            table_name="consultants",
            record_id=consultant_id,
            user_name=user_email,
            before_value=deleted,
            after_value={},
            action="delete",
        )

        await self.process_audit_logs(audit_log)
        return True

    async def add_trip(self, trip_request: PatchTripRequest) -> UUID:
        """Adds Trip models to the repository."""
        new_trip = Trip(
            trip_name=trip_request.trip_name, updated_by=trip_request.updated_by
        )
        await self._repo.add_trip([new_trip])

        audit_log = AuditLog(
            table_name="trips",
            record_id=new_trip.id,
            user_name=new_trip.updated_by,
            # If the trip already existed, put the before value here
            before_value={},
            after_value=new_trip.dict(),
            action="insert",
        )
        await self._audit_svc.add_audit_logs(audit_log)

        return new_trip.id

    async def delete_trip(self, trip_id: UUID, user_email: str):
        """Adds Trip models to the repository."""
        trip_summary = await self._summary_svc.get_trip_summary_by_id(trip_id)
        detail_before_deletion = {
            "id": trip_summary.id,
            "name": trip_summary.trip_name,
            "primary_travelers": trip_summary.primary_travelers,
            "core_destination": trip_summary.core_destination,
            "updated_at": trip_summary.updated_at,
            "updated_by": trip_summary.updated_by,
        }
        accommodation_log_ids = [log.id for log in trip_summary.accommodation_logs]

        await self.update_trip_id(
            log_ids=accommodation_log_ids, trip_id=None, updated_by=user_email
        )
        deleted = await self._repo.delete_trip(trip_id)  # returns bool
        if not deleted:
            return False
        audit_log = AuditLog(
            table_name="trips",
            record_id=trip_id,
            user_name=user_email,
            before_value=detail_before_deletion,
            after_value={},
            action="delete",
        )
        await self.process_audit_logs(audit_log)
        return deleted

    async def update_trip_id(
        self, log_ids: Sequence[UUID], trip_id: UUID | None, updated_by: str
    ) -> None:
        """Updates trip_id of a sequence of accommodation logs."""
        try:
            # Retrieve current state for audit logging
            current_logs = await self._repo.get_accommodation_log_by_ids(log_ids)
            updated_at = datetime.datetime.now()

            # Update accommodation logs with new trip_id and updated_by
            await self._repo.update_trip_ids(log_ids, trip_id, updated_by, updated_at)

            # Prepare audit logs with the old and new values
            audit_logs = [
                AuditLog(
                    table_name="accommodation_logs",
                    record_id=log.id,
                    user_name=updated_by,
                    before_value=log.dict(),
                    after_value={
                        **log.dict(),
                        "trip_id": str(trip_id),
                        "updated_by": updated_by,
                        "updated_at": updated_at,
                    },
                    action="update",
                )
                for log in current_logs
            ]

            # Record the audit logs
            await self._audit_svc.add_audit_logs(audit_logs)

        except Exception as e:
            # Optionally, handle specific exceptions and log errors
            raise Exception(f"Error updating trip IDs for logs: {str(e)}")

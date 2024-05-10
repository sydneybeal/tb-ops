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
from asyncio import gather
from datetime import datetime, timedelta, date
from collections import defaultdict
from typing import Optional, Sequence, Union, Tuple, Dict, List, Any, cast
from uuid import UUID
import time
from api.services.audit.service import AuditService
from api.services.audit.models import AuditLog
from api.services.summaries.models import AccommodationLogSummary, BaseTrip, TripSummary
from api.services.summaries.service import SummaryService
from api.services.travel.service import TravelService
from api.services.travel.models import AccommodationLog, Trip, PatchTripRequest
from api.services.quality.models import (
    PotentialTrip,
    MatchingProgress,
    ProgressBreakdown,
    FlaggedTrip,
)
from api.services.quality.repository.postgres import PostgresQualityRepository


class QualityService:
    """Service for interfacing with the data quality of travel entries."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._summary_svc = SummaryService()
        self._travel_svc = TravelService()
        self._audit_svc = AuditService()
        self._repo = PostgresQualityRepository()

    async def find_potential_trips(self) -> List[PotentialTrip]:
        """Finds unmatched entries and groups them into trips."""
        flagged_trips = await self._repo.get_flagged_trips()
        flagged_log_ids = {
            log_id for trip in flagged_trips for log_id in trip.accommodation_log_ids
        }

        start_time = time.time()
        unmatched = await self._repo.get_unmatched_accommodation_logs(
            exclude_ids=flagged_log_ids
        )
        print(
            f"got unmatched accommodation logs in {float(time.time() - start_time)} seconds"
        )

        potential_trips = await gather(
            *(self.get_trip_with_logs(row) for row in flagged_trips)
        )

        # Sort logs by primary traveler and date_in in descending order
        sorted_unmatched = sorted(
            unmatched,
            key=lambda x: (x.primary_traveler.lower().strip(), x.date_in.toordinal()),
        )

        # Initialize a dictionary to keep track of the last log per traveler for easy reference
        last_log_per_traveler = {}

        for log in sorted_unmatched:
            should_append = False

            # Check if this log can continue a trip from the same traveler
            if log.primary_traveler.lower().strip() in last_log_per_traveler:
                last_log = last_log_per_traveler[log.primary_traveler.lower().strip()]
                # Allow a gap of up to 3 days; consider large gaps as a new trip
                if last_log.date_out + timedelta(days=3) >= log.date_in:
                    should_append = True

            if should_append:
                # Find the right trip to append this log, ensure the dates are close enough
                for trip in reversed(
                    potential_trips
                ):  # Reverse to optimize search, likely near the end
                    if (
                        trip.accommodation_logs[-1].primary_traveler.lower().strip()
                        == log.primary_traveler.lower().strip()
                        and trip.accommodation_logs[-1].date_out + timedelta(days=3)
                        >= log.date_in
                    ):
                        trip.accommodation_logs.append(log)
                        break
            else:
                # Start a new potential trip and set the trip name based on the log's details
                potential_trips.append(PotentialTrip(accommodation_logs=[log]))

            # Update the last log for this traveler, or set it if it's the first log we're seeing for this traveler
            last_log_per_traveler[log.primary_traveler.lower().strip()] = log

        return potential_trips

    async def get_trip_with_logs(self, row):
        # Fetch log summaries asynchronously and flatten the results
        nested_log_summaries = await gather(
            *(
                self._summary_svc.get_accommodation_logs_by_filters({"id": log_id})
                for log_id in row.accommodation_log_ids
            )
        )

        # Flatten the nested list of log summaries
        log_summaries = [item for sublist in nested_log_summaries for item in sublist]

        trip = PotentialTrip(
            id=row.id,
            accommodation_logs=log_summaries,
            review_status=row.review_status,
            review_notes=row.review_notes,
            reviewed_at=row.reviewed_at,
            reviewed_by=row.reviewed_by,
            created_at=row.created_at,
            updated_at=row.updated_at,
            updated_by=row.updated_by,
        )
        trip.trip_name = row.trip_name
        return trip

    async def confirm_trip(self, trip_request: PatchTripRequest) -> dict:
        """Confirms a trip and handles the repository updates."""
        trip_id = await self._travel_svc.add_trip(trip_request)

        await self._travel_svc.update_trip_id(
            trip_request.accommodation_log_ids,
            trip_id,
            trip_request.updated_by,
        )

        await self._repo.delete_related_potential_trips(
            trip_request.accommodation_log_ids
        )

        # create an audit log for the trip data
        audit_log = AuditLog(
            table_name="trips",
            record_id=trip_id,
            user_name=trip_request.updated_by,
            # If the trip already existed, put the before value here
            before_value={},
            after_value=trip_request.dict(),
            action="update",
        )
        await self._audit_svc.add_audit_logs(audit_log)

        # Prepare the response based on the operation performed
        return {"inserted_count": 1, "updated_count": 0}

    async def flag_trip(self, trip_request: PatchTripRequest) -> dict:
        await self.add_potential_trip(trip_request)
        return {"inserted_count": 1, "updated_count": 0}

    async def add_potential_trip(self, trip_request: PatchTripRequest) -> UUID:
        """Adds Trip models to the repository."""
        new_trip = FlaggedTrip(
            trip_name=trip_request.trip_name,
            accommodation_log_ids=trip_request.accommodation_log_ids,
            reviewed_by=trip_request.reviewed_by,
            review_notes=trip_request.review_notes,
            updated_by=trip_request.updated_by,
        )
        await self._repo.add_flagged_trip(new_trip)

        audit_log = AuditLog(
            table_name="potential_trips",
            record_id=new_trip.id,
            user_name=new_trip.updated_by,
            # If the trip already existed, put the before value here
            before_value={},
            after_value=new_trip.dict(),
            action="insert",
        )
        await self._audit_svc.add_audit_logs(audit_log)

        return new_trip.id

    async def get_related_trips(
        self, starting_trip: BaseTrip
    ) -> List[Union[PotentialTrip, TripSummary]]:
        """Finds either confirmed or potential trips that are related to a given trip."""
        potential_trips = await self.find_potential_trips()
        confirmed_trips = await self._summary_svc.get_all_trips()

        # Cast each list to List[BaseTrip] before concatenation
        all_trips = cast(List[BaseTrip], potential_trips) + cast(
            List[BaseTrip], confirmed_trips
        )

        related_trips = []

        for trip in all_trips:
            if self.are_trips_equivalent(trip, starting_trip):
                continue  # Skip comparing the trip to itself

            # Criteria 1: Similar by accommodation
            if self.similar_by_accommodation(starting_trip, trip):
                related_trips.append(trip)
            # Criteria 2: Similar by core destination but potentially misdated entries
            else:
                date_diff = self.calculate_date_difference(
                    starting_trip.start_date, trip.start_date
                )
                # Criteria 2: Similar by core destination but potentially misdated entries
                if self.similar_by_chance(starting_trip, trip):
                    print("Found a stray record that might be connected to a trip.")
                    related_trips.append(trip)

        return related_trips

    def are_trips_equivalent(self, trip1: BaseTrip, trip2: BaseTrip) -> bool:
        """
        Determines if two trips are equivalent based on a set of attributes.
        """
        if trip1.id and trip2.id and trip1.id == trip2.id:
            return True

        # Normalize primary_travelers lists by stripping spaces and converting to lowercase
        normalized_travelers1 = {
            traveler.lower().strip() for traveler in (trip1.primary_travelers or [])
        }
        normalized_travelers2 = {
            traveler.lower().strip() for traveler in (trip2.primary_travelers or [])
        }

        if (
            trip1.start_date == trip2.start_date
            and trip1.end_date == trip2.end_date
            and normalized_travelers1 == normalized_travelers2
            and trip1.core_destination == trip2.core_destination
        ):
            return True
        return False

    def calculate_date_difference(
        self, start_date1: Optional[date], start_date2: Optional[date]
    ) -> Optional[int]:
        """
        Calculates the absolute difference in days between two dates.
        Returns None if either date is None.
        """
        if start_date1 is None or start_date2 is None:
            return None  # Or handle it some other way, depending on your application's needs

        return abs((start_date1 - start_date2).days)

    def similar_by_accommodation(
        self, trip1: BaseTrip, trip2: BaseTrip, threshold=0.7
    ) -> bool:
        """
        Determine if two trips share a significant amount of nights at the same accommodations.
        """
        accommodations1 = {
            (log.date_in, log.date_out, log.property_name): (
                log.date_out - log.date_in
            ).days
            for log in trip1.accommodation_logs
        }
        accommodations2 = {
            (log.date_in, log.date_out, log.property_name): (
                log.date_out - log.date_in
            ).days
            for log in trip2.accommodation_logs
        }

        total_nights = sum(accommodations1.values())
        matched_nights = 0

        for key, nights2 in accommodations2.items():
            if key in accommodations1:
                nights1 = accommodations1[key]
                overlapping_nights = min(nights1, nights2)
                matched_nights += overlapping_nights

        similarity_ratio = matched_nights / total_nights if total_nights > 0 else 0

        return similarity_ratio >= threshold

    # def similar_by_accommodation(
    #     self, trip1: BaseTrip, trip2: BaseTrip, threshold=0.7
    # ) -> bool:
    #     """
    #     Determine if two trips share a significant amount of nights at the same accommodations,
    #     with a more nuanced consideration of the total length of both trips.
    #     """
    #     accommodations1 = {
    #         (log.date_in, log.date_out, log.property_name): (
    #             log.date_out - log.date_in
    #         ).days
    #         for log in trip1.accommodation_logs
    #     }
    #     accommodations2 = {
    #         (log.date_in, log.date_out, log.property_name): (
    #             log.date_out - log.date_in
    #         ).days
    #         for log in trip2.accommodation_logs
    #     }

    #     total_nights1 = sum(accommodations1.values())
    #     total_nights2 = sum(accommodations2.values())
    #     matched_nights = 0

    #     # Calculate the matched nights based on exact match of accommodation logs
    #     for key, nights1 in accommodations1.items():
    #         if key in accommodations2:
    #             nights2 = accommodations2[key]
    #             overlapping_nights = min(nights1, nights2)
    #             matched_nights += overlapping_nights

    #     # Calculate similarity ratio as the fraction of total nights overlapped to average trip length
    #     average_total_nights = (total_nights1 + total_nights2) / 2
    #     similarity_ratio = (
    #         matched_nights / average_total_nights if average_total_nights > 0 else 0
    #     )

    #     # Optionally, ensure that the overlap is not just a single night if both trips are longer
    #     if matched_nights == 1 and (total_nights1 > 1 or total_nights2 > 1):
    #         return False

    #     return similarity_ratio >= threshold

    def similar_by_chance(self, trip1: BaseTrip, trip2: BaseTrip) -> bool:
        """
        Check if two trips could be by chance related, such as 1-2 properties of the trip
        entered with significantly different dates. Two trips are considered 'by chance' related if:
        - They share at least one primary traveler.
        - They are to the same core destination.
        - At least one of the trips has less than 2 logs, suggesting possible data entry errors.
        - The start or end date of one trip is within a certain threshold of the other trip's start or end date.
        """
        travelers1 = {
            traveler.lower().strip() for traveler in (trip1.primary_travelers or [])
        }
        travelers2 = {
            traveler.lower().strip() for traveler in (trip2.primary_travelers or [])
        }

        # Check if the primary travelers intersect
        if travelers1.intersection(travelers2):
            # Check if core destinations are the same
            if trip1.core_destination == trip2.core_destination:
                # Check if either trip has less than 2 logs
                if trip1.number_of_logs < 2 or trip2.number_of_logs < 2:
                    return True

                # Check if the start or end date of one trip is within a certain threshold of the other trip's start or end date
                start_date_diff = abs((trip1.start_date - trip2.start_date).days)
                end_date_diff = abs((trip1.end_date - trip2.end_date).days)
                threshold = timedelta(days=1)  # Adjust this threshold as needed

                if start_date_diff <= threshold.days or end_date_diff <= threshold.days:
                    return True

        return False

    async def get_progress(self) -> MatchingProgress:
        potential_trips = await self.find_potential_trips()
        confirmed_trips = await self._summary_svc.get_all_trips()

        year_data = defaultdict(lambda: {"confirmed": 0, "potential": 0})
        destination_data = defaultdict(lambda: {"confirmed": 0, "potential": 0})
        for trip in potential_trips:
            year = self.categorize_year(trip.start_date.year)
            destination = self.categorize_destination(trip.core_destination)
            year_data[year]["potential"] += 1
            destination_data[destination]["potential"] += 1

        for trip in confirmed_trips:
            year = self.categorize_year(trip.start_date.year)
            destination = self.categorize_destination(trip.core_destination)
            year_data[year]["confirmed"] += 1
            destination_data[destination]["confirmed"] += 1

        # Create progress data for overall, years, and destinations
        total_confirmed = sum(data["confirmed"] for data in year_data.values())
        total_potential = sum(data["potential"] for data in year_data.values())
        overall_progress = self.create_progress_breakdown(
            {"confirmed": total_confirmed, "potential": total_potential}
        )

        progress_by_year = {
            year: self.create_progress_breakdown(data)
            for year, data in year_data.items()
        }
        progress_by_destination = {
            destination: self.create_progress_breakdown(data)
            for destination, data in destination_data.items()
        }

        return MatchingProgress(
            progress_overall=overall_progress,
            progress_by_year=progress_by_year,
            progress_by_destination=progress_by_destination,
        )

    def categorize_destination(self, destination):
        if destination in ["Africa", "Asia", "Latin America"]:
            return destination
        return "Other"

    def categorize_year(self, year):
        if year == 2024 or year == 2023:
            return str(year)
        elif year < 2023:
            return "Pre-2023"
        else:
            return "Post-2024"

    def create_progress_breakdown(self, data: dict):
        confirmed = data["confirmed"]
        potential = data["potential"]
        total = confirmed + potential
        percent_complete = f"{(confirmed / total * 100) if total > 0 else 0:.0f}%"
        return ProgressBreakdown(
            confirmed=confirmed, potential=potential, percent_complete=percent_complete
        )

    # Currently all of our accommodation logs are ungrouped
    # It is just a big table of traveler names, properties, and dates
    # We want to build Trip objects that encompass each trip by each traveler

    # I want to expose the unmatched logs in an API endpoint
    # so that admins can play a fun game where they say "yes" or "no" to a grouping

    # Create a function that can get accommodation logs (self._summary_svc.get_all_accommodation_logs)

    # We only want accommodation_logs that are not already part of a "Trip"
    # that should potentially be grouped into a "Trip" aka a PotentialTrip

    # The game will show one PotentialTrip at a time and ask yes or no

    # During the game, if they say yes, it should create a Trip out of the PotentialTrip
    # and save it to the database
    # The payload will contain the trip name

    # Therefore those accommodation logs are now matched to a trip and not eligible for the game

    # However I want to keep track of which potential trips an admin has looked at
    # and declined to say "yes" or "no" because they need help from another admin
    # (maybe they can choose "Ask" as an option instead of yes or no?)

    # In this case, should I also save potential trips into the database and mark them done as we go?

    # When all trips are matched, the game is over
    # And this service will be turned into a data quality service for ongoing entries

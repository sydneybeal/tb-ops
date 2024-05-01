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
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional, Sequence, Union, Tuple, Dict, List, Any
from uuid import UUID
from api.services.audit.service import AuditService
from api.services.audit.models import AuditLog
from api.services.summaries.models import AccommodationLogSummary
from api.services.summaries.service import SummaryService
from api.services.travel.service import TravelService
from api.services.travel.models import AccommodationLog, Trip, PatchTripRequest
from api.services.quality.models import (
    PotentialTrip,
    MatchingProgress,
    ProgressBreakdown,
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
        unmatched = await self._repo.get_unmatched_accommodation_logs()
        potential_trips = []

        # Sort logs by primary traveler and date_in in descending order
        sorted_unmatched = sorted(
            unmatched, key=lambda x: (x.primary_traveler, x.date_in.toordinal())
        )

        # Initialize a dictionary to keep track of the last log per traveler for easy reference
        last_log_per_traveler = {}

        for log in sorted_unmatched:
            should_append = False

            # Check if this log can continue a trip from the same traveler
            if log.primary_traveler in last_log_per_traveler:
                last_log = last_log_per_traveler[log.primary_traveler]
                # Allow a gap of up to 3 days; consider large gaps as a new trip
                if last_log.date_out + timedelta(days=3) >= log.date_in:
                    should_append = True

            if should_append:
                # Find the right trip to append this log, ensure the dates are close enough
                for trip in reversed(
                    potential_trips
                ):  # Reverse to optimize search, likely near the end
                    if (
                        trip.accommodation_logs[-1].primary_traveler
                        == log.primary_traveler
                        and trip.accommodation_logs[-1].date_out + timedelta(days=3)
                        >= log.date_in
                    ):
                        trip.accommodation_logs.append(log)
                        break
            else:
                # Start a new potential trip and set the trip name based on the log's details
                # trip_name = self.generate_trip_name(log)
                # potential_trips.append(
                #     PotentialTrip(accommodation_logs=[log], trip_name=trip_name)
                # )
                potential_trips.append(PotentialTrip(accommodation_logs=[log]))

            # Update the last log for this traveler, or set it if it's the first log we're seeing for this traveler
            last_log_per_traveler[log.primary_traveler] = log

        return potential_trips

    async def confirm_trip(self, trip_request: PatchTripRequest) -> dict:
        """Confirms a trip and handles the repository updates."""
        trip_id = await self._travel_svc.add_trip(trip_request)

        await self._travel_svc.update_trip_id(
            trip_request.accommodation_log_ids,
            trip_id,
            trip_request.updated_by,
        )
        # try:
        # Create trip in the trips table
        # trip_id = await self._travel_svc.add_trip(trip_request)

        # await self._travel_svc.update_trip_id(
        #     trip_request.accommodation_log_ids,
        #     trip_id,
        #     trip_request.updated_by,
        # )

        # except:
        # raise Exception("Failed to confirm trip")

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
        print(year_data)
        print(destination_data)

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

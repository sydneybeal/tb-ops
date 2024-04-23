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
from api.services.summaries.service import SummaryService
from api.services.travel.service import TravelService
from api.services.travel.models import (
    AccommodationLog,
    Trip,
)
from api.services.quality.models import (
    PotentialTrip,
)
from api.services.quality.repository.postgres import PostgresQualityRepository


class QualityService:
    """Service for interfacing with the data quality of travel entries."""

    def __init__(self):
        """Initializes with a configured repository."""
        self._summary_svc = SummaryService()
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
                trip_name = f"{log.primary_traveler} x {log.num_pax}"
                potential_trips.append(
                    PotentialTrip(accommodation_logs=[log], trip_name=trip_name)
                )

            # Update the last log for this traveler, or set it if it's the first log we're seeing for this traveler
            last_log_per_traveler[log.primary_traveler] = log

        return potential_trips

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

"""Seeds database tables with historical data."""

import csv
import uuid
from datetime import datetime
import asyncio
from collections import defaultdict
from api.services.summaries.service import SummaryService


class DupeChecker:
    """Populates the database with existing source data."""

    def __init__(self):
        """Initializes the source data to be seeded."""
        self._summary_service = SummaryService()

    async def check_duplicates(self):
        """Checks for the presence of potential duplicates."""
        all_logs = await self._summary_service.get_all_accommodation_logs()
        potential_duplicates = []
        print(len(all_logs))

        # Group logs by primary_traveler name
        grouped_logs = defaultdict(list)
        for log in all_logs:
            grouped_logs[log.primary_traveler].append(log)

        # Function to check if two periods overlap
        def dates_overlap(start1, end1, start2, end2):
            return max(start1, start2) < min(end1, end2)

        # Check for overlaps between date_in and date_out
        for traveler, logs in grouped_logs.items():
            # Sort logs by date_in to reduce the number of comparisons needed
            logs.sort(key=lambda x: x.date_in)
            for i in range(len(logs)):
                for j in range(i + 1, len(logs)):
                    if dates_overlap(
                        logs[i].date_in,
                        logs[i].date_out,
                        logs[j].date_in,
                        logs[j].date_out,
                    ):
                        # print(f"Conflicting potential duplicates found for {traveler}:")
                        # print(f"Log {i}: {logs[i]}")
                        # print(f"Log {j}: {logs[j]}")
                        potential_duplicates.append(logs[i])
                        potential_duplicates.append(logs[j])

        for dupe in potential_duplicates:
            print(
                f"{dupe.primary_traveler},{dupe.num_pax},{dupe.property_name},{dupe.date_in},{dupe.date_out},{dupe.consultant_display_name}"
            )

        print(f"{len(potential_duplicates)} potential duplicates found.")


if __name__ == "__main__":
    dupe_checker = DupeChecker()
    asyncio.run(dupe_checker.check_duplicates())

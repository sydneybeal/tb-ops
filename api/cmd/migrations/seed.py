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

"""Seeds database tables with historical data."""
import asyncio
import csv
import uuid
from datetime import datetime
from api.services.travel.models import (
    CoreDestination,
    Country,
    Consultant,
    Property,
    AccommodationLog,
    Agency,
    BookingChannel,
)
from api.services.travel.service import TravelService


class SourceTableBuilder:
    """Populates the database with existing source data."""

    def __init__(self):
        """Initializes the source data to be seeded."""
        self._travel_service = TravelService()
        self.raw_data = {
            "core_destinations": self.read_csv("core_destinations"),
            "countries": self.read_csv("countries"),
            "agencies": self.read_csv("agencies"),
            "booking_channels": self.read_csv("booking_channels"),
            "consultants": self.read_csv("consultants"),
            "properties": self.read_csv("properties"),
            "accommodation_logs": self.read_csv("accommodation_logs"),
        }

    async def seed_core_destinations(self):
        """Seeds core destinations into the DB."""
        records_to_add = []
        for row in self.raw_data["core_destinations"]:
            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = CoreDestination(**row)
            records_to_add.append(record)

        await self._travel_service.add_core_destination(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} CoreDestination records.")

    async def seed_countries(self):
        """Seeds countries into the DB with their appropriate core destination ID."""
        records_to_add = []
        for row in self.raw_data["countries"]:
            # Fetch the core_destination_id using the service layer
            core_destination = await self._travel_service.get_core_destination_by_name(
                row["core_destination"]
            )
            if core_destination:
                row["core_destination_id"] = core_destination.id
                del row["core_destination"]  # Remove the name key
            else:
                print(f"Core destination {row['core_destination']} not found.")

            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = Country(**row)
            records_to_add.append(record)

        await self._travel_service.add_country(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} new Country records.")

    async def seed_db(self):
        """Seeds the database table given a source name."""
        # step 1 seed the core destinations table with existing data
        await self.seed_core_destinations()
        # step 2 seed countries table that references a core destination ID using lookup
        await self.seed_countries()

        # step 2 seed the other tables in the correct order
        # implement here
        # create the appropriate pydantic model object for the source_table
        # Agency({**data,"inserted_at": datetime.now(), etc...)
        # write the records to the database table named by the source_table
        # self._travel_service.add_accommodation_log(accommodation_logs_to_add)
        # print(f"Built {len(data)} records for {source_table}.")

    def read_csv(self, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        with open(
            f"/Users/sydney-horan/tb-ops/seed/{file_name}.csv",
            encoding="utf-8-sig",
        ) as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                data.append(row)
        return data


if __name__ == "__main__":
    source_table_builder = SourceTableBuilder()
    asyncio.run(source_table_builder.seed_db())

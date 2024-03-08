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
import csv
import uuid
from datetime import datetime
import asyncio
import asyncpg
from api.services.travel.models import (
    CoreDestination,
    Country,
    Consultant,
    Property,
    AccommodationLog,
    Agency,
    BookingChannel,
    Portfolio,
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
            "portfolios": self.read_csv("portfolios"),
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

    async def seed_agencies(self):
        """Seeds agencies into the DB."""
        records_to_add = []
        for row in self.raw_data["agencies"]:
            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = Agency(**row)
            records_to_add.append(record)

        await self._travel_service.add_agency(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} Agency records.")

    async def seed_booking_channels(self):
        """Seeds booking channels into the DB."""
        records_to_add = []
        for row in self.raw_data["booking_channels"]:
            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = BookingChannel(**row)
            records_to_add.append(record)

        await self._travel_service.add_booking_channel(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} BookingChannel records.")

    async def seed_consultants(self):
        """Seeds consultants into the DB."""
        records_to_add = []
        for row in self.raw_data["consultants"]:
            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = Consultant(**row)
            records_to_add.append(record)

        await self._travel_service.add_consultant(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} Consultant records.")

    async def seed_portfolios(self):
        """Seeds portfolios into the DB."""
        # # Old code - keep template for previous Excel sheets
        # records_to_add = []
        # properties = self.raw_data.get("properties", [])

        # # Create a set of distinct portfolio names, defaulting to "Unknown" if blank
        # portfolio_names = {
        #     prop.get("portfolio", "Unknown").strip() or "Unknown" for prop in properties
        # }

        # # Prepare list of portfolios to add, each as a dict
        # portfolios_to_add = [{"name": name} for name in portfolio_names]

        # for row in portfolios_to_add:
        #     # Add UUID and timestamps
        #     row["id"] = uuid.uuid4()
        #     row["created_at"] = datetime.now()
        #     row["updated_at"] = datetime.now()
        #     row["updated_by"] = "Initialization script"

        #     # Convert row dict to model instance
        #     record = Portfolio(**row)
        #     records_to_add.append(record)

        # await self._travel_service.add_portfolio(records_to_add)
        # print(f"Successfully seeded {len(records_to_add)} Portfolio records.")
        records_to_add = []
        for row in self.raw_data["portfolios"]:
            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Convert row dict to model instance
            record = Portfolio(**row)
            records_to_add.append(record)

        await self._travel_service.add_portfolio(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} new Portfolio records.")

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

    async def seed_override_properties(self):
        """Seeds properties that were not in the Autofill Lookup Table."""
        records_to_add = []
        missing_properties = [
            {
                "name": "Waldorf Astoria Cairo Helipolis",
                "portfolio": "Unknown",
                # "representative": "Unknown",
                "core_destination": "Africa",
                "country": "Egypt",
            },
            {
                "name": "Mbali Mbali Gombe Lodge",
                "portfolio": "Unknown",
                # "representative": "Unknown",
                "core_destination": "Africa",
                "country": "Tanzania",
            },
        ]
        for row in missing_properties:
            country = await self._travel_service.get_country_by_name(row["country"])
            if country:
                row["country_id"] = country.id
                row["core_destination_id"] = country.core_destination_id
            else:
                if row["core_destination"].strip().upper() == "SEA":
                    row["core_destination"] = "Asia"
                core_destination = (
                    await self._travel_service.get_core_destination_by_name(
                        row["core_destination"]
                    )
                )
                if core_destination:
                    row["core_destination_id"] = core_destination.id
                else:
                    print(f"Core destination {row['core_destination']} not found.")

            portfolio = await self._travel_service.get_portfolio_by_name(
                row["portfolio"]
            )
            if portfolio:
                row["portfolio_id"] = portfolio.id
            else:
                print(f"No portfolio found for {row['portfolio']}")
                print(row)

            del row["portfolio"]

            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"
            records_to_add.append(Property(**row))

        await self._travel_service.add_property(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} missing Property records.")

    async def seed_properties(self):
        """Seeds properties into the DB with their appropriate country ID."""
        records_to_add = []
        for row in self.raw_data["properties"]:
            # Fetch the country_id using the service layer
            country = await self._travel_service.get_country_by_name(
                row["country"].strip().replace(" / ", "/").title()
            )
            if country:
                row["country_id"] = country.id
                row["core_destination_id"] = country.core_destination_id
            else:
                if row["core_destination"].strip().upper() == "SEA":
                    row["core_destination"] = "Asia"
                core_destination = (
                    await self._travel_service.get_core_destination_by_name(
                        row["core_destination"]
                    )
                )
                if core_destination:
                    row["core_destination_id"] = core_destination.id
                else:
                    print(f"Core destination {row['core_destination']} not found.")

            del row["core_destination"]
            del row["country"]

            if row.get("portfolio", "") == "":
                portfolio_name = "Unknown"
            else:
                portfolio_name = row["portfolio"].strip()

            portfolio = await self._travel_service.get_portfolio_by_name(portfolio_name)
            if portfolio:
                row["portfolio_id"] = portfolio.id
            else:
                print(f"No portfolio found for {portfolio_name}")
                print(row)

            del row["portfolio"]
            del row["representative"]

            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"
            # if row.get("portfolio", "") == "":
            #     row["portfolio"] = "Unknown"

            # Convert row dict to model instance
            record = Property(**row)

            records_to_add.append(record)

        await self._travel_service.add_property(records_to_add)
        print(f"Successfully seeded {len(records_to_add)} new Property records.")

    async def seed_accommodation_logs(self):
        """Seeds accommodation logs into the DB with their appropriate foreign keys."""
        records_to_add = []
        for row in self.raw_data["accommodation_logs"]:
            # Clean up invalid records
            row["property_name"] = row["property_name"].strip()
            row["tb_consultant"] = row["tb_consultant"].strip()
            # Map to portfolio 'Unknown'
            if row.get("portfolio", "") == "":
                row["portfolio"] = "Unknown"
            # Correct Magashi Camp to Wilderness Magashi
            if row["property_name"] == "Magashi Camp":
                row["property_name"] = "Wilderness Magashi"
                row["country"] = "Rwanda"
                row["portfolio"] = "Wilderness"
            # Add the . after O.R. Tambo
            if row["property_name"] == "City Lodge O.R Tambo Airport Hotel":
                row["property_name"] = "City Lodge O.R. Tambo Airport Hotel"
            # Remove "Camp"
            if row["property_name"] == "Little Kulala Camp":
                row["property_name"] = "Little Kulala"
                row["country"] = "Namibia"
                row["portfolio"] = "Wilderness"
            # Fill in missing portfolio
            if row["property_name"] == "ILLA Experience Hotel":
                row["portfolio"] = "Latin Trails"
            # Fix name
            if row["property_name"] == "Hotel Sol Y Luna":
                row["country"] = "Peru"
                row["property_name"] = "Sol Y Luna Hotel"
                row["portfolio"] = "Relais & Chateaux"
            # Fill in missing country/portfolio
            if row["property_name"] == "Katambuga House":
                row["country"] = "Tanzania"
                row["portfolio"] = "Entara"
            # Fill in missing consultant
            if row.get("tb_consultant", "") == "":
                row["tb_consultant"] = "Unknown/Unknown"
            # Correct country name
            if row["property_name"] == "Arusha Coffee Lodge":
                row["country"] = "Tanzania"
            row["primary_traveler"] = row["primary_traveler"].replace(" x2", "").strip()
            # Fetch the country_id using the service layer
            country = await self._travel_service.get_country_by_name(
                row["country"].strip()
            )
            if country:
                row["country_id"] = country.id
                row["core_destination_id"] = country.core_destination_id
            else:
                core_destination = (
                    await self._travel_service.get_core_destination_by_name(
                        row["core_destination"].strip()
                    )
                )
                if core_destination:
                    row["core_destination_id"] = core_destination.id
                else:
                    print(
                        f"No core destination found for {row['core_destination'].strip()}"
                    )

            consultant_l_name, consultant_f_name = row["tb_consultant"].split("/")

            consultant = await self._travel_service.get_consultant_by_name(
                consultant_f_name, consultant_l_name
            )
            if consultant:
                row["consultant_id"] = consultant.id
            else:
                print(
                    f"No consultant found for {consultant_l_name}/{consultant_f_name}"
                )
                print(row)

            if row["portfolio"] != "":
                portfolio = await self._travel_service.get_portfolio_by_name("Unknown")
            if row["portfolio"] != "":
                portfolio = await self._travel_service.get_portfolio_by_name(
                    row["portfolio"].strip()
                )
            if portfolio:
                row["portfolio_id"] = portfolio.id
            elif row["portfolio"] != "":
                print(f"Could not find portfolio {row['portfolio']}")

            prop = await self._travel_service.get_property_by_name(
                row["property_name"],
                row["portfolio_id"],
                row.get("country_id", None),
                row.get("core_destination_id", None),
            )
            if prop:
                row["property_id"] = prop.id
            else:
                print(
                    f"""
                    Could not find property {row['property_name']}/{row['portfolio_id']}/
                    {row.get('country_id', None)}/{row.get('core_destination_id', None)}
                    """
                )
            if row["agency"] != "":
                agency = await self._travel_service.get_agency_by_name(
                    row["agency"].strip()
                )
                if agency:
                    row["agency_id"] = agency.id
                else:
                    print(f"Could not find agency {row['agency']}")
            if row["booking_channel"] != "":
                booking_channel = (
                    await self._travel_service.get_booking_channel_by_name(
                        row["booking_channel"].strip()
                    )
                )
                if booking_channel:
                    row["booking_channel_id"] = booking_channel.id
                elif row["booking_channel"] != "":
                    print(f"Could not find booking_channel {row['booking_channel']}")

            # Clean date fields
            row["date_in"] = datetime.strptime(row["date_in"], "%m/%d/%y").date()
            row["date_out"] = datetime.strptime(row["date_out"], "%m/%d/%y").date()

            # Add UUID and timestamps
            row["id"] = uuid.uuid4()
            row["created_at"] = datetime.now()
            row["updated_at"] = datetime.now()
            row["updated_by"] = "Initialization script"

            # Delete input string rows
            row.pop("property_name", None)
            row.pop("portfolio", None)
            row.pop("tb_consultant", None)
            row.pop("booking_channel", None)
            row.pop("agency", None)
            row.pop("country", None)
            row.pop("country_id", None)
            row.pop("core_destination_id", None)

            # Convert row dict to model instance
            record = AccommodationLog(**row)
            records_to_add.append(record)

        # Clean list to remove known duplicates
        records_to_add = self.cleanup_rows(records_to_add)

        try:
            await self._travel_service.add_accommodation_log(records_to_add)
            print(
                f"Successfully seeded {len(records_to_add)} new AccommodationLog records."
            )
        except asyncpg.exceptions.UniqueViolationError as e:
            print(e)

    def cleanup_rows(self, orig_rows: list[AccommodationLog]) -> list[AccommodationLog]:
        """Cleans up AccommodationLog rows to remove known duplicates."""
        known_duplicates = {
            (
                "Bell/Richard",
                "2024-08-28",
                "2024-08-30",
            ),
        }
        # Use a list comprehension to filter out duplicates
        ret_rows = [
            record
            for record in orig_rows
            if (
                record.primary_traveler,
                record.date_in.isoformat(),
                record.date_out.isoformat(),
            )
            not in known_duplicates
        ]
        return ret_rows

    async def seed_db(self):
        """Seeds the database table given a source name."""
        # # step 1 seed the source tables that do not reference other tables
        # await self.seed_core_destinations()
        # await self.seed_agencies()
        # await self.seed_booking_channels()
        # await self.seed_consultants()
        # await self.seed_portfolios()
        # # # # step 2 seed countries table that reference a core destination ID using lookup
        # await self.seed_countries()
        # # # step 3 seed properties that reference a country ID using lookup
        # await self.seed_properties()
        # # step 4 seed properties found during seed process that did not exist
        # await self.seed_override_properties()
        # # step 4 seed accommodation_logs that reference all of the above
        await self.seed_accommodation_logs()

    def read_csv(self, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        with open(
            f"/Users/sydney-horan/tb-ops/seed/{file_name}.csv",
            encoding="utf-8-sig",
        ) as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                if None in row.keys():
                    row.pop(None, None)
                data.append(row)
        return data


if __name__ == "__main__":
    source_table_builder = SourceTableBuilder()
    asyncio.run(source_table_builder.seed_db())

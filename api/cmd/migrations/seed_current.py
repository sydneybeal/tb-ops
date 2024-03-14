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
            # past
            "core_destinations_past": self.read_csv("past", "core_destinations"),
            "countries_past": self.read_csv("past", "countries"),
            "agencies_past": self.read_csv("past", "agencies"),
            "booking_channels_past": self.read_csv("past", "booking_channels"),
            "consultants_past": self.read_csv("past", "consultants"),
            "properties_past": self.read_csv("past", "properties"),
            "accommodation_logs_past": self.read_csv("past", "accommodation_logs"),
            "portfolios_past": self.read_csv("past", "portfolios"),
            # current
            "core_destinations_current": self.read_csv("current", "core_destinations"),
            "countries_current": self.read_csv("current", "countries"),
            "agencies_current": self.read_csv("current", "agencies"),
            "booking_channels_current": self.read_csv("current", "booking_channels"),
            "consultants_current": self.read_csv("current", "consultants"),
            "properties_current": self.read_csv("current", "properties"),
            "accommodation_logs_current": self.read_csv(
                "current", "accommodation_logs"
            ),
            "portfolios_current": self.read_csv("current", "portfolios"),
        }

    async def seed_core_destinations(self):
        """Seeds core destinations into the DB."""
        records_to_add = []
        for row in self.raw_data["core_destinations_current"]:
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
        for row in self.raw_data["agencies_current"]:
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
        for row in self.raw_data["booking_channels_current"]:
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
        for row in self.raw_data["consultants_current"]:
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
        # # # # # Old code - keep template for previous Excel sheets
        # records_to_add = []
        # properties = self.raw_data.get("properties_current", [])

        # # Create a set of distinct portfolio names, defaulting to "Unknown" if blank
        # portfolio_names = {
        #     prop.get("portfolio", "Unknown").strip() or "Unknown" for prop in properties
        # }

        # # Prepare list of portfolios to add, each as a dict
        # portfolios_to_add = [{"name": name} for name in portfolio_names]
        # for p in portfolios_to_add:
        #     print(p["name"])

        # # # Correct code
        records_to_add = []
        for row in self.raw_data["portfolios_current"]:
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
        # # code to initially crawl all properties to get list of countries for CSV
        # records_to_add = []
        # properties = self.raw_data.get("properties_current", [])

        # # Create a set of distinct portfolio names, defaulting to "Unknown" if blank
        # country_names = {
        #     (
        #         prop.get("country", "").title().strip(),
        #         prop.get("core_destination", "").strip(),
        #     )
        #     for prop in properties
        # }

        # # Prepare list of portfolios to add, each as a dict
        # countries_to_add = sorted(list(country_names), key=lambda x: (x[0], x[1]))
        # for country, destination in countries_to_add:
        #     print(f"{country},{destination}")

        # correct code
        records_to_add = []
        all_core_destinations = await self._travel_service.get_all_core_destinations()
        core_destination_map = {dest.name: dest.id for dest in all_core_destinations}
        for row in self.raw_data["countries_current"]:
            # Fetch the core_destination_id using the service layer
            core_destination_id = core_destination_map.get(row["core_destination"])
            if core_destination_id:
                row["core_destination_id"] = core_destination_id
                del row["core_destination"]  # Remove the name key
            else:
                print(f"Core destination {row['core_destination']} not found.")
                continue

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
        # # code to initially crawl all properties to get list of countries for CSV
        # records_to_add = []
        # acc = self.raw_data.get("properties_current", [])

        # # Create a set of distinct portfolio names, defaulting to "Unknown" if blank
        # country_names = {
        #     (
        #         prop.get("country", "").title().strip(),
        #         prop.get("core_destination", "").strip(),
        #     )
        #     for prop in properties
        # }

        # # Prepare list of portfolios to add, each as a dict
        # countries_to_add = sorted(list(country_names), key=lambda x: (x[0], x[1]))
        # for country, destination in countries_to_add:
        #     print(f"{country},{destination}")
        records_to_add = []
        all_countries = await self._travel_service.get_all_countries()
        all_core_destinations = await self._travel_service.get_all_core_destinations()
        all_portfolios = await self._travel_service.get_all_portfolios()

        # Create dictionaries for quick lookup
        country_map = {
            country.name.strip().replace(" / ", "/").title(): country
            for country in all_countries
        }
        core_destination_map = {dest.name: dest for dest in all_core_destinations}
        portfolio_map = {
            portfolio.name.strip(): portfolio for portfolio in all_portfolios
        }
        for row in self.raw_data["properties_current"]:
            # if "Menjangan" in row["name"]:
            #     print(row)
            # if row["name"] == "Prime Plaza Hotels Suites Resorts & Villas":
            #     print(row)
            # Initial core destination handling
            if row["core_destination"].strip().upper() == "SEA":
                row["core_destination"] = "Asia"
            core_destination = core_destination_map.get(row["core_destination"])

            # Lookup country ID
            country = country_map.get(
                row["country"].strip().replace(" / ", "/").title()
            )
            if country:
                row["country_id"] = country.id
                # Default to the country's core destination unless overridden by "Ship" or "Rail"
                if core_destination and row["core_destination"] in ["Ship", "Rail"]:
                    # Keep the core destination ID for "Ship" or "Rail"
                    row["core_destination_id"] = core_destination.id
                else:
                    # Use the country's core destination ID for non-"Ship"/"Rail" destinations
                    row["core_destination_id"] = country.core_destination_id
            else:
                # Handle cases with no matching country but a specified core destination
                if core_destination:
                    row["core_destination_id"] = core_destination.id
                else:
                    print(f"Core destination {row['core_destination']} not found.")

            del row["core_destination"]
            del row["country"]

            # Lookup portfolio ID
            portfolio_name = row.get("portfolio", "").strip() or "Unknown"
            # if row["name"] == "Prime Plaza Hotels Suites Resorts & Villas":
            #     print(portfolio_name)
            portfolio = portfolio_map.get(portfolio_name)
            # if row["name"] == "Prime Plaza Hotels Suites Resorts & Villas":
            #     print(portfolio)
            if portfolio:
                row["portfolio_id"] = portfolio.id
            else:
                print(f"No portfolio found for {portfolio_name}")

            del row["portfolio"]

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
        # Pre-fetch all necessary data
        all_countries = await self._travel_service.get_all_countries()
        all_core_destinations = await self._travel_service.get_all_core_destinations()
        all_portfolios = await self._travel_service.get_all_portfolios()
        all_properties = await self._travel_service.get_all_properties()
        all_consultants = await self._travel_service.get_all_consultants()
        all_agencies = await self._travel_service.get_all_agencies()
        all_booking_channels = await self._travel_service.get_all_booking_channels()

        # Create lookup maps
        country_map = {country.name: country for country in all_countries}
        core_destination_map = {cd.name: cd for cd in all_core_destinations}
        portfolio_map = {portfolio.name: portfolio for portfolio in all_portfolios}
        property_map = {
            (
                prop.name.lower(),
                # prop.portfolio_id,
                # prop.country_id,
                # prop.core_destination_id,
            ): prop
            for prop in all_properties
        }
        consultant_map = {
            (cons.last_name, cons.first_name): cons for cons in all_consultants
        }
        agency_map = {agency.name: agency for agency in all_agencies}
        booking_channel_map = {bc.name: bc for bc in all_booking_channels}

        for row in self.raw_data["accommodation_logs_current"]:
            # Remove x2 from traveler
            row["primary_traveler"] = row["primary_traveler"].replace(" x2", "").strip()
            # correct property name
            if row["property_name"] == "Evolution - Quasar Expeditions":
                row["property_name"] = "M/V Evolution"
            # assumptions for consultant and missing end date - to be changed later
            if (
                row["primary_traveler"] == "Schwartzburd/Karen"
                and row["property_name"] == "The Emakoko"
            ):
                row["date_out"] = "9/4/24"
                row["tb_consultant"] = "Beal/Craig"
            # assumptions for consultant
            if row["primary_traveler"] == "Gritzinger/Caroline":
                row["tb_consultant"] = "Falls/Jenny"
            # assumptions for consultant
            if row["primary_traveler"] == "Gwinn/Ashley":
                row["tb_consultant"] = "Falls/Jenny"

            # # add missing country to match property
            # if row["property_name"] == "La Pinta Cruise":
            #     row["country"] = "Ecuador"
            # Look up country, core destination, and portfolio by name
            country = country_map.get(row["country"].strip())
            core_destination = core_destination_map.get(
                row.get("core_destination", "").strip()
            )

            portfolio = portfolio_map.get(row.get("portfolio", "Unknown").strip())

            # Look up consultant, property, agency, and booking channel by composite keys or names
            consultant_names = tuple(row["tb_consultant"].split("/"))
            consultant = consultant_map.get(consultant_names)
            # Normalize core destination and check if special handling is needed
            core_dest = row.get("core_destination", "").strip().lower()
            special_handling = core_dest in ["ship", "rail"]

            # Attempt to construct the key without considering country, for special handling cases
            if special_handling:
                try:
                    property_key_without_country = (
                        row["property_name"].strip().lower(),
                        # portfolio.id,  # Assuming portfolio lookup is successful
                        # None,  # Explicitly ignoring country ID for Ship/Rail
                        # core_destination.id,  # Assuming core_destination lookup is successful
                    )
                except:
                    print(row)
                prop = property_map.get(property_key_without_country)

                # If property not found and it's a special handling case, try including country information
                if not prop:
                    # This requires knowing all possible countries for a property, which might not be feasible
                    # Hence, this strategy might not be directly applicable without additional context or data structure adjustments
                    # However, for illustrative purposes, let's assume we attempt with known country
                    for country_name, country_obj in country_map.items():
                        property_key_with_country = (
                            row["property_name"].strip().lower(),
                            # portfolio.id,
                            # country_obj.id,  # Use the id from the country map
                            # core_destination.id,
                        )
                        prop = property_map.get(property_key_with_country)
                        if prop:
                            break  # Exit the loop if a match is found

            else:
                # For non-special handling, construct the key normally
                property_key = (
                    row["property_name"].strip().lower(),
                    # portfolio.id,
                    # (
                    #     country.id if country else None
                    # ),  # Here, country might be None if not provided
                    # core_destination.id,
                )
                prop = property_map.get(property_key)

            if not prop:
                print(
                    f"Property not found for key: Name='{row['property_name'].strip()}' "
                    f"Portfolio ID='{portfolio.id if portfolio else 'None'}' "
                    f"Country ID='{country.id if country else 'None'}' "
                    f"Core Dest ID='{core_destination.id if core_destination else 'None'}'"
                )
                print(row)
                return
            # if not prop:
            #     # Try looking up without considering the country, if not already done
            #     if special_handling:
            #         property_key = (
            #             row["property_name"].strip().lower(),
            #             portfolio.id,
            #             None,
            #             core_destination.id,
            #         )
            #         prop = property_map.get(property_key)
            # if not prop:
            #     print(
            #         f"Property not found for key: Name='{row['property_name'].strip()}' "
            #         f"Portfolio ID='{portfolio.id if portfolio else 'None'}' "
            #         f"Country ID='{country.id if country else 'None'}'"
            #         f"Core Dest ID='{core_destination.id if core_destination else 'None'}'"
            #     )
            #     print(row)
            agency = agency_map.get(row.get("agency", "").strip())
            booking_channel = booking_channel_map.get(
                row.get("booking_channel", "").strip()
            )

            if country:
                row["country_id"] = country.id
                row["core_destination_id"] = country.core_destination_id
            if consultant:
                row["consultant_id"] = consultant.id
            else:
                print(row)
            if prop:
                row["property_id"] = prop.id
            if portfolio:
                row["portfolio_id"] = portfolio.id
            if agency:
                row["agency_id"] = agency.id
            if booking_channel:
                row["booking_channel_id"] = booking_channel.id

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
        # step 1 seed the source tables that do not reference other tables
        await self.seed_core_destinations()
        await self.seed_agencies()
        await self.seed_booking_channels()
        await self.seed_consultants()
        await self.seed_portfolios()
        # # # # # # # step 2 seed countries table that reference a core destination ID using lookup
        await self.seed_countries()
        # # # # # # # # step 3 seed properties that reference a country ID using lookup
        await self.seed_properties()
        # # # # step 4 seed properties found during seed process that did not exist
        # # await self.seed_override_properties()
        # # # # step 4 seed accommodation_logs that reference all of the above
        await self.seed_accommodation_logs()

    def read_csv(self, genre, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        with open(
            f"/Users/sydney-horan/tb-ops/seed/{genre}/{file_name}.csv",
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

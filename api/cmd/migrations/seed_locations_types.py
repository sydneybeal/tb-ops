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

"""Seeds properties with their locations & property types."""

import csv
from api.services.travel.service import TravelService
from api.services.travel.models import PatchPropertyRequest
from api.services.summaries.service import SummaryService
import asyncio


class PropertyDetailImporter:

    def __init__(self):
        """Initializes the source data to be seeded."""
        self._travel_service = TravelService()
        self._summary_service = SummaryService()
        self.builder_properties = self.read_csv("BuilderProperties")
        self.builder_countries = self.read_csv("BuilderCountries")

    async def seed_locations(self):
        """Seeds the property table given input files."""
        # latin_america = self.read_csv("LatinAmerica")
        # africa = self.read_csv("Africa")
        # asia = self.read_csv("SEAsia")

        builder_data = self.process_data()
        # print(builder_data[0])

        properties = await self._summary_service.get_all_properties()
        # first_five_properties = properties[:5]

        properties_sorted = sorted(properties, key=lambda x: x.name)

        # Find index of the last updated property and filter for the rest
        last_updated_index = next(
            (
                i
                for i, p in enumerate(properties_sorted)
                if p.name == "The Last Word Long Beach"
            ),
            None,
        )
        if last_updated_index is not None:
            properties_to_update = properties_sorted[last_updated_index + 1 :]
        else:
            properties_to_update = []

        # for each property, use the name against the builder property name
        # and tell me if the country_name is not the same as the builder_country

        # builder_property_names = {bp["name"] for bp in builder_data}
        builder_properties_dict = {bp["name"]: bp for bp in builder_data}

        for prop in properties_to_update:
            if prop.name in builder_properties_dict:
                # Accessing the corresponding builder property details
                builder_prop = builder_properties_dict[prop.name]

                # create a PatchPropertyRequest object
                property_patch = PatchPropertyRequest(
                    property_id=prop.id,
                    name=prop.name,
                    portfolio_id=prop.portfolio_id,
                    country_id=prop.country_id,
                    core_destination_id=prop.core_destination_id,
                    location=builder_prop["location"],
                    latitude=(
                        float(builder_prop["latitude"])
                        if builder_prop["latitude"] is not None
                        else None
                    ),
                    longitude=(
                        float(builder_prop["longitude"])
                        if builder_prop["longitude"] is not None
                        else None
                    ),
                    updated_by="admin@travelbeyond.com",
                )

                # Send the PATCH request through the travel service
                results = await self._travel_service.process_property_request(
                    property_patch
                )
                print(f"Update results for {prop.name}: {results}")
            else:
                print(f"No builder data found for property {prop.name}")

                # If there is a match, check for country mismatch and print details
                # matching_builder_props = [
                #     bp for bp in builder_data if bp["name"] == prop.name
                # ]
                # for builder_prop in matching_builder_props:
                #     if prop.country_name != builder_prop["country"]:
                #         print(
                #             {
                #                 "property_name": prop.name,
                #                 "rr_country": prop.country_name,
                #                 "builder_location": builder_prop["location"],
                #                 "builder_country": builder_prop["country"],
                #             }
                #         )

    async def seed_types(self):
        # await self.seed_region("Latin_America")
        # await self.seed_region("Asia")
        await self.seed_region("Africa")

    async def seed_region(self, region: str):
        spreadsheet_data = self.read_csv(region)
        properties = await self._summary_service.get_all_properties()
        properties_sorted = sorted(properties, key=lambda x: x.name)

        # Find index of the last updated property and filter for the rest
        last_updated_index = next(
            (
                i
                for i, p in enumerate(properties_sorted)
                if p.name == "Hotel Boutique Sazagua"
            ),
            None,
        )
        if last_updated_index is not None:
            properties_to_update = properties_sorted[last_updated_index + 1 :]
        else:
            properties_to_update = []

        spreadsheet_dict = {bp["Name"]: bp for bp in spreadsheet_data}
        for prop in properties:
            if prop.name in spreadsheet_dict:
                spreadsheet_prop = spreadsheet_dict[prop.name]
                print(f"Adding {spreadsheet_prop['Property Type']} for {prop.name}")
                property_patch = PatchPropertyRequest(
                    property_id=prop.id,
                    name=prop.name,
                    portfolio_id=prop.portfolio_id,
                    country_id=prop.country_id,
                    core_destination_id=prop.core_destination_id,
                    location=prop.location,
                    latitude=prop.latitude,
                    longitude=prop.longitude,
                    property_type=spreadsheet_prop["Property Type"],
                    updated_by="admin@travelbeyond.com",
                )
                results = await self._travel_service.process_property_request(
                    property_patch
                )
                print(f"Update results for {prop.name}: {results}")
            else:
                pass
                # print(f"No spreadsheet data found for property {prop.name}")

    def process_data(self):
        # Extracting details from builder_properties
        properties_data = []
        for property in self.builder_properties:
            clean_country_id = property["country"].strip("[]")  # Removing brackets
            clean_latitude = self.clean_coordinate(property["latitude"])
            clean_longitude = self.clean_coordinate(property["longitude"])
            properties_data.append(
                {
                    "name": property["title"],
                    "location": property["cityProvince"],
                    "latitude": clean_latitude,
                    "longitude": clean_longitude,
                    "country_builder_id": clean_country_id,
                }
            )

        # Extracting country IDs and titles
        country_id_to_title = {}
        for country in self.builder_countries:
            country_id_to_title[country["id"]] = country["title"]

        # Merging data with country titles
        for property in properties_data:
            country_id = property["country_builder_id"]
            property["country"] = country_id_to_title.get(country_id, "Unknown")

        return properties_data

    def clean_coordinate(self, coord):
        # Removing quotes, tabs, and trimming spaces
        cleaned = coord.replace('"', "").replace("\t", "").strip()
        # Convert to float
        try:
            return float(cleaned)
        except ValueError:
            return None

    def read_csv(self, file_name) -> list[dict]:
        """Parses a CSV given a file name."""
        data = []
        with open(
            f"/Users/sydney-horan/tb-ops/seed/properties/{file_name}.csv",
            encoding="utf-8-sig",
        ) as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                if None in row.keys():
                    row.pop(None, None)
                data.append(row)
        return data


if __name__ == "__main__":
    source_table_builder = PropertyDetailImporter()
    # asyncio.run(source_table_builder.seed_locations())
    asyncio.run(source_table_builder.seed_types())

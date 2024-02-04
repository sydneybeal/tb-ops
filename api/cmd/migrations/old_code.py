# async def seed_countries(self):
#     """Uses the raw data to seed all countries that exist."""
#     country_names = set()  # To store unique country names

#     for entry in self.raw_properties + self.raw_accommodation_logs:
#         if "country" in entry and entry["country"].strip():
#             # Trim, remove spaces around slashes, and title-case the country name
#             cleaned_country = entry["country"].strip().replace(" / ", "/").title()
#             country_names.add(cleaned_country)

#     countries_to_add = [
#         Country(
#             id=uuid.uuid4(),  # Generating a new UUID for each country
#             name=country,
#             created_at=datetime.now(),
#             updated_at=datetime.now(),
#             updated_by="Initialization process",  # Example, adjust as necessary
#         )
#         for country in country_names
#     ]

#     await self._travel_service.add_country(countries_to_add)

#     for country in countries_to_add:
#         print(f"{country.name}")

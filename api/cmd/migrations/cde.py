import asyncio
import uuid
from datetime import datetime
from api.services.travel.models import CoreDestination
from api.services.travel.service import TravelService

travel_service = TravelService()


async def add_core_destination(name: str):
    # Convert row dict to model instance
    record = CoreDestination(
        name=name,
        id=uuid.uuid4(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        updated_by="Initialization script",
    )
    print(record)

    await travel_service.add_core_destination([record])
    print(f"Successfully seeded CoreDestination {name}.")


if __name__ == "__main__":
    asyncio.run(add_core_destination("Polar - Arctic"))

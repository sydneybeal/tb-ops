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

"""REST API entrypoint code for TB Operations."""
from urllib import parse
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.services.summaries.models import (
    AccommodationLogSummary,
    CountrySummary,
    PropertySummary,
    BedNightReport,
)
from api.services.summaries.service import SummaryService
from api.services.travel.models import (
    AccommodationLog,
    BookingChannel,
    Agency,
    Consultant,
    PatchAccommodationLogRequest,
)
from api.services.travel.service import TravelService


def make_app(travel_svc: TravelService, summary_svc: SummaryService) -> FastAPI:
    """Function to build FastAPI app."""
    app = FastAPI(
        title="tb_ops_api_layer",
        version="0.0.1",
        docs_url="/docs",
        openapi_url="/openapi.json",
        servers=[
            {
                "url": "https://www.ops.travelbeyond.com",
                "description": "TB Operations API",
            },
        ],
        description="Travel Beyond.",
        openapi_tags=[
            {
                "name": "service_providers",
                "description": "Bed night reporting for client trips.",
            },
        ],
    )

    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {"Hello": "World", "Version": "feb7v1"}

    @app.get(
        "/v1/accommodation_logs",
        operation_id="get_accommodation_logs",
        response_model=list[AccommodationLogSummary],
        tags=["accommodation_logs"],
    )
    async def get_all_accommodation_logs() -> (
        list[AccommodationLogSummary] | JSONResponse
    ):
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_accommodation_logs()

    @app.patch(
        "/v1/accommodation_logs",
        operation_id="post_accommodation_logs",
        tags=["accommodation_logs"],
    )
    async def post_accommodation_logs(
        accommodation_log_requests: list[PatchAccommodationLogRequest],
    ) -> JSONResponse:
        # ) -> Response:
        """Get all AccommodationLog summaries."""
        results = await travel_svc.process_accommodation_log_requests(
            accommodation_log_requests
        )
        return JSONResponse(content=results)

    @app.get(
        "/v1/properties",
        operation_id="get_properties",
        response_model=list[PropertySummary],
        tags=["properties"],
    )
    async def get_all_properties() -> list[PropertySummary] | JSONResponse:
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_properties()

    @app.get(
        "/v1/countries",
        operation_id="get_countries",
        response_model=list[CountrySummary],
        tags=["countries"],
    )
    async def get_all_countries() -> list[CountrySummary] | JSONResponse:
        """Get all Country models."""
        return await summary_svc.get_all_countries()

    @app.get(
        "/v1/consultants",
        operation_id="get_consultants",
        response_model=list[Consultant],
        tags=["consultants"],
    )
    async def get_all_consultants() -> list[Consultant] | JSONResponse:
        """Get all Country models."""
        return await travel_svc.get_all_consultants()

    @app.get(
        "/v1/booking_channels",
        operation_id="get_booking_channels",
        response_model=list[BookingChannel],
        tags=["booking_channels"],
    )
    async def get_all_booking_channels() -> list[BookingChannel] | JSONResponse:
        """Get all BookingChannel models."""
        return await travel_svc.get_all_booking_channels()

    @app.get(
        "/v1/agencies",
        operation_id="get_agencies",
        response_model=list[Agency],
        tags=["agencies"],
    )
    async def get_all_agencies() -> list[Agency] | JSONResponse:
        """Get all Agency models."""
        return await travel_svc.get_all_agencies()

    @app.get(
        "/v1/bed_night_report",
        operation_id="get_bed_night_report",
        response_model=BedNightReport,
        tags=["bed_night_report"],
    )
    async def get_bed_night_report(
        request: Request,
    ) -> BedNightReport | JSONResponse:
        """Get all AccommodationLog summaries."""
        query_params = dict(request.query_params)
        report_data = await summary_svc.get_bed_night_report(query_params)
        if report_data is None:
            raise HTTPException(status_code=404, detail="Report data not found")
        return report_data

    return app


if __name__ == "__main__":
    import uvicorn

    travel_svc = TravelService()
    summary_svc = SummaryService()

    app = make_app(travel_svc, summary_svc)

    uvicorn.run(app, host="0.0.0.0", port=9900)

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
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.services.summaries.models import AccommodationLogSummary
from api.services.summaries.service import SummaryService


def make_app(summary_svc: SummaryService) -> FastAPI:
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
        return {"Hello": "World"}

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

    return app


if __name__ == "__main__":
    import uvicorn

    summary_svc = SummaryService()

    app = make_app(summary_svc)

    uvicorn.run(app, host="0.0.0.0", port=9900)

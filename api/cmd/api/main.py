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
# from urllib import parse
from datetime import timedelta
from uuid import UUID
from fastapi import FastAPI, Depends, Request, HTTPException, status

# from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.param_functions import Form

from jose import JWTError, jwt
from api.services.auth.models import User
from api.services.auth.service import AuthService
from api.services.summaries.models import (
    AccommodationLogSummary,
    CountrySummary,
    PropertySummary,
    BedNightReport,
)
from api.services.summaries.service import SummaryService
from api.services.travel.models import (
    BookingChannel,
    Agency,
    Consultant,
    PatchAccommodationLogRequest,
)
from api.services.travel.service import TravelService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def make_app(
    travel_svc: TravelService, summary_svc: SummaryService, auth_svc: AuthService
) -> FastAPI:
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

    async def get_current_user(token: str = Depends(oauth2_scheme)):
        """Gets current user for API authentication."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WwW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(
                token, auth_svc.SECRET_KEY, algorithms=[auth_svc.ALGORITHM]
            )
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
            user = await auth_svc.get_user(email=email)
            if user is None:
                raise credentials_exception
            return user
        except JWTError as exc:
            raise credentials_exception from exc

    @app.get("/")
    def root():
        return {"Hello": "World", "Version": "feb27v1"}

    @app.post("/token")
    async def login_for_access_token(email: str = Form(...), password: str = Form(...)):
        user = await auth_svc.authenticate_user(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=auth_svc.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_svc.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {
            "access token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "email": user.email,
        }

    @app.get(
        "/v1/accommodation_logs",
        operation_id="get_accommodation_logs",
        response_model=list[AccommodationLogSummary],
        tags=["accommodation_logs"],
    )
    async def get_all_accommodation_logs(
        current_user: User = Depends(get_current_user),
    ) -> list[AccommodationLogSummary] | JSONResponse:
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_accommodation_logs()

    @app.patch(
        "/v1/accommodation_logs",
        operation_id="post_accommodation_logs",
        tags=["accommodation_logs"],
    )
    async def post_accommodation_logs(
        accommodation_log_requests: list[PatchAccommodationLogRequest],
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Get all AccommodationLog summaries."""
        results = await travel_svc.process_accommodation_log_requests(
            accommodation_log_requests
        )
        return JSONResponse(content=results)

    @app.delete(
        "/v1/accommodation_logs/{log_id}",
        operation_id="delete_accommodation_log",
        tags=["accommodation_logs"],
    )
    async def delete_accommodation_log(
        log_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete an accommodation log by its ID."""
        is_deleted = await travel_svc.delete_accommodation_log(log_id)
        if not is_deleted:
            raise HTTPException(status_code=404, detail="Accommodation log not found")
        return JSONResponse(
            content={"message": "Accommodation log deleted successfully"},
            status_code=200,
        )

    @app.get(
        "/v1/properties",
        operation_id="get_properties",
        response_model=list[PropertySummary],
        tags=["properties"],
    )
    async def get_all_properties(
        current_user: User = Depends(get_current_user),
    ) -> list[PropertySummary] | JSONResponse:
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_properties()

    @app.get(
        "/v1/countries",
        operation_id="get_countries",
        response_model=list[CountrySummary],
        tags=["countries"],
    )
    async def get_all_countries(
        current_user: User = Depends(get_current_user),
    ) -> list[CountrySummary] | JSONResponse:
        """Get all Country models."""
        return await summary_svc.get_all_countries()

    @app.get(
        "/v1/consultants",
        operation_id="get_consultants",
        response_model=list[Consultant],
        tags=["consultants"],
    )
    async def get_all_consultants(
        current_user: User = Depends(get_current_user),
    ) -> list[Consultant] | JSONResponse:
        """Get all Country models."""
        return await travel_svc.get_all_consultants()

    @app.get(
        "/v1/booking_channels",
        operation_id="get_booking_channels",
        response_model=list[BookingChannel],
        tags=["booking_channels"],
    )
    async def get_all_booking_channels(
        current_user: User = Depends(get_current_user),
    ) -> list[BookingChannel] | JSONResponse:
        """Get all BookingChannel models."""
        return await travel_svc.get_all_booking_channels()

    @app.get(
        "/v1/agencies",
        operation_id="get_agencies",
        response_model=list[Agency],
        tags=["agencies"],
    )
    async def get_all_agencies(
        current_user: User = Depends(get_current_user),
    ) -> list[Agency] | JSONResponse:
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
        current_user: User = Depends(get_current_user),
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
    auth_svc = AuthService()

    app = make_app(travel_svc, summary_svc, auth_svc)

    uvicorn.run(app, host="0.0.0.0", port=9900)

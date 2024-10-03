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
from datetime import timedelta, datetime, date
from typing import Sequence, Iterable, Optional, List, Union
from uuid import UUID
from fastapi import FastAPI, Depends, Request, HTTPException, status, Query

# from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.param_functions import Form

from jose import JWTError, jwt
from api.services.admin.models import AdminComment
from api.services.admin.service import AdminService
from api.services.auth.models import User
from api.services.audit.service import AuditService
from api.services.audit.models import AuditLog
from api.services.auth.models import UserSummary
from api.services.auth.service import AuthService
from api.services.currency.service import CurrencyService
from api.services.currency.models import DailyRate, PatchDailyRateRequest
from api.services.summaries.models import (
    AccommodationLogSummary,
    AgencySummary,
    BaseTrip,
    BookingChannelSummary,
    CountrySummary,
    PortfolioSummary,
    PropertySummary,
    PropertyDetailSummary,
    BedNightReport,
    TripSummary,
)
from api.services.summaries.service import SummaryService
from api.services.travel.models import (
    Consultant,
    CoreDestination,
    PatchAccommodationLogRequest,
    PatchAgencyRequest,
    PatchBookingChannelRequest,
    PatchConsultantRequest,
    PatchCountryRequest,
    PatchCoreDestinationRequest,
    PatchPortfolioRequest,
    PatchPropertyRequest,
    PatchPropertyDetailRequest,
    PatchTripRequest,
)
from api.services.travel.service import TravelService
from api.services.reviews.models import (
    PatchTripReportRequest,
    TripReport,
    TripReportSummary,
)
from api.services.reviews.service import ReviewService
from api.services.quality.service import QualityService
from api.services.quality.models import PotentialTrip, MatchingProgress

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

VERSION = "vTripReports"


def get_auth_service() -> AuthService:
    """Dependency provider for AuthService."""
    # This function will be overridden in the app to provide the actual auth_svc
    raise NotImplementedError


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_svc: AuthService = Depends(get_auth_service),
):
    """Gets current user for API authentication."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, auth_svc.SECRET_KEY, algorithms=[auth_svc.ALGORITHM]
        )
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = await auth_svc.get_user(email=email)
        if user is None:
            raise credentials_exception
        return user
    except JWTError as exc:
        raise credentials_exception from exc


def make_app(
    travel_svc: TravelService,
    summary_svc: SummaryService,
    auth_svc: AuthService,
    audit_svc: AuditService,
    review_svc: ReviewService,
    quality_svc: QualityService,
    admin_svc: AdminService,
    currency_svc: CurrencyService,
) -> FastAPI:
    """Function to build FastAPI app."""
    app = FastAPI(
        title="roam_and_report_api_layer",
        version=VERSION,
        docs_url="/docs",
        openapi_url="/openapi.json",
        servers=[
            {
                "url": "https://www.api.roamandreport.com",
                "description": "TB Operations API",
            },
        ],
        description="Travel Beyond.",
        openapi_tags=[
            {
                "name": "roam_and_report",
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

    # Provide the actual AuthService instance
    def get_auth_service_override() -> AuthService:
        return auth_svc

    # Override the dependency
    app.dependency_overrides[get_auth_service] = get_auth_service_override

    @app.get("/")
    def root():
        return {"Hello": "World", "Version": VERSION}

    @app.post("/token")
    async def login_for_access_token(email: str = Form(...), password: str = Form(...)):
        user = await auth_svc.authenticate_user(email, password)

        if not user:
            print(f"User login for {email} failed.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Remove the fixed expiration duration. Let `create_access_token` handle the expiration.
        print(f"User login for {email} successful.")
        access_token = auth_svc.create_access_token(
            data={
                "sub": user.email
            }  # expires_delta is omitted or set to None explicitly
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
        response_model=Sequence[AccommodationLogSummary],
        tags=["accommodation_logs"],
    )
    async def get_all_accommodation_logs(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[AccommodationLogSummary] | JSONResponse:
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_accommodation_logs()

    @app.get(
        "/v1/accommodation_logs/{log_id}",
        operation_id="get_accommodation_logs",
        response_model=AccommodationLogSummary,
        tags=["accommodation_logs"],
    )
    async def get_accommodation_log_by_id(
        log_id: UUID,
        current_user: User = Depends(get_current_user),
    ) -> AccommodationLogSummary | JSONResponse:
        """Get all AccommodationLog summaries."""
        accommodation_log_summary = await summary_svc.get_accommodation_logs_by_filters(
            {"id": log_id}
        )
        if accommodation_log_summary:
            return accommodation_log_summary[0]
        return JSONResponse(
            content={"message": "Accommodation log not found"},
            status_code=200,
        )

    @app.patch(
        "/v1/accommodation_logs",
        operation_id="post_accommodation_logs",
        tags=["accommodation_logs"],
    )
    async def post_accommodation_logs(
        accommodation_log_requests: list[PatchAccommodationLogRequest],
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a sequence of AccommodationLogs."""
        results = await travel_svc.process_accommodation_log_requests(
            accommodation_log_requests
        )
        return JSONResponse(content=results)

    @app.get(
        "/v1/related_entries",
        operation_id="get_related_entries",
        tags=["accommodation_logs"],
    )
    async def get_related_entries(
        identifier: UUID,
        identifier_type: str,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        related_records = await summary_svc.get_related_records_summary(
            identifier, identifier_type
        )
        return JSONResponse(content=related_records)

    @app.get("/v1/overlaps", tags=["accommodation_logs"])
    async def get_overlaps(
        start_date: date = datetime.strptime("2017-01-01", "%Y-%m-%d").date(),
        end_date: date = datetime.strptime("2028-01-01", "%Y-%m-%d").date(),
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        overlaps = await summary_svc.get_overlaps(start_date, end_date)
        return JSONResponse(content=overlaps)

    @app.delete(
        "/v1/accommodation_logs/{log_id}",
        operation_id="delete_accommodation_log",
        tags=["accommodation_logs"],
    )
    async def delete_accommodation_log(
        log_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete an accommodation log by its ID."""
        is_deleted = await travel_svc.delete_accommodation_log(
            log_id, current_user.email
        )
        if not is_deleted:
            raise HTTPException(status_code=404, detail="Accommodation log not found")
        return JSONResponse(
            content={"message": "Accommodation log deleted successfully"},
            status_code=200,
        )

    @app.get(
        "/v1/properties",
        operation_id="get_properties",
        response_model=Sequence[PropertySummary],
        tags=["properties"],
    )
    async def get_all_properties(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[PropertySummary] | JSONResponse:
        """Get all AccommodationLog summaries."""
        return await summary_svc.get_all_properties()

    @app.patch(
        "/v1/properties",
        operation_id="post_properties",
        tags=["properties"],
    )
    async def post_properties(
        property_data: PatchPropertyRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Property."""
        results = await travel_svc.process_property_request(property_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/properties/{property_id}",
        operation_id="delete_properties",
        tags=["properties"],
    )
    async def delete_property(
        property_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete a property by its ID."""
        result = await travel_svc.delete_property(property_id, current_user.email)
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete property due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Property deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (property not found)
        else:
            raise HTTPException(status_code=404, detail="Property not found")

    @app.get(
        "/v1/property_details",
        operation_id="get_property_details",
        response_model=Sequence[PropertyDetailSummary],
        tags=["properties"],
    )
    async def get_all_property_details(
        entered_only: bool = True,
        current_user: User = Depends(get_current_user),
    ) -> Sequence[PropertyDetailSummary] | JSONResponse:
        """Get all PropertyDetail summaries."""
        return await summary_svc.get_all_property_details(entered_only)

    @app.get(
        "/v1/property_details/{property_id}",
        operation_id="get_property_details_by_id",
        response_model=PropertyDetailSummary,
        tags=["properties"],
    )
    async def get_property_details_by_id(
        property_id: UUID,
        current_user: User = Depends(get_current_user),
    ) -> PropertyDetailSummary | None:
        """Get all PropertyDetail summaries."""
        return await summary_svc.get_property_details_by_id(property_id)

    @app.patch(
        "/v1/property_details",
        operation_id="post_property",
        tags=["properties"],
    )
    async def post_property(
        property_detail_data: PatchPropertyDetailRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Property."""
        results = await travel_svc.process_property_detail_request(property_detail_data)
        return JSONResponse(content=results)

    @app.get(
        "/v1/countries",
        operation_id="get_countries",
        response_model=Sequence[CountrySummary],
        tags=["countries"],
    )
    async def get_all_countries(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[CountrySummary] | JSONResponse:
        """Get all Country models."""
        return await summary_svc.get_all_countries()

    @app.patch(
        "/v1/countries",
        operation_id="post_countries",
        tags=["countries"],
    )
    async def post_countries(
        country_data: PatchCountryRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Country."""
        results = await travel_svc.process_country_request(country_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/countries/{country_id}",
        operation_id="delete_country",
        tags=["countries"],
    )
    async def delete_country(
        country_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete a country by its ID."""
        result = await travel_svc.delete_country(country_id, current_user.email)
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete country due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Country deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (property not found)
        else:
            raise HTTPException(status_code=404, detail="Consultant not found")

    @app.get(
        "/v1/core_destinations",
        operation_id="get_core_destinations",
        response_model=Sequence[CoreDestination],
        tags=["core_destinations"],
    )
    async def get_core_destinations(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[CoreDestination] | JSONResponse:
        """Get all CoreDestination models."""
        return await travel_svc.get_all_core_destinations()

    @app.patch(
        "/v1/core_destinations",
        operation_id="post_core_destinations",
        tags=["core_destinations"],
    )
    async def post_core_destinations(
        core_dest_data: PatchCoreDestinationRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a CoreDestination."""
        results = await travel_svc.process_core_destination_request(core_dest_data)
        return JSONResponse(content=results)

    @app.get(
        "/v1/consultants",
        operation_id="get_consultants",
        response_model=Sequence[Consultant],
        tags=["consultants"],
    )
    async def get_all_consultants(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[Consultant] | JSONResponse:
        """Get all Country models."""
        return await travel_svc.get_all_consultants()

    @app.patch(
        "/v1/consultants",
        operation_id="post_consultants",
        tags=["consultants"],
    )
    async def post_consultants(
        consultant_data: PatchConsultantRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Property."""
        results = await travel_svc.process_consultant_request(consultant_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/consultants/{consultant_id}",
        operation_id="delete_consultant",
        tags=["consultants"],
    )
    async def delete_consultant(
        consultant_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete a consultant by its ID."""
        result = await travel_svc.delete_consultant(consultant_id, current_user.email)
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete consultant due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Consultant deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (property not found)
        else:
            raise HTTPException(status_code=404, detail="Consultant not found")

    @app.get(
        "/v1/booking_channels",
        operation_id="get_booking_channels",
        response_model=Sequence[BookingChannelSummary],
        tags=["booking_channels"],
    )
    async def get_all_booking_channels(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[BookingChannelSummary] | JSONResponse:
        """Get all BookingChannel models."""
        return await summary_svc.get_all_booking_channels()

    @app.patch(
        "/v1/booking_channels",
        operation_id="post_booking_channels",
        tags=["booking_channels"],
    )
    async def post_booking_channels(
        booking_channel_data: PatchBookingChannelRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit an BookingChannel."""
        results = await travel_svc.process_booking_channel_request(booking_channel_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/booking_channels/{booking_channel_id}",
        operation_id="delete_booking_channel",
        tags=["booking_channels"],
    )
    async def delete_booking_channel(
        booking_channel_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete a booking channel by its ID."""
        result = await travel_svc.delete_booking_channel(
            booking_channel_id, current_user.email
        )
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete booking channel due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Booking channel deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (property not found)
        else:
            raise HTTPException(status_code=404, detail="Booking channel not found")

    @app.get(
        "/v1/agencies",
        operation_id="get_agencies",
        response_model=Sequence[AgencySummary],
        tags=["agencies"],
    )
    async def get_all_agencies(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[AgencySummary] | JSONResponse:
        """Get all Agency models."""
        return await summary_svc.get_all_agencies()

    @app.patch(
        "/v1/agencies",
        operation_id="post_agencies",
        tags=["agencies"],
    )
    async def post_agencies(
        agency_data: PatchAgencyRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit an Agency."""
        results = await travel_svc.process_agency_request(agency_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/agencies/{agency_id}",
        operation_id="delete_agency",
        tags=["agencies"],
    )
    async def delete_agency(
        agency_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete an agency by its ID."""
        result = await travel_svc.delete_agency(agency_id, current_user.email)
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete agency due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Agency deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (property not found)
        else:
            raise HTTPException(status_code=404, detail="Agency not found")

    @app.get(
        "/v1/portfolios",
        operation_id="get_portfolios",
        response_model=Sequence[PortfolioSummary],
        tags=["portfolios"],
    )
    async def get_all_portfolios(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[PortfolioSummary] | JSONResponse:
        """Get all Portfolio models."""
        return await summary_svc.get_all_portfolios()

    @app.patch(
        "/v1/portfolios",
        operation_id="post_portfolios",
        tags=["portfolios"],
    )
    async def post_portfolios(
        portfolio_data: PatchPortfolioRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Portfolio."""
        results = await travel_svc.process_portfolio_request(portfolio_data)
        return JSONResponse(content=results)

    @app.get(
        "/v1/trip_reports/{trip_report_id}",
        operation_id="get_trip_report",
        tags=["reviews"],
        response_model=TripReportSummary,
    )
    async def get_trip_report(
        trip_report_id: UUID,
        current_user: User = Depends(get_current_user),
    ) -> TripReportSummary | JSONResponse:
        """Get a TripReport by its ID."""
        results = await review_svc.get_trip_report(trip_report_id)
        if results:
            return results
        return JSONResponse(content={}, status_code=404)

    @app.get(
        "/v1/trip_reports",
        operation_id="get_all_trip_reports",
        tags=["reviews"],
        response_model=Sequence[TripReportSummary],
    )
    async def get_all_trip_reports(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[TripReportSummary] | JSONResponse:
        """Get all Agency models."""
        results = await review_svc.get_all_trip_reports()
        if results:
            return JSONResponse(content=jsonable_encoder(results))
        return JSONResponse(content={}, status_code=404)

    @app.patch(
        "/v1/trip_reports",
        operation_id="patch_trip_report",
        tags=["reviews"],
    )
    async def patch_trip_report(
        trip_report_data: PatchTripReportRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a TripReport."""
        results = await review_svc.process_trip_report_request(trip_report_data)
        return JSONResponse(content=results)

    @app.get(
        "/v1/admin_comments",
        operation_id="get_all_admin_comments",
        tags=["admin"],
        response_model=Sequence[AdminComment],
    )
    async def get_all_admin_comments(
        current_user: User = Depends(get_current_user),
        comment_id: Optional[UUID] = None,
    ) -> Sequence[AdminComment] | JSONResponse:
        """Get all Agency models."""
        results = await admin_svc.get_summaries()
        if results:
            return JSONResponse(content=jsonable_encoder(results))
        return JSONResponse(content={}, status_code=404)

    @app.delete(
        "/v1/portfolios/{portfolio_id}",
        operation_id="delete_portfolio",
        tags=["portfolios"],
    )
    async def delete_portfolio(
        portfolio_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete a booking channel by its ID."""
        result = await travel_svc.delete_portfolio(portfolio_id, current_user.email)
        # Check if the result is a dictionary indicating an error
        if isinstance(result, dict):
            # Extract error details from the result dictionary
            error_detail = result.get(
                "error", "Cannot delete portfolio due to related records."
            )
            affected_logs = result.get("details", [])
            return JSONResponse(
                content={"error": error_detail, "affected_logs": affected_logs},
                status_code=400,  # or another appropriate status code
            )

        # Check if the deletion was successful
        elif result:
            return JSONResponse(
                content={"message": "Portfolio deleted successfully"},
                status_code=200,
            )

        # If the deletion failed (portfolio not found)
        else:
            raise HTTPException(status_code=404, detail="Portfolio not found")

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
        print("Query Params in API call:")
        print(query_params)

        property_names = query_params.get("property_names", "")
        if property_names:
            query_params["property_names"] = property_names.split("|")
        property_location = query_params.get("property_location", "")
        if property_location:
            query_params["property_location"] = property_location.split("|")
        # Similar parsing for other array-like parameters if necessary
        report_data = await summary_svc.get_bed_night_report(query_params)
        return report_data

    @app.get(
        "/v1/export_bed_night_report",
        operation_id="export_bed_night_report",
        response_class=StreamingResponse,  # Specify the type of response you expect to send
        response_model=None,
        tags=["bed_night_report"],
    )
    async def export_bed_night_report(
        request: Request,
        current_user: User = Depends(get_current_user),
    ) -> StreamingResponse | HTTPException:
        """Exports an excel file of a bed night report."""
        query_params = dict(request.query_params)
        print("Query Params in API call:")
        print(query_params)

        # Handling exclusion columns; expects a comma-separated string of column names
        exclude_columns_string = query_params.pop("exclude_columns", None)
        exclude_columns = (
            exclude_columns_string.split(",") if exclude_columns_string else None
        )

        property_names = query_params.get("property_names", "")
        if property_names:
            query_params["property_names"] = property_names.split("|")

        try:
            excel_stream = await summary_svc.generate_excel_file(
                labels=query_params,
                exclude_columns=exclude_columns,
                report_title=query_params["report_title"],
            )
            headers = {
                "Content-Disposition": 'attachment; filename="accommodation_logs_report.xlsx"'
            }
            return StreamingResponse(
                excel_stream,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers=headers,
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @app.get(
        "/v1/export_custom_report",
        operation_id="export_custom_report",
        response_class=StreamingResponse,  # Specify the type of response you expect to send
        response_model=None,
        tags=["bed_night_report"],
    )
    async def export_custom_report(
        request: Request,
        current_user: User = Depends(get_current_user),
    ) -> StreamingResponse | HTTPException:
        query_params = dict(request.query_params)
        print("Query Params in API call:")
        print(query_params)

        property_names = query_params.get("property_names", "")
        if property_names:
            query_params["property_names"] = property_names.split("|")

        try:
            excel_stream = await summary_svc.generate_custom_excel_file(
                query_params=query_params, report_title=query_params["report_title"]
            )
            headers = {
                "Content-Disposition": 'attachment; filename="accommodation_logs_report.xlsx"'
            }
            return StreamingResponse(
                excel_stream,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers=headers,
            )
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @app.get(
        "/v1/audit_logs",
        operation_id="get_audit_logs",
        response_model=Iterable[AuditLog],
        tags=["audit_logs"],
    )
    async def get_audit_logs(
        current_user: User = Depends(get_current_user),
        table_name: Optional[str] = None,
        record_id: Optional[str] = None,
        time_filter: Optional[datetime] = Query(default=None),
    ) -> Iterable[AuditLog] | JSONResponse:
        """Get all AccommodationLog summaries."""
        if not time_filter and not (table_name and record_id):
            time_filter = datetime.now() - timedelta(days=7)
        return await audit_svc.get_audit_logs(time_filter, table_name, record_id)

    @app.get(
        "/v1/potential_trips",
        operation_id="find_potential_trips",
        response_model=Iterable[PotentialTrip],
        tags=["trips"],
    )
    async def find_potential_trips(
        current_user: User = Depends(get_current_user),
    ) -> Iterable[PotentialTrip]:
        return await quality_svc.find_potential_trips()

    @app.post(
        "/v1/related_trips",
        operation_id="get_related_trips",
        response_model=Iterable[Union[PotentialTrip, TripSummary]],
        tags=["trips"],
    )
    async def get_related_trips(
        request: Request,
        current_user: User = Depends(get_current_user),
    ) -> Iterable[Union[PotentialTrip, TripSummary]]:
        try:
            trip_data = await request.json()
            trip = PotentialTrip(**trip_data)
            return await quality_svc.get_related_trips(trip)
        except Exception as e:
            print(f"Error processing request: {e}")
            raise HTTPException(status_code=422, detail=str(e))

    @app.get(
        "/v1/trips",
        operation_id="get_all_trips",
        response_model=Iterable[TripSummary],
        tags=["trips"],
    )
    async def get_all_trips(
        current_user: User = Depends(get_current_user),
    ) -> Iterable[TripSummary]:
        return await summary_svc.get_all_trips()

    @app.patch(
        "/v1/confirm_trip",
        operation_id="post_trips",
        tags=["trips"],
    )
    async def post_trips(
        trip_data: PatchTripRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Add or edit a Trip."""
        results = await quality_svc.confirm_trip(trip_data)
        return JSONResponse(content=results)

    @app.delete(
        "/v1/trips/{trip_id}",
        operation_id="delete_trip",
        tags=["trips"],
    )
    async def delete_trip(
        trip_id: UUID, current_user: User = Depends(get_current_user)
    ) -> JSONResponse:
        """Delete an accommodation log by its ID."""
        is_deleted = await travel_svc.delete_trip(trip_id, current_user.email)
        if not is_deleted:
            raise HTTPException(status_code=404, detail="Trip not found")
        return JSONResponse(
            content={"message": "Trip deleted successfully"},
            status_code=200,
        )

    @app.patch(
        "/v1/flag_trip",
        operation_id="flag_trip",
        tags=["trips"],
    )
    async def flag_trip(
        trip_data: PatchTripRequest,
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        """Flag a Trip."""
        results = await quality_svc.flag_trip(trip_data)
        return JSONResponse(content=results)

    @app.get(
        "/v1/progress",
        operation_id="get_progress",
        response_model=MatchingProgress,
        tags=["trips"],
    )
    async def get_progress(
        current_user: User = Depends(get_current_user),
    ):
        progress = await quality_svc.get_progress()
        if progress is None:
            raise HTTPException(status_code=404, detail="Report data not found")
        return progress

    @app.get(
        "/v1/users",
        operation_id="get_users",
        response_model=Sequence[UserSummary],
        tags=["users"],
    )
    async def get_all_users(
        current_user: User = Depends(get_current_user),
    ) -> Sequence[UserSummary] | JSONResponse:
        """Get all Country models."""
        return await auth_svc.get_all_users()

    @app.get(
        "/v1/daily_rates",
        operation_id="get_daily_rates",
        response_model=Iterable[DailyRate],
        tags=["daily_rates"],
    )
    async def get_daily_rates(
        rate_date: date,
        current_user: User = Depends(get_current_user),
    ):
        daily_rates = await currency_svc.get_rates_date(rate_date)
        if daily_rates is None:
            raise HTTPException(status_code=404, detail="Daily Rate data not found")
        return daily_rates

    @app.patch(
        "/v1/daily_rates",
        operation_id="post_daily_rates",
        tags=["daily_rates"],
    )
    async def post_daily_rates(
        daily_rate_requests: list[PatchDailyRateRequest],
        current_user: User = Depends(get_current_user),
    ) -> JSONResponse:
        results = await currency_svc.process_daily_rate_requests(daily_rate_requests)
        return JSONResponse(content=results)

    return app


if __name__ == "__main__":
    import uvicorn

    travel_svc = TravelService()
    summary_svc = SummaryService()
    auth_svc = AuthService()
    audit_svc = AuditService()
    review_svc = ReviewService()
    quality_svc = QualityService()
    admin_svc = AdminService()
    currency_svc = CurrencyService()

    app = make_app(
        travel_svc,
        summary_svc,
        auth_svc,
        audit_svc,
        quality_svc,
        admin_svc,
        currency_svc,
    )

    uvicorn.run(app, host="0.0.0.0", port=9900)

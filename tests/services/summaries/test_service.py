import pytest
import pytest_asyncio
import pandas as pd
from api.services.travel.service import SummaryService
from io import BytesIO
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter


@pytest.fixture
def sample_bed_night_report_dataframe():
    """
    Fixture to create a sample DataFrame including individual bed night entries for testing.
    """
    data = {
        "Primary Traveler": [
            "Test1/Test1",
            "Test2/Test2",
            "Test3/Test3",
            "Test4/Test4",
            "Test5/Test5",
        ],
        "Date In": [
            "2024-05-24",
            "2024-06-24",
            "2024-07-24",
            "2024-08-24",
            "2024-09-24",
        ],
        "Date In": [
            "2024-05-27",
            "2024-06-27",
            "2024-07-27",
            "2024-08-27",
            "2024-09-27",
        ],
        "# Pax": [2, 2, 4, 8, 8],
        "Bed Nights": [6, 6, 12, 24, 24],
        "Property": [
            "Lodge1",
            "Lodge2",
            "Lodge3",
            "Lodge4",
            "Lodge5",
        ],
        "Property Portfolio": [
            "Portfolio1",
            "Portfolio2",
            "Portfolio3",
            "Portfolio4",
            "Portfolio5",
        ],
        "Core Destination Name": [
            "Africa",
            "Africa",
            "Africa",
            "Africa",
            "Africa",
        ],
        "Country": [
            "Botswana",
            "Botswana",
            "Botswana",
            "Botswana",
            "Botswana",
        ],
        "Agency": [
            "Agency1",
            "Agency2",
            "Agency3",
            "Agency4",
            "Agency5",
        ],
        "Booking Channel": [
            "BC1",
            "BC2",
            "BC3",
            "BC4",
            "BC5",
        ],
        "Consultant": [
            "Consultant1",
            "Consultant2",
            "Consultant3",
            "Consultant4",
            "Consultant5",
        ],
    }
    df = pd.DataFrame(data)
    return df


@pytest.fixture
def sample_custom_report_property_yearly_dataframe():
    """
    Fixture to create a sample DataFrame including aggregated report results for testing.
    Property granularity: `property_name`
    Time granularity: `year`
    """
    data = {
        "Property": ["Hotel A", "Hotel B", "Hotel C", "Hotel D", "Hotel E"],
        "2024": [0, 2, 3, 8, 2],
        "2025": [1, 3, 4, 5, 6],
        "2026": [2, 4, 5, 6, 7],
    }
    df = pd.DataFrame(data)
    return df


@pytest_asyncio.fixture
async def summary_service():
    """
    Fixture to instantiate the ReportGenerator class.
    """
    return SummaryService()


@pytest.mark.asyncio
async def sample_custom_excel_property_yearly_dataframe(
    sample_custom_report_property_yearly_dataframe, summary_service
):
    # Call the write_excel function with include_total_column=True
    excel_stream = await summary_service.write_excel(
        df=sample_custom_report_property_yearly_dataframe,
        report_title="Aggregated Report",
        include_total_column=True,
    )

    # Load the workbook from the BytesIO stream
    wb = load_workbook(filename=BytesIO(excel_stream.getvalue()))
    sheet = wb.active
    assert sheet is not None, "No sheet resulted from the write_excel function"

    # Define expected row numbers
    header_row = 3
    data_start_row = 4
    data_end_row = (
        data_start_row + len(sample_custom_report_property_yearly_dataframe) - 1
    )
    total_row = data_end_row + 1

    # ----------------------------
    # 1. Validate Headers
    # ----------------------------

    # Column A: PROPERTY

    header_property = sheet.cell(row=header_row, column=1)
    assert (
        header_property.value == "PROPERTY"
    ), "Header in column A should be 'PROPERTY'"
    assert (
        header_property.number_format == "General"
    ), "PROPERTY header should have 'General' number format"
    assert (
        header_property.alignment.horizontal == "left"
    ), "PROPERTY header should be left-aligned"

    # Column B, C, D: 2024, 2025, 2026 (Numeric Header)
    for i in range(2, 4):
        header_cell = sheet.cell(row=header_row, column=i)
        assert (
            header_cell.value == 0
        ), f"Header {i} should be stored as a number, not text."
        assert isinstance(header_cell.value, int), f"Header {i} should be an integer."
        assert (
            header_cell.number_format == "0"
        ), f"Header {i} should have '0' number format"
        assert (
            header_cell.alignment.horizontal == "center"
        ), f"Header {i} should be center-aligned"

    # Column E: TOTAL
    header_total = sheet.cell(row=header_row, column=5)
    assert header_total.value == "TOTAL", "Header in column E should be 'TOTAL'"
    assert (
        header_total.number_format == "General"
    ), "TOTAL header should have 'General' number format"
    assert (
        header_total.alignment.horizontal == "center"
    ), "TOTAL header should be center-aligned"

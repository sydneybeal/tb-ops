import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import BedNightTable from '../AccommodationLogs/BedNightTable';
import { useAuth } from '../../components/AuthContext';

const ReportPreviewModal = ({ queryString, reportData, filteredData, onClose, isOpen }) => {
    const { userDetails } = useAuth();
    const [reportType, setReportType] = useState('bed_nights');
    const [reportTypeEndpoint, setReportTypeEndpoint] = useState('');
    const [timeGranularity, setTimeGranularity] = useState('year');
    const [propertyGranularity, setPropertyGranularity] = useState('property_name');
    const [calculationType, setCalculationType] = useState('bed_nights');
    const [maxEntries, setMaxEntries] = useState(10);
    const [excludeFields, setExcludeFields] = useState(["booking_channel_name"]);
    const [fileNamePrefix, setFileNamePrefix] = useState("Report");
    const [reportTitle, setReportTitle] = useState("Report");
    const [combinedQueryString, setCombinedQueryString] = useState('');

    const defaultFields = {
        primary_traveler: { name: "Primary Traveler Name", canExclude: true },
        core_destination_name: { name: "Core Destination", canExclude: true },
        date_in: { name: "Date In", canExclude: false },
        country_name: { name: "Country", canExclude: true },
        date_out: { name: "Date Out", canExclude: false },
        agency_name: { name: "Agency Name", canExclude: true },
        num_pax: { name: "# Pax", canExclude: false },
        property_portfolio: { name: "Property Portfolio", canExclude: true },
        bed_nights: { name: "Bed Nights", canExclude: false },
        booking_channel_name: { name: "Booking Channel", canExclude: true },
        property_name: { name: "Property Name", canExclude: true },
        consultant_name: { name: "Consultant Name", canExclude: true },
    };

    useEffect(() => {
        const endpoint = reportType === 'bed_nights' ? 'export_bed_night_report' : 'export_custom_report';
        setReportTypeEndpoint(endpoint);
    }, [reportType]);

    useEffect(() => {
        let newQueryString = `${reportTypeEndpoint}${queryString}`;

        if (reportType === 'bed_nights' && excludeFields.length > 0) {
            const excludeString = excludeFields.join(',');
            const encodedExcludeString = encodeURIComponent(excludeString);
            const separator = queryString.includes('?') ? '&' : '?';

            newQueryString += `${separator}exclude_columns=${encodedExcludeString}&report_title=${encodeURIComponent(reportTitle)}`;
        }

        if (reportType === 'custom') {
            const params = [];

            // Check and append calculationType if it has a value
            if (calculationType) {
                params.push(`calculation_type=${encodeURIComponent(calculationType)}`);
            }

            // Check and append propertyGranularity if it has a value
            if (propertyGranularity) {
                params.push(`property_granularity=${encodeURIComponent(propertyGranularity)}`);
            }

            if (reportTitle) {
                params.push(`report_title=${encodeURIComponent(reportTitle)}`);
            }

            // Check and append timeGranularity if it has a value
            if (timeGranularity) {
                params.push(`time_granularity=${encodeURIComponent(timeGranularity)}`);
            }

            // Build the part of the query string with these parameters
            if (params.length > 0) {
                const prefix = queryString.includes('?') ? '&' : '?';
                newQueryString += prefix + params.join('&');
            }
        }


        setCombinedQueryString(newQueryString);
    }, [excludeFields, queryString, reportTypeEndpoint, reportType, timeGranularity, propertyGranularity, calculationType, reportTitle]);


    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose();
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('add-log-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen) return;
    }, [isOpen, onClose]);

    useEffect(() => {
        const elems = document.querySelectorAll('select');
        M.FormSelect.init(elems);

        return () => {
            elems.forEach(el => {
                const instance = M.FormSelect.getInstance(el);
                if (instance) {
                    instance.destroy();
                }
            });
        };
    }, [reportType]);

    // useEffect(() => {
    //     // Convert array to comma-separated string only if excludeFields is not empty
    //     const excludeString = excludeFields.length > 0 ? excludeFields.join(',') : '';
    //     const encodedExcludeString = encodeURIComponent(excludeString);

    //     // Build the combined query string conditionally based on whether there are excludeFields
    //     let newCombinedQueryString = `${reportTypeEndpoint}${queryString}`;
    //     if (excludeString) {
    //         const separator = queryString.includes('?') ? '&' : '?';
    //         newCombinedQueryString += `${separator}exclude_columns=${encodedExcludeString}`;
    //     }

    //     setCombinedQueryString(newCombinedQueryString);  // Update the combined query string state
    // }, [excludeFields, queryString, reportTypeEndpoint]);

    // useEffect(() => {
    //     if (reportType === 'bed_nights') {
    //         setReportTypeEndpoint('export_bed_night_report');
    //     } else if (reportType === 'custom') {
    //         setReportTypeEndpoint('export_custom_report');
    //     };
    // }, [reportType]);


    const toggleField = field => {
        const currentIndex = excludeFields.indexOf(field);
        const newExcludedFields = [...excludeFields];

        if (currentIndex === -1) {
            newExcludedFields.push(field);
        } else {
            newExcludedFields.splice(currentIndex, 1);
        }

        setExcludeFields(newExcludedFields);
    };

    const handleDownloadExcel = async () => {
        M.toast({
            html: 'Downloading Excel report...',
            displayLength: 2000,
            classes: 'warning-yellow tb-md-black-text',
        });

        const apiUrl = `${process.env.REACT_APP_API}/v1/${combinedQueryString}`;

        // Make the request to the server
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(response => {
                // Check if the response is successful
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob(); // Convert the response to a Blob
            })
            .then(blob => {
                // Create a URL from the Blob
                const url = window.URL.createObjectURL(blob);
                // Create a temporary anchor element
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileNamePrefix}.xlsx`; // Set the file name for download
                document.body.appendChild(a); // Append the anchor to the body
                a.click(); // Programmatically click the anchor to trigger the download
                a.remove(); // Remove the anchor from the body
                window.URL.revokeObjectURL(url); // Clean up the URL object
            })
            .catch(error => {
                console.error('Error downloading the file:', error);
                M.toast({
                    html: 'Error downloading the file. Please try again.',
                    displayLength: 2000,
                    classes: 'error-red',
                });
            });
    };

    return (
        <div id="add-log-modal" className="modal download-report-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000', paddingBottom: '100px' }}>
                <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                    <h4>Report Generator</h4>
                </div>
                <div className="row" style={{ marginTop: '30px', width: '90%', marginBottom: '0px' }}>
                    <div className="col s12 m6">
                        <div className="input-field col s12 l8 offset-l2">
                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                titlecase
                            </span>
                            <input
                                type="text"
                                id="file-name"
                                placeholder="Report Title"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                className="search-input" // Apply any styling as needed
                            />
                            <span
                                className="grey-text text-darken-1"
                            // style={{ position: 'absolute', right: 0, top: 10, marginRight: '5px' }}
                            >
                                Report Title
                            </span>
                        </div>
                    </div>
                    <div className="col s12 m6">
                        <div className="input-field col s12 l8 offset-l2">
                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                description
                            </span>
                            <input
                                type="text"
                                id="search-query"
                                placeholder="File name"
                                value={fileNamePrefix}
                                onChange={(e) => setFileNamePrefix(e.target.value)}
                                className="search-input" // Apply any styling as needed
                            />
                            <span
                                className="grey-text text-darken-1"
                                style={{ fontSize: '1.4rem', position: 'absolute', right: 0, top: 10, marginRight: '10px' }}
                            >
                                .xlsx
                            </span>
                            <span
                                className="grey-text text-darken-1"
                            >
                                File Name
                            </span>
                        </div>
                    </div>
                </div>

                <div className="row" style={{ marginBottom: '30px' }}>
                    <button className="btn error-red" style={{ marginLeft: '30px' }} onClick={onClose}>Close</button>
                    <button className="btn tb-teal darken-2" style={{ marginLeft: '50px' }} onClick={handleDownloadExcel}>Download</button>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <div className="row report-toggles">
                        <span style={{ marginLeft: '20px', display: 'inline-block', width: '300px' }}>
                            <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.5rem', fontWeight: 'bold' }}>Report Type</label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                style={{ textAlign: 'center' }}
                            >
                                <option value={'bed_nights'}>Bed Nights</option>
                                <option value={'custom'}>Custom</option>
                                {/* <option value="all">All</option> // TODO get all to work in BedNightTable */}
                            </select>
                        </span>
                    </div>
                </div>
                {reportType === 'bed_nights' ? (
                    <>
                        <h5 style={{ marginBottom: '30px', marginTop: '50px' }}>Field Selection</h5>
                        <div className="row report-checkbox-columns" style={{ marginTop: '30px', marginBottom: '40px', width: '60%' }}>
                            {Object.entries(defaultFields).map(([field, details], index) => (
                                <div className="report-checkbox-column" key={field}>
                                    <p>
                                        <label className={!details.canExclude ? "disabled-label" : ""}>
                                            <input
                                                type="checkbox"
                                                className={!details.canExclude ? "filled-in" : ""}
                                                checked={!excludeFields.includes(field)}
                                                disabled={!details.canExclude}
                                                onChange={() => toggleField(field)}
                                            />
                                            <span>{details.name}</span>
                                        </label>
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="container">
                            {/* <ReportDashboard reportData={reportData} id="reportData" showPieCharts={showPieCharts} showMonthly={showMonthly} maxProps={maxProps} />
                        <br /> */}
                            <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                                <h5>Report Bed Nights Preview</h5>
                                <em>
                                    <span className="text-bold tb-teal-text">{filteredData.length}</span> total results,
                                    {filteredData.length > maxEntries ? (
                                        <span className="text-bold tb-teal-text"> {maxEntries}</span>
                                    ) : (
                                        <span className="text-bold tb-teal-text"> {filteredData.length}</span>
                                    )} sample records below.
                                </em>
                            </div>
                            <div className="row report-toggles">
                                <span style={{ marginLeft: '20px', display: 'inline-block', width: '100px' }}>
                                    <label className="tb-grey-text text-darken-5" style={{ marginRight: '10px', paddingBottom: '0px' }}>Max # Results</label>
                                    <select
                                        value={maxEntries}
                                        onChange={(e) => setMaxEntries(e.target.value)}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={100}>100</option>
                                        <option value={200}>200</option>
                                        {/* <option value="all">All</option> // TODO get all to work in BedNightTable */}
                                    </select>
                                </span>
                            </div>

                            <BedNightTable
                                filteredData={filteredData}
                                isEditable={false}
                                pageSize={maxEntries}
                                id="bedNightTable"
                                forReport={true}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <h5 style={{ marginBottom: '30px', marginTop: '50px' }}>Report Selection</h5>
                        <div className="row report-toggles report-radio-columns">
                            {/* <div className="col s4">
                                <span style={{ marginLeft: '20px', display: 'inline-block', width: '200px' }}>
                                    <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.2rem', fontWeight: 'bold' }}>Time Granularity</label>
                                    <select
                                        value={timeGranularity}
                                        onChange={(e) => setTimeGranularity(e.target.value)}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <option value={'year'}>By Year</option>
                                        <option value={'month'}>By Month</option>
                                    </select>
                                </span>
                            </div> */}
                            <div className="col s4">
                                <span style={{ marginLeft: '20px', display: 'inline-block' }}>
                                    <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.2rem', fontWeight: 'bold' }}>Time Granularity</label>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="timeGranularity" type="radio" value="year"
                                                onChange={(e) => setTimeGranularity(e.target.value)}
                                                checked={timeGranularity === 'year'} />
                                            <span>By Year</span>
                                        </label>
                                    </p>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="timeGranularity" type="radio" value="month"
                                                onChange={(e) => setTimeGranularity(e.target.value)}
                                                checked={timeGranularity === 'month'} />
                                            <span>By Month</span>
                                        </label>
                                    </p>
                                </span>
                            </div>
                            <div className="col s4">
                                <span style={{ marginLeft: '20px', display: 'inline-block' }}>
                                    <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.2rem', fontWeight: 'bold' }}>Property Granularity</label>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="propertyGranularity" type="radio" value="property_name"
                                                onChange={(e) => setPropertyGranularity(e.target.value)}
                                                checked={propertyGranularity === 'property_name'} />
                                            <span>By Property</span>
                                        </label>
                                    </p>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="propertyGranularity" type="radio" value="property_portfolio"
                                                onChange={(e) => setPropertyGranularity(e.target.value)}
                                                checked={propertyGranularity === 'property_portfolio'} />
                                            <span>By Portfolio</span>
                                        </label>
                                    </p>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="propertyGranularity" type="radio" value="country_name"
                                                onChange={(e) => setPropertyGranularity(e.target.value)}
                                                checked={propertyGranularity === 'country_name'} />
                                            <span>By Country</span>
                                        </label>
                                    </p>
                                </span>
                            </div>
                            <div className="col s4">
                                <span style={{ marginLeft: '20px', display: 'inline-block' }}>
                                    <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.2rem', fontWeight: 'bold' }}>Calculation</label>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="calculationType" type="radio" value="bed_nights"
                                                onChange={(e) => setCalculationType(e.target.value)}
                                                checked={calculationType === 'bed_nights'} />
                                            <span>By Bed Nights</span>
                                        </label>
                                    </p>
                                    <p style={{ textAlign: 'left' }}>
                                        <label>
                                            <input name="calculationType" type="radio" value="num_bookings"
                                                onChange={(e) => setCalculationType(e.target.value)}
                                                checked={calculationType === 'num_bookings'} />
                                            <span>By Total # Bookings</span>
                                        </label>
                                    </p>
                                </span>
                            </div>
                            {/* <div className="col s4">
                                <span style={{ marginLeft: '20px', display: 'inline-block', width: '200px' }}>
                                    <label className="tb-teal-text text-darken-2" style={{ marginRight: '10px', paddingBottom: '0px', fontSize: '1.2rem', fontWeight: 'bold' }}>Property Granularity</label>
                                    <select
                                        value={propertyGranularity}
                                        onChange={(e) => setPropertyGranularity(e.target.value)}
                                        style={{ textAlign: 'center' }}
                                    >
                                        <option value={'property'}>By Property</option>
                                        <option value={'portfolio'}>By Portfolio</option>
                                        <option value={'country'}>By Country</option>
                                    </select>
                                </span>
                            </div> */}
                        </div>
                        <div className="row">
                            <h5 style={{ marginBottom: '30px' }}>Sample Report Format</h5>
                            <div className="container">
                                <table className="sample-report-table">
                                    <thead>
                                        <tr>
                                            <th colSpan="4" className="tb-teal tb-off-white-text">
                                                {reportTitle}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>

                                            </td>
                                            <td className="text-bold">
                                                {timeGranularity === "year" ? "2023" : "Jul 2024"}
                                            </td>
                                            <td className="text-bold">
                                                {timeGranularity === "year" ? "2024" : "Aug 2024"}
                                            </td>
                                            <td className="text-bold">
                                                {timeGranularity === "year" ? "2025" : "Sept 2024"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-bold">
                                                {propertyGranularity === "property_name" ? "Property"
                                                    : propertyGranularity === "property_portfolio" ? "Portfolio"
                                                        : "Country"
                                                } 1
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-bold">
                                                {propertyGranularity === "property_name" ? "Property"
                                                    : propertyGranularity === "property_portfolio" ? "Portfolio"
                                                        : "Country"
                                                } 2
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="text-bold">
                                                {propertyGranularity === "property_name" ? "Property"
                                                    : propertyGranularity === "property_portfolio" ? "Portfolio"
                                                        : "Country"
                                                } 3
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                            <td className="text-bold text-small tb-teal-text">
                                                {calculationType === "bed_nights" ? "# Bed Nights" : "# Bookings"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="4" className="tb-teal tb-off-white-text">
                                                Travel Beyond Confidential
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default ReportPreviewModal;

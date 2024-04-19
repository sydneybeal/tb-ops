import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import BedNightTable from '../AccommodationLogs/BedNightTable';
import { useAuth } from '../../components/AuthContext';

const ReportPreviewModal = ({ queryString, reportData, filteredData, onClose, isOpen }) => {
    const { userDetails } = useAuth();
    const [maxEntries, setMaxEntries] = useState(10);
    const [excludeFields, setExcludeFields] = useState(["booking_channel_name"]);
    const [fileNamePrefix, setFileNamePrefix] = useState("Bed Night Report");
    const [combinedQueryString, setCombinedQueryString] = useState(() => {
        const excludeString = excludeFields.join(','); // Convert array to comma-separated string
        const encodedExcludeString = encodeURIComponent(excludeString);
        const separator = queryString.includes('?') ? '&' : '?';
        return `${queryString}${separator}exclude_columns=${encodedExcludeString}`;
    });
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
        // Convert array to comma-separated string only if excludeFields is not empty
        const excludeString = excludeFields.length > 0 ? excludeFields.join(',') : '';
        const encodedExcludeString = encodeURIComponent(excludeString);
    
        // Build the combined query string conditionally based on whether there are excludeFields
        let newCombinedQueryString = queryString;
        if (excludeString) {
            const separator = queryString.includes('?') ? '&' : '?';
            newCombinedQueryString += `${separator}exclude_columns=${encodedExcludeString}`;
        }
        
        setCombinedQueryString(newCombinedQueryString);  // Update the combined query string state
    }, [excludeFields, queryString]);
    

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

        const apiUrl = `${process.env.REACT_APP_API}/v1/export_bed_night_report${combinedQueryString}`;
    
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
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                    <h5>Report Generator</h5>
                </div>
                <div className="row report-checkbox-columns" style={{ marginTop: '30px', marginBottom: '30px', width: '60%' }}>
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
                <div className="row" style={{ marginTop: '30px' }}>
                    API Query: <span className="code tb-grey-text" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>{combinedQueryString}</span>
                </div>
                <div className="row report-checkbox-columns" style={{ marginTop: '30px', marginBottom: '30px', width: '60%' }}>
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
                            style={{ position: 'absolute', right: 0, top: 10, marginRight: '5px' }}
                        >
                            .xlsx
                        </span>
                    </div>
                </div>
                
                <div className="row" style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <button className="btn error-red" style={{ marginRight: '20px' }} onClick={onClose}>Close</button>
                    <button className="btn tb-teal darken-2" style={{ marginLeft: '20px' }} onClick={handleDownloadExcel}>Download</button>
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
            </div>
        </div >
    );
};

export default ReportPreviewModal;

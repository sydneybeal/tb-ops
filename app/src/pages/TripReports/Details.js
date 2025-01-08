import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
// import AuditLogs from '../AuditLogs/AuditLogs';

const TripReportDetails = () => {
    const { userDetails, logout } = useAuth();
    const uniqueCountries = new Set();
    const navigate = useNavigate();
    const { trip_report_id } = useParams();
    const [tripReport, setTripReport] = useState({});

    const sortedProperties = tripReport.properties?.sort((a, b) => {
        const dateA = a.date_in ? new Date(a.date_in) : new Date(0); // Use epoch as fallback
        const dateB = b.date_in ? new Date(b.date_in) : new Date(0);
        return dateA - dateB;
    }) || [];

    const sortedActivities = tripReport.activities?.sort((a, b) => {
        const dateA = a.visit_date ? new Date(a.visit_date) : new Date(0); // Use epoch as fallback
        const dateB = b.visit_date ? new Date(b.visit_date) : new Date(0);
        return dateA - dateB;
    }) || [];

    if (sortedProperties && sortedProperties.length > 0) {
        sortedProperties.forEach(segment => {
            const countryName = segment.property_details?.country_name || segment.country_name;
            if (countryName) {
                uniqueCountries.add(countryName);
            }
        });
    }

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const fetchTripReport = useCallback(async (tripReportId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API}/v1/trip_reports/${tripReportId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
            });
            if (response.detail && response.detail === "Could not validate credentials") {
                // Session has expired or credentials are invalid
                M.toast({
                    html: 'Your session has timed out, please log in again.',
                    displayLength: 4000,
                    classes: 'error-red',
                });
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
            // const mappedData = mapApiToFormData(data);
            // setFormData(mappedData);
            setTripReport(data);
        } catch (error) {
            console.error('Error fetching trip report:', error);
            M.toast({
                html: 'Failed to load trip report.',
                displayLength: 4000,
                classes: 'error-red',
            });
        }
    }, [logout, userDetails.token]);

    useEffect(() => {
        if (trip_report_id) {
            fetchTripReport(trip_report_id);
        }
    }, [trip_report_id, fetchTripReport]);

    return (
        <>
            <header>
                <Navbar title={`Trip Report: ${tripReport.trip_name}`} />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '80%', paddingBottom: '100px' }}>
                    <div className="card potential-trip-card" style={{ marginTop: '20px', paddingTop: '10px'}}>
                        <div className="card-content">
                            <div className="center">
                                <h3>
                                    <span className="report-title">
                                        {tripReport.trip_name}
                                    </span>
                                </h3>
                            </div>
                            <div className="row center" style={{ margin: '50px 0px'}}>
                                <div className="col s3">
                                    <p className="text-bold">Travelers</p>
                                    {tripReport.travelers?.map(traveler => (
                                        <p
                                            key={`traveler-${tripReport.id}-${traveler.id}`}
                                            className="trip-report-summary-cell"
                                        >
                                            {traveler.email.split('@')[0]}
                                        </p>
                                    ))}
                                </div>
                                <div className="col s2">
                                    <p className="text-bold">Status</p>
                                    {tripReport.review_status === 'final' ? (
                                        <div
                                            className="chip success-green tb-off-white-text text-bold"
                                            style={{ marginRight: '0px'}}
                                        >
                                            PUBLISHED
                                        </div>
                                    ) : (
                                        <div
                                            className="chip tb-teal tb-off-white-text text-bold"
                                            style={{ marginRight: '0px'}}
                                        >
                                            DRAFT
                                        </div>
                                    )
                                    }
                                </div>
                                <div className="col s2">
                                    <p className="text-bold">Properties</p>
                                    <span className="text-bold" style={{ fontSize: '1.6rem'}}>
                                        {sortedProperties?.length || 0}
                                    </span>
                                </div>
                                <div className="col s2">
                                    <p className="text-bold">Activities</p>
                                    <span className="text-bold" style={{ fontSize: '1.6rem'}}>
                                        {sortedActivities?.length || 0}
                                    </span>
                                </div>
                                <div className="col s3">
                                    <p className="text-bold">Countries</p>
                                    {[...uniqueCountries].map(country => (
                                        <p
                                            key={`country-${country}`}
                                            className="trip-report-summary-cell"
                                        >
                                            {country}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            <div className="container" style={{ width: '90%'}}>
                                <h4 className="center report-title">Properties</h4>
                                {/* date_in, date_out, site_inspection_only, attribute_update_comment_id, attribute_updates_comments, travelers, property_id, ratings, comments, property_details */}
                                {/* property_details: property_id, name, core_destination_name, country_name, num_related, portfolio_name, portfolio_id, core_destination_id, country_id, property_type, price_range, location, latitude, longitude, num_tents, has_trackers, has_wifi_in_room, has_wifi_in_common_areas, has_hairdryers, has_pool, has_heated_pool, has_credit_card_tipping, is_child_friendly, is_handicap_accessible, created_at, updated_at, updated_by */}
                                {sortedProperties.map(property => (
                                    <div
                                        id={`property-${tripReport.id}-${property.id}`}
                                        className="row"
                                    >
                                        <p className="trip-report-display-header">
                                            {property.property_details?.name}
                                        </p>
                                        details coming soon
                                    </div>
                                ))}
                            </div>

                            <div className="container" style={{ width: '90%'}}>
                                <h4 className="center report-title">Activities</h4>
                                {/* name, visit_date, travelers, type, location, rating, comments */}
                                {sortedActivities.map((activity, index) => (
                                    <div
                                        id={`activity-${tripReport.id}-${index}`}
                                        className="row"
                                    >
                                        <p className="trip-report-display-header">
                                            {activity.name}
                                        </p>
                                        details coming soon
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export default TripReportDetails;

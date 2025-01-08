import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AuditLogs from '../AuditLogs/AuditLogs';

const AccommodationLogDetails = () => {
    const { log_id } = useParams();
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [auditData, setAuditData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [auditLoaded, setAuditLoaded] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs/${log_id}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token, log_id]);

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const simplifyDateRange = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startLocal = new Date(start.getTime() + (start.getTimezoneOffset() * 60000));
        const endLocal = new Date(end.getTime() + (end.getTimezoneOffset() * 60000));
    
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
        // Extracting parts of the dates
        const startDay = startLocal.getDate();
        const startMonth = monthNames[startLocal.getMonth()];
        const startYear = startLocal.getFullYear();
    
        const endDay = endLocal.getDate();
        const endMonth = monthNames[endLocal.getMonth()];
        const endYear = endLocal.getFullYear();
    
        // Formulating the date range string based on the differences
        if (startYear !== endYear) {
            // Different years: "Dec 29, 2025 - Jan 2, 2026"
            return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
        } else if (startMonth !== endMonth) {
            // Same year, different months: "March 31 - Apr 4, 2025"
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
        } else {
            // Same month and year: "Apr 8-11, 2025"
            return `${startMonth} ${startDay}-${endDay}, ${startYear}`;
        }
    };
    

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/audit_logs?table_name=accommodation_logs&record_id=${log_id}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                
                setAuditData(data);
                setAuditLoaded(true);
            })
            .catch((err) => {
                setAuditLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token, log_id]);

    return (
        <>
            <header>
                <Navbar title="Service Providers" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center accommodation-logs" style={{ width: '60%', paddingBottom: '100px' }}>
                    {!loaded ? (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    ) : (
                        apiData ? (
                            <div>
                                <h4>Entry Details</h4>
                                <div className="card potential-trip-card" style={{ marginTop: '20px', paddingTop: '10px'}}>
                                    <div className="card-content">
                                        <div className="row">
                                            <h5 className="text-bold">
                                                {apiData.primary_traveler} x{apiData.num_pax}
                                            </h5>
                                            <p className="tb-teal-text">
                                                {apiData.trip_name}
                                            </p>
                                        </div>
                                        <div className="row">
                                            {/* <div className="col s12 l3">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.primary_traveler}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        person
                                                    </span>
                                                    Primary Traveler
                                                </em>
                                            </div>
                                            <div className="col s12 l1">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.num_pax}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        group
                                                    </span>
                                                    Pax
                                                </em>
                                            </div> */}
                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.consultant_display_name}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        badge
                                                    </span>
                                                    Consultant
                                                </em>
                                            </div>
                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {!apiData.agency_name
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : apiData.agency_name}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        contact_mail
                                                    </span>
                                                    Agency
                                                </em>
                                            </div>

                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {!apiData.booking_channel_name
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : apiData.booking_channel_name}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        alt_route
                                                    </span>
                                                    Booking Channel
                                                </em>
                                            </div>
                                        </div>
                                        <hr
                                            style={{
                                                border: '1px solid #0e9bac',
                                                borderRadius: '1px',
                                                width: '80%',
                                                margin: '40px auto'
                                            }}
                                        />
                                        <div className="row">
                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.property_name}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        hotel
                                                    </span>
                                                    Property Name
                                                </em>
                                            </div>
                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {simplifyDateRange(apiData.date_in, apiData.date_out)}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        date_range
                                                    </span>
                                                    Dates
                                                </em>
                                            </div>
                                            <div className="col s12 l4">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.bed_nights}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        dark_mode
                                                    </span>
                                                    Bed Nights
                                                </em>
                                            </div>
                                        </div>
                                        <hr
                                            style={{
                                                border: '1px solid #0e9bac',
                                                // border: '0px',
                                                borderRadius: '1px',
                                                width: '80%',
                                                margin: '40px auto'
                                            }}
                                        />
                                        <div className="row" style={{ fontSize: '1.5rem'}}>
                                            <div className="col s12 l3">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {!apiData.property_portfolio
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : toTitleCase(apiData.property_portfolio)}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        hotel
                                                    </span>
                                                    Portfolio
                                                </em>
                                            </div>
                                            <div className="col s12 l3">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {!apiData.property_type
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : toTitleCase(apiData.property_type)}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        camping
                                                    </span>
                                                    Property Type
                                                </em>
                                            </div>
                                            <div className="col s12 l3">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.property_location && apiData.country_name ? (
                                                        <span>{toTitleCase(apiData.property_location)}, {toTitleCase(apiData.country_name)}</span>
                                                    ) : (
                                                        toTitleCase(apiData.property_location) || toTitleCase(apiData.country_name)
                                                    )}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        near_me
                                                    </span>
                                                    Property Location
                                                </em>
                                            </div>
                                            <div className="col s12 l3">
                                                <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                    {apiData.core_destination_name}
                                                </span>
                                                <br />
                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                    <span className="material-symbols-outlined">
                                                        globe
                                                    </span>
                                                    Core Destination
                                                </em>
                                            </div>
                                        </div>
                                        <br/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                Not found
                            </div>
                        )
                    )
                    }
                    {!auditLoaded ? (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    ) : (
                        Array.isArray(auditData) && auditData.length > 0 ? (
                            <div className="container" style={{ marginTop: '100px'}}>
                                <h5>Audit History</h5>
                                <>
                                    <AuditLogs auditLogs={auditData} />
                                </>
                            </div>
                        ) : (
                            <div>
                                No audit history.
                            </div>
                        )
                    )}
                </div>
            </main>
        </>
    );
};

export default AccommodationLogDetails;
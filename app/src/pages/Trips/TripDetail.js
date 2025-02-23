import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import CondensedSingleLogDisplay from '../AccommodationLogs/CondensedSingleLogDisplay';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const TripDetail = () => {
    const { trip_id } = useParams();
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState(null);
    const [displayData, setDisplayData] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/trips/${trip_id}`, {
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
    }, [logout, userDetails.token, trip_id]);

    const togglePassengerDisplay = (logIndex) => () => {
        // Toggle the flag for showing passengers for this log
        const updatedLogs = [...displayData.groupedAccommodationLogs];
        updatedLogs[logIndex].viewPassengerNames = !updatedLogs[logIndex].viewPassengerNames;
        setDisplayData({
            ...displayData,
            groupedAccommodationLogs: updatedLogs,
        });
    }

    useEffect(() => {
        const groupLogs = (logs) => {
            const grouped = {};
    
            logs.forEach(log => {
                const key = `${log.date_in} to ${log.date_out} - ${log.property_name}`;
    
                // If the key doesn't exist, initialize the group
                if (!grouped[key]) {
                    // Create a new group by copying all properties from the log object
                    grouped[key] = {
                        passengers: [],
                        totalNumPax: 0,
                        totalBedNights: 0
                    };

                    Object.assign(grouped[key], log);
                }
    
                // Add the passenger details to the group
                grouped[key].passengers.push(`${log.primary_traveler} x${log.num_pax}`);
                grouped[key].totalNumPax += log.num_pax;
                grouped[key].totalBedNights += log.num_pax * log.bed_nights;
            });

            const groupedLogsArray = Object.values(grouped);

            groupedLogsArray.sort((a, b) => {
                return new Date(a.date_in) - new Date(b.date_in);
            });
    
            return groupedLogsArray;
        };
    
        if (apiData?.accommodation_logs) {
            const groupedData = groupLogs(apiData.accommodation_logs);
            
            // Append grouped data to apiData
            setDisplayData({
                ...apiData,  // Spread all other properties of apiData
                groupedAccommodationLogs: groupedData  // Add the new grouped property
            });
        }
    }, [apiData]);

    const detailRow = (attribute, value, icon, isSensitive=false) => {
        return (
            <tr>
                <td className={`${isSensitive && 'tb-teal-text text-darken-1'}`}>
                    <span className="material-symbols-outlined tb-grey-text text-lighten-2 text-xlarge">
                        {icon}
                    </span>
                    &nbsp;&nbsp;
                    {attribute}
                </td>
                <td className="text-bold">
                    {value}
                </td>
            </tr>
        )
    }

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    console.log(JSON.stringify(displayData?.travel_advisor_id));

    return (
        
        <>
            <header>
                <Navbar title="Trip Details" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center accommodation-logs" style={{ width: '90%', paddingTop: '40px', paddingBottom: '100px' }}>
                    {loaded && displayData && displayData.groupedAccommodationLogs ? (
                        <>
                        <div key={displayData.id} >
                            <div>
                                <h5 className="report-title" style={{ marginBottom: '0px' }}>
                                    {displayData.trip_name || "Unnamed Trip"}
                                </h5>
                                <em className="tb-grey-text text-darken-1 text-small" style={{ fontSize: '1rem' }}>
                                    <span className="text-bold teal-text" style={{ fontSize: '1.2rem' }}>
                                        {moment(displayData.start_date).format('MMMM D, YYYY')}
                                    </span>
                                    <span>&nbsp;&nbsp;<span className="material-symbols-outlined">
                                        flight_land
                                    </span> </span>
                                    <span className="text-bold teal-text" style={{ fontSize: '1.2rem' }}>
                                        {moment(displayData.end_date).format('MMMM D, YYYY')}
                                    </span>

                                </em>
                                {/* General trip info */}
                                <div className="row" style={{marginTop: '40px'}}>
                                    <div className="row">
                                        <div className="col s12 l3">
                                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                {displayData.consultant_display_name}
                                            </span>
                                            <br />
                                            <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                <span className="material-symbols-outlined">
                                                    badge
                                                </span>
                                                Consultant
                                            </em>
                                        </div>
                                        <div className="col s12 l3">
                                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                {displayData.trip_length_days} days
                                            </span>
                                            <br />
                                            <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                <span className="material-symbols-outlined">
                                                    calendar_clock
                                                </span>
                                                Trip Length
                                            </em>
                                        </div>
                                        <div className="col s12 l3">
                                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                {displayData.total_bed_nights}
                                            </span>
                                            <br />
                                            <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                <span className="material-symbols-outlined">
                                                    dark_mode
                                                </span>
                                                Total Bed Nights
                                            </em>
                                        </div>
                                        <div className="col s12 l3">
                                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                {displayData.travel_advisor_name?.split('@')[0]}
                                            </span>
                                            <br />
                                            <em className="tb-grey-text text-darken-1" style={{ fontSize: '1rem' }}>
                                                <span className="material-symbols-outlined">
                                                    person_apron
                                                </span>
                                                Travel Advisor
                                            </em>
                                        </div>
                                    </div>
                                    <div className="row">
                                        
                                    </div>
                                    {/* TODO booking channels .map */}
                                    {/* <p>
                                        Booking Channels: {displayData.booking_channels}
                                    </p>
                                    <p>
                                        Properties: {displayData.properties}
                                    </p> */}
                                </div>
                                <div className="row">
                                    <div
                                        className="btn btn-large warning-yellow text-bold tb-grey-text text-darken-4"
                                        onClick={() => window.open(`/trip/edit/${displayData.id}`, '_blank')} style={{ cursor: 'pointer' }}
                                    >
                                        EDIT
                                        <span className="material-symbols-outlined">
                                            edit
                                        </span>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col s6">
                                        <div className="card">
                                        <div className="card-content">
                                        <h5 className="text-bold" style={{marginBottom: '40px'}}>Booking Details</h5>
                                        <table>
                                            <tbody>
                                                {detailRow(
                                                    "Inquiry Date",
                                                    displayData.inquiry_date && moment(displayData.inquiry_date).format('MMMM D, YYYY'),
                                                    'contact_support'
                                                )}
                                                {detailRow(
                                                    "Deposit Date",
                                                    displayData.deposit_date && moment(displayData.deposit_date).format('MMMM D, YYYY'),
                                                    'person_check'
                                                )}
                                                {detailRow("Days To Confirm", displayData.days_to_confirm, 'date_range')}
                                                {detailRow(
                                                    "Final Payment Date",
                                                    displayData.final_payment_date && moment(displayData.final_payment_date).format('MMMM D, YYYY'),
                                                    'payments'
                                                )}
                                                {detailRow("Lead Source", toTitleCase(displayData.lead_source), 'forum')}
                                                {detailRow(
                                                    "Sell Price",
                                                    displayData.sell_price ? '$'+displayData.sell_price : '',
                                                    'price_check',
                                                    true
                                                )}
                                                {detailRow(
                                                    "Cost From Suppliers",
                                                    displayData.cost_from_suppliers ? '$'+displayData.cost_from_suppliers : '',
                                                    'request_quote',
                                                    true
                                                )}
                                                {detailRow(
                                                    "Commission",
                                                    displayData.commission ? '$'+displayData.commission : '',
                                                    'price_change',
                                                    true
                                                )}
                                                {detailRow(
                                                    "Margin",
                                                    displayData.margin ? (100*displayData.margin).toLocaleString()+'%' : '',
                                                    'percent',
                                                    true
                                                )}
                                                {detailRow("Flights Handled By", toTitleCase(displayData.flights_handled_by), 'airplane_ticket')}
                                                {detailRow(
                                                    "Full Coverage Policy",
                                                    (displayData.full_coverage_policy === true ?
                                                        <div className="chip success-green-light">YES</div> :
                                                        displayData.full_coverage_policy === false ?
                                                            <div className="chip error-red-light">NO</div> :
                                                                ''
                                                    ),
                                                    'health_and_safety'
                                                )}
                                                {detailRow("Tons Emitted (Africa)", displayData.tons_emitted_africa?.toLocaleString(), 'co2')}
                                                {detailRow(
                                                    "Conservation Levy (Africa)",
                                                    displayData.conservation_levy_africa ? '$'+displayData.conservation_levy_africa : '',
                                                    'forest'
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                        </div>
                                    </div>
                                    {/* <div className="col s1">

                                    </div> */}
                                    <div className="col s6">
                                        <div className="row">
                                        <div className="card">
                                        <div className="card-content">
                                        <h5 className="text-bold" style={{marginBottom: '40px'}}>Itinerary</h5>
                                        {displayData.groupedAccommodationLogs.map((log, logIndex) => {
                                            return (
                                                <>
                                                <CondensedSingleLogDisplay
                                                    log={log}
                                                    onPassengerToggleClick={togglePassengerDisplay(logIndex)}
                                                />
                                                <hr
                                                    style={{
                                                        border: '1px solid #e8e5e1',
                                                        borderRadius: '1px',
                                                        margin: '10px auto'
                                                    }}
                                                />
                                                </>
                                            );
                                        })}
                                        </div>
                                        <div className="row">
                                            <div className="container center">
                                                <div className="card tb-grey lighten-4 potential-trip-card" style={{ marginTop: '30px', marginBottom: '30px', fontSize: '1.2rem'}}>
                                                    <p className="tb-grey-text text-darken-2" style={{ paddingTop: '10px', paddingBottom: '10px'}}>
                                                        <span className="text-bold">Booking Notes from Consultant:</span>
                                                        <br/>
                                                        {displayData.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </>
                    ) : (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default TripDetail;
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import moment from 'moment';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
import TricklingDotsPreloader from '../../components/TricklingDotsPreloader';

const ConfirmTripModal = ({ isOpen, onClose, onRefresh, selectedTrips = new Set()}) => {
    const { userDetails } = useAuth();
    const [tripName, setTripName] = useState('');
    const [numPossiblyRelatedTrips, setNumPossiblyRelatedTrips] = useState([]);
    const [relatedLoaded, setRelatedLoaded] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [localSelectedTrips, setLocalSelectedTrips] = useState([]);

    const generateInternalTripId = (trip) => {
        // Create a safe ID by removing spaces and lowercasing everything for consistency
        return `${trip.trip_name}-${trip.core_destination}-${trip.start_date}-${trip.end_date}`
            .replace(/\s+/g, '')
            .toLowerCase();
    };

    const fetchRelatedTrips = useCallback((formattedTrips) => {
        setRelatedLoaded(false);
        let allRelatedTrips = [];
    
        // Collect clientIds of all currently selected trips to avoid duplicates, including those being formatted
        const existingClientIds = new Set(formattedTrips.map(trip => trip.clientId));
    
        const promises = formattedTrips.map(trip =>
            fetch(`${process.env.REACT_APP_API}/v1/related_trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`
                },
                body: JSON.stringify(trip)
            })
            .then(res => res.json())
            // .then(data => data.map(item => ({
            //     ...item,
            //     type: 'related',
            //     clientId: generateInternalTripId(item)
            // })))
            .then(data => {
                const validatedData = validateData(data);
                const transformedData = validatedData.map(item => ({
                    ...item,
                    type: 'related',
                    clientId: generateInternalTripId(item)
                }));
                return transformedData;
            })
            .catch(err => {
                console.error('Error fetching related trips for trip:', trip, err);
            })
        );
    
        Promise.all(promises).then(results => {
            // Flatten the array of arrays and remove any undefined values due to errors
            allRelatedTrips = results.flat().filter(item => item !== undefined);
    
            setLocalSelectedTrips(prevTrips => {
                const updatedTrips = [...prevTrips];
                allRelatedTrips.forEach(relatedTrip => {
                    if (!existingClientIds.has(relatedTrip.clientId)) {
                        updatedTrips.push(relatedTrip);
                        existingClientIds.add(relatedTrip.clientId);  // Update the set with new clientId to avoid duplicates in the future
                    }
                });
    
                return updatedTrips;
            });
    
            setRelatedLoaded(true);
        });
    }, [userDetails.token]);    
    

    useEffect(() => {
        if (isOpen) {
            const formattedTrips = [...selectedTrips].map(trip => ({
                ...trip,
                type: 'original',
                clientId: generateInternalTripId(trip)
            }));
            setLocalSelectedTrips(formattedTrips);
            fetchRelatedTrips(formattedTrips);
        }
    }, [isOpen, selectedTrips, fetchRelatedTrips]);

    const removeLog = (tripId, logId) => {
        const updatedTrips = localSelectedTrips.map(trip => {
            if (trip.id === tripId) {
                const filteredLogs = trip.accommodation_logs.filter(log => log.id !== logId);
                return { ...trip, accommodation_logs: filteredLogs };
            }
            return trip;
        }).filter(trip => trip.accommodation_logs.length > 0);
        
        setLocalSelectedTrips(updatedTrips);

        if (updatedTrips.length === 0 || updatedTrips.every(trip => trip.accommodation_logs.length === 0)) {
            onClose();
        }
    };

    function validateData(trips) {
        return trips.map(trip => {
            const logs = trip.accommodation_logs;
            const consultantCounts = {};
            const coreDestinationCounts = {};
            const numPaxCounts = {};
            const primaryTravelerCount = {};

            // Count occurrences of each value
            logs.forEach(log => {
                consultantCounts[log.consultant_display_name] = (consultantCounts[log.consultant_display_name] || 0) + 1;
                coreDestinationCounts[log.core_destination_name] = (coreDestinationCounts[log.core_destination_name] || 0) + 1;
                numPaxCounts[log.num_pax] = (numPaxCounts[log.num_pax] || 0) + 1;
                primaryTravelerCount[log.primary_traveler] = (primaryTravelerCount[log.primary_traveler] || 0) + 1;
            });

            // Determine most common values
            const mostCommonConsultant = Object.keys(consultantCounts).reduce((a, b) => consultantCounts[a] > consultantCounts[b] ? a : b);
            const mostCommonDestination = Object.keys(coreDestinationCounts).reduce((a, b) => coreDestinationCounts[a] > coreDestinationCounts[b] ? a : b);
            const mostCommonNumPax = Object.keys(numPaxCounts).reduce((a, b) => numPaxCounts[a] > numPaxCounts[b] ? a : b);
            const mostCommonTraveler = Object.keys(primaryTravelerCount).reduce((a, b) => primaryTravelerCount[a] > primaryTravelerCount[b] ? a : b);

            // Validate each log
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];

                // Check for date overlap issues
                if (i < logs.length - 1) {
                    const nextLog = logs[i + 1];
                    if (new Date(log.date_out) > new Date(nextLog.date_in)) {
                        log.date_out_flag = true;
                        nextLog.date_in_flag = true;
                    }
                }

                // Check for gap between consecutive logs
                if (i < logs.length - 1) {
                    const currentDateOut = new Date(log.date_out);
                    const nextDateIn = new Date(logs[i + 1].date_in);
                    const gapDays = (nextDateIn - currentDateOut) / (1000 * 60 * 60 * 24);
                    if (gapDays > 0) {
                        log.date_out_flag = true;
                        logs[i + 1].date_in_flag = true;
                    }
                }

                // Check for mismatch in consultant, destination, and num_pax
                if (log.consultant_display_name !== mostCommonConsultant) {
                    log.consultant_flag = true;
                }
                if (log.core_destination_name !== mostCommonDestination) {
                    log.core_destination_flag = true;
                }
                if (log.primary_traveler !== mostCommonTraveler) {
                    log.primary_traveler_flag = true;
                }
                const logNumPax = parseInt(log.num_pax, 10);  // Ensure it's an integer
                const commonNumPax = parseInt(mostCommonNumPax, 10);  // Ensure it's an integer
                if (logNumPax !== commonNumPax) {
                    log.num_pax_flag = true;
                }
            }

            return trip;
        });
    };

    useEffect(() => {
        // console.log(JSON.stringify(localSelectedTrips, null, 2));
        setNumPossiblyRelatedTrips(localSelectedTrips.filter(trip => trip.type === 'related').length);
    }, [localSelectedTrips]);

    useEffect(() => {
        let modalInstance = null;
        const modalElement = document.getElementById('confirm-trip-modal');
    
        if (modalElement) {
            const options = {
                onCloseEnd: () => {
                    onClose(); // This will be called when the modal closes
                },
            };
    
            // Initialize the modal only if it has not been initialized yet
            if (!M.Modal.getInstance(modalElement)) {
                modalInstance = M.Modal.init(modalElement, options);
            } else {
                modalInstance = M.Modal.getInstance(modalElement);
            }
    
            // Open or close the modal based on the isOpen prop
            if (isOpen) {
                modalInstance.open();
            } else {
                modalInstance.close();
            }
        }
    
        // Clean up function to destroy the modal instance when the component unmounts or before reinitializing
        return () => {
            if (modalInstance) {
                modalInstance.destroy();
            }
        };
    }, [isOpen, onClose]);
    

    useEffect(() => {
        const tripDetails = localSelectedTrips.map(trip => {
            const regex = /^(.*) x(\d+), (.+), (.+)$/;
            const match = trip.trip_name.match(regex);
            if (match) {
                return {
                    primaryTravelerTitleName: match[1],
                    primaryTravelerFullNames: trip.primary_travelers,
                    size: parseInt(match[2], 10), // Ensure the size is treated as a number
                    destination: match[3],
                    date: match[4],
                    full: trip.trip_name
                };
            }
            return null;  // Handle non-matching names appropriately
        }).filter(trip => trip !== null);
        
        if (tripDetails.length === 0) return;
    
        const uniqueDestinations = new Set(tripDetails.map(trip => trip.destination));
        const uniqueDates = new Set(tripDetails.map(trip => trip.date));
        
        if (uniqueDestinations.size === 1 && uniqueDates.size === 1) {
            // If only the destinations and dates are the same
            const travelersMap = new Map(); // Map to track sizes for each primary traveler
            tripDetails.forEach(trip => {
                const { primaryTravelerTitleName, primaryTravelerFullNames, size } = trip;
                const key = primaryTravelerTitleName; // Use primary traveler title name as the key
                if (!travelersMap.has(key)) {
                    travelersMap.set(key, { primaryTravelerTitleName, primaryTravelerFullNames, size });
                } else {
                    // If an entry with the same primary traveler title name exists, update its size
                    const existingEntry = travelersMap.get(key);
                    const areNamesIdentical = primaryTravelerFullNames?.every(name => existingEntry.primaryTravelerFullNames?.includes(name));
                    if (areNamesIdentical) {
                        return;
                    }
                    existingEntry.size += size; // Add to the existing size
                }
            });
            
            // Concatenate primary traveler names for different last names
            const combinedTravelers = Array.from(travelersMap.values())
                .map(entry => entry.primaryTravelerTitleName)
                .join('/');
            const totalSize = Array.from(travelersMap.values()).reduce((acc, curr) => acc + curr.size, 0);
            const anyTrip = tripDetails[0];
            const tripName = `${combinedTravelers} x${totalSize}, ${anyTrip.destination}, ${anyTrip.date}`;
            
            setTripName(tripName);
        } else {
            // More substantial differences
            setTripName('{Last Name/s} x{Num Pax}, {Destination}, {Month} {Year}');
        }
    }, [localSelectedTrips]);
    
    const onSubmit = (e) => {

        e.preventDefault();

        if (tripName.includes("{") || tripName === "") {
            M.toast({
                html: 'Please enter a name.',
                displayLength: 4000,
                classes: 'error-red',
            });
            return;
        }

        const accommodation_log_ids = localSelectedTrips.flatMap(trip => trip.accommodation_logs.map(log => log.id));

        const tripConfirmPayload = {
            trip_name: tripName || null,
            accommodation_log_ids: accommodation_log_ids,
            updated_by: userDetails.email
        };

        console.log("Sending payload:", tripConfirmPayload);
        setSubmitLoading(true);

        
        fetch(`${process.env.REACT_APP_API}/v1/confirm_trip`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(tripConfirmPayload, null, 2),
            })
            .then(response => {
                    if (!response.ok) {
                        // If the response is not ok, throw an error with the status
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // Handle success response
                    const insertedCount = data?.inserted_count ?? 0;
                    const updatedCount = data?.updated_count ?? 0;
                    let toastHtml = '';
                    let toastColor = 'success-green';

                    // Check for error first
                    if (data?.error) {
                        toastHtml = data.error;
                        toastColor = 'error-red';
                    } else if (insertedCount > 0) {
                        toastHtml = `Added ${insertedCount} trip.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} trip.`;
                    } else {
                        toastHtml = data?.message ?? "No trips were added.";
                        toastColor = 'error-red';
                    }

                    M.toast({
                        html: toastHtml,
                        displayLength: 4000,
                        classes: toastColor,
                    });
                    setSubmitLoading(false);
                })
                .finally(() => {
                    // resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error: ', error);
                    setSubmitLoading(false);
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'warning-yellow tb-md-black-text',
                    });
                });
    };

    return (
        <div id="confirm-trip-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4>Validate Trip</h4>
                {submitLoading ? (
                    <div style={{ marginTop: '50px'}}>
                        <TricklingDotsPreloader show={true} /> 
                    </div>
                ) : (
                    <>
                    <button className="btn error-red" onClick={onClose}>Close</button>
                    &nbsp;&nbsp;
                    {relatedLoaded &&
                        <button className="btn success-green" onClick={onSubmit}>Submit</button>
                    }
                        <div className="row center" style={{ marginBottom: '0px' }}>
                            <div className="col s12 m12">
                                {tripName.includes("{") &&
                                    <div style={{ marginTop: '10px'}}>
                                        <div className="chip error-red-light text-bold">
                                            Name could not be determined, please enter a name.
                                        </div>
                                    </div>
                                }
                                {tripName === "" &&
                                    <div style={{ marginTop: '10px'}}>
                                        <div className="chip error-red-light text-bold">
                                            Please enter a name.
                                        </div>
                                    </div>
                                }
                                <div className="input-field col s12 l8 offset-l2">
                                    <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                        airplane_ticket
                                    </span>
                                    <input
                                        type="text"
                                        id="search-query"
                                        placeholder="Trip name"
                                        value={tripName}
                                        onChange={(e) => setTripName(e.target.value)}
                                        // className="name-input" // Apply any styling as needed
                                        className={`${(tripName.includes("{") || tripName === "") ? 'invalid' : ''} name-input`}
                                    />
                                    <span
                                        className="grey-text text-darken-1"
                                    >
                                        Trip Name
                                    </span>
                                </div>
                            </div>
                        </div>
                        {relatedLoaded ? (
                            numPossiblyRelatedTrips > 0 ? (
                                <span className="chip warning-yellow" style={{ marginTop: '0px', fontSize: '1.2rem' }}>
                                    <span className="material-symbols-outlined">
                                        arrow_downward
                                    </span>
                                    <span className="text-bold">{numPossiblyRelatedTrips}</span> possibly related trip{numPossiblyRelatedTrips !== 1 && "s"} 
                                </span>
                            ) : (
                                <span className="chip success-green-light" style={{ marginTop: '0px', fontSize: '1.2rem' }}>
                                    <span className="material-symbols-outlined">
                                        check_circle
                                    </span>
                                    No related trips
                                </span>
                            )
                        ) : (
                            <div>
                                <TricklingDotsPreloader show={true} /> 
                                <p className="tb-teal-text">Searching for possibly related trips...</p>
                            </div>
                        )
                        }
                        <ul>
                            {localSelectedTrips.filter(trip => trip.type === 'original').map(trip => (
                                trip.accommodation_logs.length > 0 && (
                                    <div key={trip.id}>
                                        <h5
                                            className="tb-teal darken-2 tb-off-white-text"
                                            style={{
                                                height: '40px',
                                                borderRadius: '4px',
                                                marginBottom: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {trip.trip_name}
                                        </h5>
                                        {trip.review_status === "flagged"  &&
                                            <div className="container center">
                                                <div className="card tb-grey lighten-4 potential-trip-card" style={{ marginTop: '30px', marginBottom: '30px', fontSize: '1.2rem'}}>
                                                        <p className="tb-grey-text text-darken-2" style={{ paddingTop: '10px', paddingBottom: '10px'}}>
                                                            <span className="chip error-red-light">
                                                                <span className="material-symbols-outlined">
                                                                    flag
                                                                </span>
                                                                {trip.review_status} by <span className="text-bold">{trip.reviewed_by.split('@')[0]}</span>
                                                            </span>
                                                            {trip.review_notes &&
                                                            <>
                                                                <br/>
                                                                <span className="text-bold">Note from <span className="tb-teal-text text-darken-1">{trip.reviewed_by.split('@')[0]}</span>:</span>
                                                                <br/>
                                                                {trip.review_notes}
                                                                <br/>
                                                                <em style={{ fontSize: '1rem' }}>{moment(trip.reviewed_at).local().fromNow()}</em>
                                                            </>
                                                            }
                                                        </p>
                                                </div>
                                            </div>
                                        }
                                        {trip.accommodation_logs.map(log => (
                                            <li key={log.id}>
                                                <div className="row">
                                                    <div className="col m1">
                                                        <button className="btn btn-floating btn-small error-red" onClick={() => removeLog(trip.id, log.id)}>
                                                            x
                                                        </button>
                                                    </div>
                                                    <div className="col m11">
                                                        <SingleLogDisplay log={log} />
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </div>
                                )
                            ))}
                        </ul>
                        
                        {localSelectedTrips && numPossiblyRelatedTrips > 0 && 
                        <>
                            <span className="chip warning-yellow" style={{ marginTop: '0px', fontSize: '1.6rem', padding: '0px 30px' }}>
                                Possibly Related Trip{numPossiblyRelatedTrips !== 1 && "s"}
                            </span>
                            <ul>
                            {localSelectedTrips.filter(trip => trip.type === 'related').map(relatedTrip => (
                                <div key={relatedTrip.id}>
                                    <h5
                                        className="tb-teal darken-2 tb-off-white-text"
                                        style={{
                                            height: '40px',
                                            borderRadius: '4px',
                                            marginBottom: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {relatedTrip.trip_name}
                                        {!relatedTrip.review_status &&
                                            <>
                                                &nbsp;&nbsp;
                                                <span className="chip success-green-light" style={{height: '65%', marginBottom: '0px', paddingBottom: '10px'}}>
                                                    <span className="material-symbols-outlined">
                                                        check_circle
                                                    </span>
                                                    <span>validated trip</span>
                                                </span>
                                            </>
                                        }
                                    </h5>
                                    {relatedTrip.review_status === "flagged"  &&
                                        <div className="container center">
                                            <div className="card tb-grey lighten-4 potential-trip-card" style={{ marginTop: '30px', marginBottom: '30px', fontSize: '1.2rem'}}>
                                                    <p className="tb-grey-text text-darken-2" style={{ paddingTop: '10px', paddingBottom: '10px'}}>
                                                        <span className="chip error-red-light">
                                                            <span className="material-symbols-outlined">
                                                                flag
                                                            </span>
                                                            {relatedTrip.review_status} by <span className="text-bold">{relatedTrip.reviewed_by.split('@')[0]}</span>
                                                        </span>
                                                        {relatedTrip.review_notes &&
                                                        <>
                                                            <br/>
                                                            <span className="text-bold">Note from <span className="tb-teal-text text-darken-1">{relatedTrip.reviewed_by.split('@')[0]}</span>:</span>
                                                            <br/>
                                                            {relatedTrip.review_notes}
                                                            <br/>
                                                            <em style={{ fontSize: '1rem' }}>{moment(relatedTrip.reviewed_at).local().fromNow()}</em>
                                                        </>
                                                        }
                                                    </p>
                                            </div>
                                        </div>
                                    }
                                    {relatedTrip.accommodation_logs.map(log => (
                                        <li key={log.id}>
                                            <div className="row">
                                                <div className="col m1">
                                                    <button className="btn btn-floating btn-small error-red" onClick={() => removeLog(relatedTrip.id, log.id)}>
                                                        x
                                                    </button>
                                                </div>
                                                <div className="col m11">
                                                    <SingleLogDisplay log={log} />
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </div>
                            ))}
                            </ul>
                        </>
                        }
                    </>
                    )
                }
            </div>
        </div>
    );
};

export default ConfirmTripModal;
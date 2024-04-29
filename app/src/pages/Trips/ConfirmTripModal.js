import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
// import moment from 'moment';

const ConfirmTripModal = ({ isOpen, onClose, onRefresh, selectedTrips = new Set()}) => {
    const { userDetails } = useAuth();
    const [tripName, setTripName] = useState('');
    const [localSelectedTrips, setLocalSelectedTrips] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setLocalSelectedTrips([...selectedTrips]);
        }
    }, [isOpen, selectedTrips]);

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
            onClose();  // Call the onClose function to close the modal
        }
    };

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('confirm-trip-modal');
        const instance = M.Modal.init(modalElement, options);

        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }

        if (!isOpen) return;
    }, [isOpen, onClose, userDetails.token]);

    useEffect(() => {
        const uniqueNames = new Set([...localSelectedTrips].map(trip => trip.trip_name));
        if (uniqueNames.size === 1) {
            setTripName([...uniqueNames][0]);
        } else if (uniqueNames.size > 1) {
            setTripName('combined trip name'); // Placeholder for combined logic
        }
    }, [localSelectedTrips]);

    const onSubmit = (e) => {
        // M.toast({
        //     html: 'Downloading Excel report...',
        //     displayLength: 2000,
        //     classes: 'warning-yellow tb-md-black-text',
        // });

        e.preventDefault();

        const accommodation_log_ids = localSelectedTrips.flatMap(trip => trip.accommodation_logs.map(log => log.id));

        const tripConfirmPayload = {
            trip_name: tripName || null,
            accommodation_log_ids: accommodation_log_ids,
            updated_by: userDetails.email
        };

        console.log("Sending payload:", tripConfirmPayload);

        
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
                })
                .finally(() => {
                    // resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error: ', error);
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'warning-yellow tb-md-black-text',
                    });
                });
            // }
    };

    return (
        <div id="confirm-trip-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4>Validate Trip</h4>
                <button className="btn error-red" onClick={onClose}>Close</button>
                &nbsp;&nbsp;
                <button className="btn success-green" onClick={onSubmit}>Submit</button>
                <div className="row">
                    <div className="col s12 m12">
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
                                className="name-input" // Apply any styling as needed
                            />
                            <span
                                className="grey-text text-darken-1"
                            >
                                Trip Name
                            </span>
                        </div>
                    </div>
                </div>
                <ul>
                    {localSelectedTrips.map(trip => (
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
            </div>
        </div>
    );
};

export default ConfirmTripModal;
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
// import moment from 'moment';

const FlagTripModal = ({ isOpen, onClose, onRefresh, potentialTripData = null}) => {
    const { userDetails } = useAuth();
    const [tripName, setTripName] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        setTripName(potentialTripData?.trip_name);
    }, [potentialTripData]);

    useEffect(() => {
        const modalElement = document.getElementById('flag-trip-modal');
        if (!modalElement) return;
        const options = {
            onCloseEnd: () => {
                setTripName('');
                setNotes('');
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
            M.updateTextFields();
        } else {
            instance.close();
        }

        return () => {
            instance.destroy();
        };
    }, [isOpen, onClose]);

    const onSubmit = (e) => {
        e.preventDefault();

        const accommodation_log_ids = potentialTripData.accommodation_logs.map(log => log.id);

        const tripFlagPayload = {
            trip_name: tripName || null,
            accommodation_log_ids: accommodation_log_ids,
            updated_by: userDetails.email,
            reviewed_by: userDetails.email,
            review_status: 'flagged',
            review_notes: notes || ''
        };

        console.log("Sending payload:", tripFlagPayload);

        fetch(`${process.env.REACT_APP_API}/v1/flag_trip`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(tripFlagPayload, null, 2),
            })
            .then(response => {
                    if (!response.ok) {
                        // If the response is not ok, throw an error with the status
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Trip successfully flagged:', data);
                    M.toast({ html: 'Trip successfully flagged', classes: 'success-green' });
                })
                .finally(() => {
                    resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    M.toast({
                        html: 'Trip flag unsuccessful: ' + error,
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                });
            // }
    };

    const resetFormState = () => {
        setTripName('');
        setNotes('');
    };

    return (
        <div id="flag-trip-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4>Flag Trip</h4>
                <button className="btn error-red" onClick={onClose}>Close</button>
                &nbsp;&nbsp;
                <button className="btn success-green" onClick={onSubmit}>
                    <i className="material-icons">flag</i>
                </button>
                <div className="row" style={{ marginBottom: '0px' }}>
                    <div className="col s12 m12">
                        <div className="input-field col s12 l8 offset-l2">
                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                airplane_ticket
                            </span>
                            <input
                                type="text"
                                id="trip-name"
                                placeholder="Trip name"
                                value={tripName || ''}
                                onChange={(e) => setTripName(e.target.value)}
                                className="name-input input-placeholder-dark" // Apply any styling as needed
                            />
                            <span
                                className="grey-text text-darken-1"
                            >
                                Trip Name
                            </span>
                        </div>
                    </div>
                </div>
                <div className="row" style={{ marginBottom: '0px' }}>
                    <div className="col s12 m12">
                        <div className="input-field col s12 l8 offset-l2">
                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                speaker_notes
                            </span>
                            <textarea
                                // type="text"
                                id="review-notes"
                                placeholder="Additional notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="materialize-textarea name-input input-placeholder-dark"
                                maxLength="1000"
                            />
                            <span
                                className="grey-text text-darken-1"
                            >
                                Notes (optional)
                            </span>
                        </div>
                    </div>
                </div>
                <ul>
                    {potentialTripData && 
                        <div key={potentialTripData.id}>
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
                                {potentialTripData.trip_name}
                            </h5>
                            {potentialTripData.accommodation_logs.map(log => (
                                <li key={log.id}>
                                    <div className="row">
                                        <div className="col m12">
                                            <SingleLogDisplay log={log} />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </div>
                    }
                </ul>
            </div>
        </div>
    );
};

export default FlagTripModal;
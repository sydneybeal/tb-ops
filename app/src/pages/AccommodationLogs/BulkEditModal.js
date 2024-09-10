import React, { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
// import CircularPreloader from '../../components/CircularPreloader';
import moment from 'moment';

export const BulkEditModal = ({ isOpen, onClose, onRefresh, bulkAction, entries }) => {
    const [newTravelerName, setNewTravelerName] = useState('');
    const { userDetails } = useAuth();
    const [numPax, setNumPax] = useState(1);
    const entriesArray = Array.from(entries.values());
    const summaryInfo = entriesArray.length > 0 ? entriesArray[0] : null;
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({
        primaryTraveler: false,
        numPax: false
    });

    useEffect(() => {
        const options = {
            onCloseEnd: () => onClose(),
        };
        const modalElement = document.getElementById('duplicate-log-modal');
        const instance = M.Modal.init(modalElement, options);

        const updateModalState = () => {
            if (isOpen && entries.size >= 1) {
                instance.open();
            } else {
                instance.close();
            }
        };

        updateModalState();

        return () => {
            instance.destroy();
        };
    }, [isOpen, onClose, entries.size]);

    const validateForm = () => {
        let errors = {};
        const namePattern = /^[^/]+\/[^/]+$/;

        if (!(newTravelerName || '').trim()) {
            errors.primaryTraveler = 'Missing primary traveler';
        } else if (!namePattern.test(newTravelerName.trim())) {
            errors.primaryTraveler = 'Please enter the name in "Last/First" format';
        }
        if (parseInt(numPax, 10) < 1) {
            errors.numPax = 'Number of passengers is less than 0';
        }
        if (parseInt(numPax, 10) > 50) {
            errors.numPax = 'Number of passengers exceeds limit of 50';
        }


        setValidationErrors(errors);

        // Determine if the form is valid based on the presence of errors
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            M.toast({
                html: 'Please check the form for errors.',
                displayLength: 4000,
                classes: 'error-red',
            });
            // Prevent form submission if validation fails
            return;
        }

        // Ensure each log includes the primary traveler's name and the selected consultant when submitting
        const logsToSubmit = entriesArray.map(log => ({
            ...log,
            primary_traveler: newTravelerName,
            num_pax: numPax,
            updated_by: userDetails.email || ''
        }));
        console.log(logsToSubmit);
        if (userDetails.role !== 'admin' && userDetails.role !== 'sales_support') {
            M.toast({
                html: 'Your entry was valid, but only admins & sales support are able to save to the database.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        }
        else {
            fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(logsToSubmit, null, 2),
            })
                .then(response => {
                    if (!response.ok) {
                        // If the response is not ok, throw an error with the status
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    const auditLogSummary = data?.summarized_audit_logs ?? {};
                    let toastHtml = '';
                    let toastClass = 'success-green';
                    let totalOperations = 0;

                    // Mapping for category names
                    const categoryNames = {
                        accommodation_logs: "service provider",
                        booking_channels: "booking channel",
                        agencies: "agency",
                        properties: "property"
                    };

                    Object.entries(auditLogSummary).forEach(([category, actions]) => {
                        // Use the mapping if available, or default to the category name with first letter capitalized
                        const displayName = categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
                        const inserts = actions.insert || 0;
                        const updates = actions.update || 0;
                        totalOperations += inserts + updates;

                        if (inserts > 0) {
                            toastHtml += `Added ${inserts} ${displayName} record(s).<br>`;
                        }
                        if (updates > 0) {
                            toastHtml += `Updated ${updates} ${displayName} record(s).<br>`;
                        }
                    });

                    const messages = data?.messages ?? [];
                    if (messages.length > 0) {
                        // Append messages to the toastHtml with specific styling for warnings
                        messages.forEach(message => {
                            // Here you're adding a 'warning-message' class to style these messages
                            toastHtml += `${message}`;
                            toastClass = 'warning-yellow text-bold tb-md-black-text';
                        });
                    }

                    if (totalOperations === 0 && toastHtml === '') {
                        // Fallback message if no detailed logs were processed
                        toastHtml = data?.message ?? "No records were added or updated.";
                        toastClass = 'warning-yellow text-bold tb-md-black-text';
                    }

                    M.toast({
                        html: toastHtml,
                        displayLength: 8000,
                        classes: toastClass,
                    });
                })
                .finally(() => {
                    resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    // Handle errors here
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'warning-yellow tb-md-black-text',
                    });
                });
        }
    };

    const handleDelete = () => {
        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Only admins are able to delete from the database at this time.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        } else {
            const confirmDelete = window.confirm("Are you sure you want to delete selected entries?");
            if (confirmDelete) {
                entriesArray.forEach((entry) => {
                    const entryId = entry.id;
                    if (!entryId) {
                        M.toast({ html: 'Error: No entry ID found', classes: 'error-red' });
                        return;
                    }

                    fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs/${entryId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userDetails.token}`
                        },
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to delete the entry.');
                            }
                            return response.json(); // Assuming the API returns JSON even for DELETE
                        })
                        .then(() => {
                            M.toast({ html: 'Entry deleted successfully', classes: 'success-green' });
                        })
                        .catch((error) => {
                            console.error('Deletion Error:', error);
                            M.toast({ html: error.message, classes: 'error-red' });
                        });
                    // Note: No finally method is used here because we're in a loop. Handle final actions outside if necessary.
                });
                resetFormState();
                onRefresh();
                onClose();
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        }
    }, [isOpen]);

    const resetFormState = () => {
        setNumPax(1);
        setNewTravelerName('');
        setValidationErrors({});
        setTouched({});
    };

    const validatePrimaryTraveler = (value) => {
        if (!(value || '').trim()) {
            return 'Missing primary traveler name';
        }
        // Regular expression to match "Last/First" format
        const namePattern = /^[^/]+\/[^/]+$/;
        if (!namePattern.test(value.trim())) {
            return 'Please enter the name in "Last/First" format';
        }

        return '';
    };

    const handlePrimaryTravelerChange = (e) => {
        const value = e.target.value;
        setNewTravelerName(value);

        // Only validate in real-time if the field has been touched
        if (touched.primaryTraveler) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                primaryTraveler: validatePrimaryTraveler(value),
            }));
        }
    };

    const handlePrimaryTravelerBlur = () => {
        setTouched(prev => ({ ...prev, primaryTraveler: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            primaryTraveler: validatePrimaryTraveler(newTravelerName),
        }));
    };

    const validateNumPax = (value) => {
        const num = parseInt(value, 10);
        if (num < 1) return 'Number of passengers must be greater than 0';
        if (num > 50) return 'Number of passengers must be less than 50';
        return '';
    };

    const handleNumPaxChange = (newNumPax) => {
        if (newNumPax === '') {
            setNumPax(''); // Allow the field to be empty
        } else {
            const parsedNumPax = parseInt(newNumPax, 10);
            if (!isNaN(parsedNumPax)) {
                setNumPax(parsedNumPax);
            }
        }
        const parsedNumPax = parseInt(newNumPax, 10);
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            numPax: validateNumPax(parsedNumPax),
        }));
    };


    return (
        <div id="duplicate-log-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="tb-grey-text text-darken-3" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {bulkAction === 'duplicate' ? (
                        "Duplicate "
                    ) : "Delete "}
                    Service Provider Entries
                </h4>
                <div className="container" style={{ marginBottom: '20px' }}>
                    {bulkAction === 'duplicate' &&
                        <form id="duplicateForm" onSubmit={handleFormSubmit}>

                            <p>
                                Please enter the new primary traveler & number of passengers for the records that you would like to duplicate.
                            </p>

                            {(validationErrors.primaryTraveler || validationErrors.numPax) && (
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    {validationErrors.primaryTraveler && (
                                        <div className="chip error-red-light text-bold">{validationErrors.primaryTraveler}</div>
                                    )}
                                    {validationErrors.numPax && (
                                        <div className="chip error-red-light text-bold">{validationErrors.numPax}</div>
                                    )}
                                </div>
                            )}
                            <div className="row">
                                <div class="input-field col l9 s12">
                                    <span className="material-symbols-outlined tb-grey-text prefix">
                                        person
                                    </span>
                                    <input
                                        type="text"
                                        name="userName"
                                        placeholder="Primary traveler name"
                                        value={newTravelerName}
                                        onChange={handlePrimaryTravelerChange}
                                        onBlur={handlePrimaryTravelerBlur}
                                        id="nameText"
                                        autoComplete='off'
                                        className={validationErrors.primaryTraveler ? 'invalid' : ''}
                                    />
                                </div>
                                <div class="input-field col l3 s12">
                                    <span className="material-symbols-outlined tb-grey-text prefix">
                                        group
                                    </span>
                                    <input
                                        type="number"
                                        name="userName"
                                        placeholder="# Pax"
                                        value={numPax}
                                        className={validationErrors.numPax ? 'invalid' : ''}
                                        onChange={(e) => handleNumPaxChange(e.target.value)}
                                        style={{ textAlign: 'center' }}
                                        id="numPax"
                                        autoComplete='off'
                                    />
                                </div>
                            </div>
                        </form>
                    }
                </div>
                {summaryInfo && bulkAction === 'duplicate' && (

                    <div className="row center" style={{ marginTop: '30px' }}>
                        <div className="tb-grey-text text-lighten-5 text-bold tb-teal darken-2" style={{ borderRadius: '4px', padding: '6px 0px', marginBottom: '30px', fontSize: '1.4rem' }}>
                            Entries to Duplicate
                        </div>
                        <div className="col l4 s12">
                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                {summaryInfo.primary_traveler}
                            </span>
                            <br />
                            <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                <span className="material-symbols-outlined">
                                    person
                                </span>
                                Primary Traveler
                            </em>
                        </div>
                        <div className="col l4 s12">
                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                {summaryInfo.consultant_display_name}
                            </span>
                            <br />
                            <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                <span className="material-symbols-outlined">
                                    badge
                                </span>
                                Consultant
                            </em>
                        </div>
                        <div className="col l4 s12">
                            <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                {summaryInfo.agency_name}
                            </span>
                            <br />
                            <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                <span className="material-symbols-outlined">
                                    contact_mail
                                </span>
                                Agency
                            </em>
                        </div>
                    </div>
                )}
                <div
                    className={`tb-grey-text text-lighten-5 text-bold ${bulkAction === 'delete' ? 'error-red' : 'tb-teal darken-2'}`}
                    style={{ borderRadius: '4px', padding: '6px 0px', marginTop: '30px', fontSize: '1.4rem' }}
                >
                    Accommodations {bulkAction === 'delete' && " to Delete"}
                </div>

                <div className="container" style={{ width: '90%' }}>
                    <table>
                        <thead>
                            <tr>
                                {bulkAction === 'delete' &&
                                    <>
                                        <th>
                                            <span className="material-symbols-outlined tb-md-black-text text-bold">
                                                hiking
                                            </span>
                                        </th>
                                        <th>
                                            <span className="material-symbols-outlined tb-md-black-text text-bold">
                                                badge
                                            </span>
                                        </th>
                                        <th>
                                            <span className="material-symbols-outlined tb-md-black-text text-bold">
                                                contact_mail
                                            </span>
                                        </th>
                                    </>
                                }
                                <th>
                                    <span className="material-symbols-outlined tb-md-black-text text-bold">
                                        hotel
                                    </span>
                                </th>
                                <th>
                                    <span className="material-symbols-outlined tb-md-black-text text-bold">
                                        explore
                                    </span>
                                </th>
                                <th>
                                    <span className="material-symbols-outlined tb-md-black-text text-bold">
                                        date_range
                                    </span>
                                </th>
                                <th>
                                    <span className="material-symbols-outlined tb-md-black-text text-bold">
                                        alt_route
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {entriesArray.map((entry) => (
                                <tr key={entry.id}>
                                    {bulkAction === 'delete' &&
                                        <>
                                            <td style={{ verticalAlign: 'top' }}>
                                                {entry.primary_traveler}
                                            </td>
                                            <td style={{ verticalAlign: 'top' }}>
                                                {entry.consultant_display_name}
                                            </td>
                                            <td style={{ verticalAlign: 'top' }}>
                                                {entry.agency_name}
                                            </td>
                                        </>
                                    }
                                    <td style={{ verticalAlign: 'top' }}>
                                        <span className="text-bold">{entry.property_name}</span>
                                        <br />
                                        <span style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'left', marginTop: '8px' }}>
                                            {entry.property_portfolio}
                                        </span>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <span>{entry.country_name}</span>
                                        <br />
                                        <span className="chip tb-teal lighten-3 text-bold" style={{
                                            padding: '0px 12px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {entry.core_destination_name}
                                        </span>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <span className="chip tb-grey lighten-2 text-bold">
                                            {moment(entry.date_in).format("M/D/YY")}
                                        </span>
                                        <br />
                                        <span className="chip tb-grey lighten-2 text-bold">
                                            {moment(entry.date_out).format("M/D/YY")}
                                        </span>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        {entry.booking_channel_name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div>
                    <button
                        className={`btn modal-close waves-effect waves-light ${bulkAction === 'delete' ? 'warning-yellow tb-md-black-text' : 'error-red'}`}
                        onClick={onClose}
                    >
                        Close
                    </button>
                    &nbsp;&nbsp;
                    {bulkAction === 'duplicate' ? (
                        <button type="submit" form="duplicateForm" className="btn waves-effect waves-light success-green">
                            Save
                        </button>
                    ) : bulkAction === 'delete' ? (
                        <button
                            onClick={handleDelete}
                            className="btn waves-effect waves-light error-red">
                            Delete
                        </button>
                    ) : null}
                </div>
            </div>
        </div >
    );
};

export default BulkEditModal;
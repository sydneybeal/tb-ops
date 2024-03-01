import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const AddEditBcModal = ({ isOpen, onClose, onRefresh, editBcData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [bookingChannelId, setBookingChannelId] = useState(null);
    const [name, setName] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({
        name: false,
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            M.toast({
                html: 'Please check the form for errors.',
                displayLength: 4000,
                classes: 'red lighten-2',
            });
            // Prevent form submission if validation fails
            return;
        }

        const bcToSubmit = {
            booking_channel_id: bookingChannelId || null,
            name: name || null,
            updated_by: userDetails.email || ''
        };

        console.log(bcToSubmit);

        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Your entry was valid, but only admins are able to save to the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            fetch(`${process.env.REACT_APP_API}/v1/booking_channels`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(bcToSubmit, null, 2),
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
                    let toastColor = 'green darken-1';

                    // Check for error first
                    if (data?.error) {
                        toastHtml = data.error;
                        toastColor = 'red lighten-2';
                    } else if (insertedCount > 0) {
                        toastHtml = `Added ${insertedCount} booking channel.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} booking channel.`;
                    } else {
                        toastHtml = data?.message ?? "No booking channels were added.";
                        toastColor = 'red lighten-2';
                    }

                    console.log(toastHtml);
                    M.toast({
                        html: toastHtml,
                        displayLength: 4000,
                        classes: toastColor,
                    });
                })
                .finally(() => {
                    resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'amber darken-1',
                    });
                });
            // }
        }
    };

    const validateForm = () => {
        let errors = {};

        if (!(name || '').trim()) {
            errors.name = 'Missing booking channel name';
        }

        setValidationErrors(errors);

        // Determine if the form is valid based on the presence of errors
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('add-edit-modal');
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

    const handleDelete = () => {
        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Only admins are able to delete from the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            const confirmDelete = window.confirm("Are you sure you want to delete this booking channel?");
            if (confirmDelete) {
                if (!bookingChannelId) {
                    M.toast({ html: 'Error: No booking channel ID found', classes: 'red lighten-2' });
                    return;
                }
                // Replace `/your-api-endpoint/` with the actual endpoint and `entryId` with the actual ID
                fetch(`${process.env.REACT_APP_API}/v1/booking_channels/${bookingChannelId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userDetails.token}`,
                    },
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('API error');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Handle success - show success message and possibly update the UI
                        M.toast({ html: 'Booking channel successfully deleted', classes: 'green' });
                    })
                    .finally(() => {
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Handle error - show error message
                        M.toast({ html: 'Error deleting booking channel', classes: 'red' });
                    });
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editBcData) {
            setBookingChannelId(editBcData.id);
            setName(editBcData.name);
        }
    }, [isOpen, isEditMode, editBcData]);

    const resetFormState = () => {
        setName('');
        setValidationErrors({});
    };

    const validateName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing booking channel name';
        }
        return '';
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);

        if (touched.name) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                name: validateName(value),
            }));
        }
    };

    const handleNameBlur = () => {
        setTouched(prev => ({ ...prev, name: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            name: validateName(name),
        }));
    };

    return (
        <div id="add-edit-modal" className="modal add-edit-modal">
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Booking Channel&nbsp;&nbsp;
                    {isEditMode &&
                        <button
                            className="btn waves-effect waves-light red lighten-3"
                            onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined grey-text text-darken-2" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                delete_forever
                            </span>
                        </button>
                    }
                </h4>
                <div className="container" style={{ width: '60%' }}>
                    <div style={{ textAlign: 'left', marginTop: '50px' }}>
                        <form id="consultantForm" onSubmit={handleFormSubmit}>
                            {validationErrors.name && (
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    {validationErrors.name && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.name}</div>
                                    )}
                                </div>
                            )}
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="booking_channel_name"
                                    value={name}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    placeholder="Booking channel name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.name ? 'invalid' : ''}
                                />
                                <label htmlFor="booking_channel_name">
                                    <span className="material-symbols-outlined">
                                        alt_route
                                    </span>
                                    Booking Channel Name
                                </label>
                            </div>
                        </form>
                    </div>
                </div >
            </div >
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div>
                    <button className="btn modal-close waves-effect waves-light red lighten-2" onClick={onClose}>
                        Close
                    </button>
                    &nbsp;&nbsp;
                    <button type="submit" form="consultantForm" className="btn waves-effect waves-light green">Save</button>
                </div>
            </div>
        </div >
    )
};

export default AddEditBcModal;
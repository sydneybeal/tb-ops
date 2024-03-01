import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const AddEditConsultantModal = ({ isOpen, onClose, onRefresh, editConsultantData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [consultantId, setConsultantId] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({
        firstName: false,
        lastName: false,
        isActive: false,
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

        const consultantToSubmit = {
            consultant_id: consultantId || null,
            first_name: firstName || null,
            last_name: lastName || null,
            is_active: isActive,
            updated_by: userDetails.email || ''
        };

        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Your entry was valid, but only admins are able to save to the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            fetch(`${process.env.REACT_APP_API}/v1/consultants`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(consultantToSubmit, null, 2),
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
                        toastHtml = `Added ${insertedCount} consultant.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} consultant.`;
                    } else {
                        toastHtml = data?.message ?? "No consultants were added.";
                        toastColor = 'red lighten-2';
                    }
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

        if (!(firstName || '').trim()) {
            errors.firstName = 'Missing first name';
        }
        if (!(lastName || '').trim()) {
            errors.lastName = 'Missing last name';
        }
        if (isActive === null) {
            errors.isActive = 'Missing active status';
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
            const confirmDelete = window.confirm("Are you sure you want to delete this consultant?");
            if (confirmDelete) {
                if (!consultantId) {
                    M.toast({ html: 'Error: No consultant ID found', classes: 'red lighten-2' });
                    return;
                }
                // Replace `/your-api-endpoint/` with the actual endpoint and `entryId` with the actual ID
                fetch(`${process.env.REACT_APP_API}/v1/consultants/${consultantId}`, {
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
                        M.toast({ html: 'Consultant successfully deleted', classes: 'green' });
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Handle error - show error message
                        M.toast({ html: 'Error deleting consultant', classes: 'red' });
                    });
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editConsultantData) {
            setConsultantId(editConsultantData.id);
            setFirstName(editConsultantData.first_name);
            setLastName(editConsultantData.last_name);
            setIsActive(editConsultantData.is_active);
        }
    }, [isOpen, isEditMode, editConsultantData]);

    const resetFormState = () => {
        setFirstName('');
        setLastName('');
        setIsActive(true);
        setValidationErrors({});
    };

    const validateFirstName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing first name';
        }
        return '';
    };

    const handleFirstNameChange = (e) => {
        const value = e.target.value;
        setFirstName(value);

        if (touched.firstName) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                name: validateFirstName(value),
            }));
        }
    };

    const handleFirstNameBlur = () => {
        setTouched(prev => ({ ...prev, firstName: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            firstName: validateFirstName(firstName),
        }));
    };

    const validateLastName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing last name';
        }
        return '';
    };

    const handleLastNameChange = (e) => {
        const value = e.target.value;
        setLastName(value);

        if (touched.lastName) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                lastName: validateLastName(value),
            }));
        }
    };

    const handleLastNameBlur = () => {
        setTouched(prev => ({ ...prev, lastName: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            lastName: validateFirstName(lastName),
        }));
    };

    const validateIsActive = (value) => {
        if (value === null) {
            return 'Missing active status';
        }
        return '';
    };

    const handleIsActiveChange = (e) => {
        const isChecked = e.target.checked;
        setIsActive(isChecked);

        if (touched.isActive !== undefined) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                isActive: validateIsActive(isChecked),
            }));
        }
    };

    return (
        <div id="add-edit-modal" className="modal add-edit-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Consultant&nbsp;&nbsp;
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
                            {(validationErrors.firstName || validationErrors.lastName || validationErrors.isActive) && (
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    {validationErrors.firstName && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.firstName}</div>
                                    )}
                                    {validationErrors.lastName && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.lastName}</div>
                                    )}
                                    {validationErrors.isActive && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.isActive}</div>
                                    )}
                                </div>
                            )}
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="first_name"
                                    value={firstName}
                                    onChange={handleFirstNameChange}
                                    onBlur={handleFirstNameBlur}
                                    placeholder="First name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.first_name ? 'invalid' : ''}
                                />
                                <label htmlFor="first_name">
                                    <span className="material-symbols-outlined">
                                        badge
                                    </span>
                                    First Name
                                </label>
                            </div>
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="last_name"
                                    value={lastName}
                                    onChange={handleLastNameChange}
                                    onBlur={handleLastNameBlur}
                                    placeholder="Last name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.last_name ? 'invalid' : ''}
                                />
                                <label htmlFor="last_name">
                                    <span className="material-symbols-outlined">
                                        store
                                    </span>
                                    Last Name
                                </label>
                            </div>
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <div className="switch">
                                    <label>
                                        Inactive
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={handleIsActiveChange}
                                        />
                                        <span className="lever"></span>
                                        Active
                                    </label>
                                </div>
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

export default AddEditConsultantModal;
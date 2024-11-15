import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const EditReferralModal = ({ isOpen, onClose, onRefresh, editClientData = null }) => {
    const { userDetails, logout } = useAuth();
    const [clientOptions, setClientOptions] = useState([]);
    const [selectedReferringClientId, setSelectedReferringClientId] = useState(null);
    const [originalReferringClient, setOriginalReferringClient] = useState(null);
    const [loaded, setLoaded] = useState(false);

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

        fetch(`${process.env.REACT_APP_API}/v1/clients`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    // Session has expired or credentials are invalid
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                if (!Array.isArray(data)) {
                    console.error("Expected an array but got:", data);
                    data = []; // Set data to an empty array if it's not an array
                }
                const formattedClientOptions = data.map((client) => ({
                    value: client.id,
                    label: client.display_name,
                    address_city: client.address_city,
                    address_state: client.address_state,
                    referred_by_display_name: client.referred_by_display_name,
                    referrals_count: client.referrals_count,
                    reservations_count: client.reservations_count,
                }));
                // console.log(JSON.stringify(data[0], null, 2));
                setClientOptions(formattedClientOptions);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [isOpen, onClose, userDetails.token, logout]);

    const handleReferralChange = (selectedOption) => {
        setSelectedReferringClientId(selectedOption ? selectedOption.value : '');
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && editClientData) {
            setOriginalReferringClient(editClientData.referred_by_display_name);
            setSelectedReferringClientId(editClientData.referred_by_id);
        }
    }, [isOpen, editClientData]);

    const resetFormState = () => {
        setSelectedReferringClientId(null);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        const clientToSubmit = {
            client_id: editClientData.id || null,
            first_name: editClientData.first_name,
            last_name: editClientData.last_name,
            referred_by_id: selectedReferringClientId || null,
            updated_by: userDetails.email || ''
        };
        console.log(clientToSubmit);

        
        fetch(`${process.env.REACT_APP_API}/v1/clients`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userDetails.token}`,
            },
            body: JSON.stringify(clientToSubmit, null, 2),
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
                    toastHtml = `Added ${insertedCount} client.`;
                } else if (updatedCount > 0) {
                    toastHtml = `Modified ${updatedCount} client.`;
                } else {
                    toastHtml = data?.message ?? "No clients were added.";
                    toastColor = 'error-red';
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
                    classes: 'warning-yellow tb-md-black-text',
                });
            });
        // }
    };

    
    // console.log(editClientData);
    // console.log(clientOptions);

    return (
        <div id="add-edit-modal" className="modal add-edit-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    Edit Referral for {editClientData?.display_name || 'Client'}
                </h4>
                <p>
                    Previously referred by: {originalReferringClient || 'none'}
                </p>
                <div className="container" style={{ width: '60%' }}>
                    <div style={{ textAlign: 'left', marginTop: '50px' }}>
                        <form id="consultantForm" onSubmit={handleFormSubmit}>
                            <Select
                                placeholder="Select referring client"
                                inputId="agency_select"
                                value={clientOptions.find(client => client.value === selectedReferringClientId) || ''}
                                onChange={handleReferralChange}
                                options={clientOptions}
                                isClearable
                                style={{ flexGrow: '1' }}
                                classNamePrefix="select"
                                styles={{
                                    option: (provided, state) => ({
                                        ...provided,
                                        fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                        backgroundColor: state.isSelected
                                            ? '#0e9bac' // Background color for selected options
                                            : state.isFocused
                                                ? '#e8e5e1' // Background color for focused (including hovered) options
                                                : '#ffffff', // Default background color for other states
                                        color: state.isSelected || state.isFocused ? 'initial' : 'initial', // Adjust text color as needed
                                        ':active': { // This targets the state when an option is being clicked or selected with the keyboard
                                            backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac', // Use the focused or selected color
                                        },
                                    }),
                                    menuPortal: base => ({ ...base, zIndex: 9999 })
                                }}
                                menuPortalTarget={document.body}
                            />
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div className="center" style={{ paddingBottom: '20px' }}>
                    <button className="btn modal-close waves-effect waves-light error-red" onClick={onClose}>
                        Close
                    </button>
                    &nbsp;&nbsp;
                    <button type="submit" form="consultantForm" className="btn waves-effect waves-light success-green">Save</button>
                </div>
            </div>
        </div>
    )

}

export default EditReferralModal;
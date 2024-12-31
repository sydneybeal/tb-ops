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
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [agencyOptions, setAgencyOptions] = useState([]);
    const [primaryAgentOptions, setPrimaryAgentOptions] = useState([]);
    const [selectedReferringEmployeeId, setSelectedReferringEmployeeId] = useState(null);
    const [selectedReferringClientId, setSelectedReferringClientId] = useState(null);
    const [selectedReferralCategory, setSelectedReferralCategory] = useState('client');
    const [selectedReferralType, setSelectedReferralType] = useState('existing_client');
    const [selectedReferringAgencyId, setSelectedReferringAgencyId] = useState(null);
    const [selectedInternetSource, setSelectedInternetSource] = useState(null);
    const [selectedPrimaryAgentName, setSelectedPrimaryAgentName] = useState(null);
    const [referralAgencyName, setReferralAgencyName] = useState(null);
    const [referralAgentName, setReferralAgentName] = useState(null);
    const [referredByName, setReferredByName] = useState('');
    const [otherInternetSource, setOtherInternetSource] = useState(false);
    const [notes, setNotes] = useState('');
    const [isAudited, setIsAudited] = useState(false);
    const [reassign, setReassign] = useState(false);
    const [deceased, setDeceased] = useState(false);
    const [doNotContact, setDoNotContact] = useState(false);
    const [movedBusiness, setMovedBusiness] = useState(false);
    const [originalReferringClient, setOriginalReferringClient] = useState(null);
    const [originalConsultant, setOriginalConsultant] = useState(null);
    const [loaded, setLoaded] = useState(false);

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const internetOptions = [
        {
            "value": "tripadvisor",
            "label": "Tripadvisor"
        },
        {
            "value": "facebook_instagram",
            "label": "Facebook/Instagram"
        },
        {
            "value": "tb_website",
            "label": "Travel Beyond Website"
        },
        {
            "value": "magazine",
            "label": "Magazine"
        },
        {
            "value": "other",
            "label": "Other (Enter Below)"
        },
    ]

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        M.AutoInit();
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
                    label: `${client.display_name}${
                        client.address_city || client.address_state
                            ? ` (${[toTitleCase(client.address_city), client.address_state].filter(Boolean).join(', ')})`
                            : ''
                    }`,
                    address_city: client.address_city,
                    address_state: client.address_state,
                    referred_by_display_name: client.referred_by_display_name,
                    referrals_count: client.referrals_count,
                    reservations_count: client.reservations_count,
                }));
                setClientOptions(formattedClientOptions);
                const agentOptions = data
                    .map((client) => client.cb_primary_agent_name)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((agentName) => ({
                        value: agentName,
                        label: agentName,
                    }));
                setPrimaryAgentOptions(agentOptions);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
        
        fetch(`${process.env.REACT_APP_API}/v1/users`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            })
                .then((res) => res.json())
                .then((data) => {
                    // Exclude specific emails from the list
                    const excludedEmails = [
                        "demo@travelbeyond.com",
                        "admin@travelbeyond.com",
                        "user@travelbeyond.com",
                        "uat@travelbeyond.com",
                        "testuser@travelbeyond.com"
                    ];
                    const filteredUsers = data.filter(user => !excludedEmails.includes(user.email)).map((user) => ({
                        value: user.id,
                        label: user.email,
                    }));;
                    setEmployeeOptions(filteredUsers);
                })
                .catch((err) => console.error(err));
        
        fetch(`${process.env.REACT_APP_API}/v1/agencies`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const naOption = data.find(agency => agency.name.toLowerCase() === "n/a");
                const otherAgencies = data.filter(agency => agency.name.toLowerCase() !== "n/a");
                const formattedAgencies = [naOption, ...otherAgencies].map((agency) => ({
                    value: agency.id,
                    label: agency.name,
                }));
                setAgencyOptions(formattedAgencies);
            })
            .catch((err) => console.error(err));
    }, [isOpen, onClose, userDetails.token, logout]);

    // const handleReferralClientChange = (selectedOption) => {
    //     setSelectedReferringClientId(selectedOption ? selectedOption.value : '');
    // };

    const handleInternetSelectChange = (selectedOption) => {
        if (selectedOption?.value !== 'other') {
            setSelectedInternetSource(selectedOption ? selectedOption.value : '');
            setReferredByName(selectedOption ? selectedOption.value : '');
            setOtherInternetSource(false);
        } else {
            setSelectedInternetSource(selectedOption ? selectedOption.value : '');
            setOtherInternetSource(true);
        }
    };

    const handleInitialCategory = (referral_type) => {
        if (['existing_client', 'other_client'].includes(referral_type)) {
            setSelectedReferralCategory('client');
        } else if (['employee', 'employee_network'].includes(referral_type)) {
            setSelectedReferralCategory('employee');
        } else if (['existing_agency', 'other_agency'].includes(referral_type)) {
            setSelectedReferralCategory('travel_agency');
        } else {
            setSelectedReferralCategory(referral_type);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && editClientData) {
            setOriginalReferringClient(editClientData.referred_by_display_name);
            setOriginalConsultant(editClientData.cb_primary_agent_name);
            handleInitialCategory(editClientData.referral_type);
            setSelectedReferralType(editClientData.referral_type);
            setSelectedReferringClientId(editClientData.referred_by_id);
            setReferredByName(editClientData.referred_by_name);
            setNotes(editClientData.notes);
            setIsAudited(editClientData.notes);
        }
    }, [isOpen, editClientData]);

    const resetFormState = () => {
        // referral-related
        setSelectedReferringClientId(null);
        setReferralAgencyName(null);
        setReferralAgentName(null);
        setSelectedReferralCategory(null);
        setSelectedReferralType(null);
        setReferredByName('');
        setNotes('');
        setIsAudited(null);
        // non-referral-related
        // setSelectedPrimaryAgentName(null);
        setReassign(false);
        setDeceased(false);
        setDoNotContact(false);
        setMovedBusiness(false);
    };

    const resetReferralState = () => {
        setSelectedReferringClientId(null);
        setSelectedReferralCategory(null);
        setSelectedReferralType(null);
        setReferralAgencyName(null);
        setReferralAgentName(null);
        setReferredByName('');
        setNotes('');
        setIsAudited(null);
    };

    const saveForm = (clientToSubmit) => {
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

    const handleSave = (e, status) => {
        e.preventDefault();
        const clientToSubmit = {
            client_id: editClientData.id || null,
            first_name: editClientData.first_name,
            last_name: editClientData.last_name,
            referral_type: selectedReferralType || null,
            referred_by_id: selectedReferringClientId || null,
            referred_by_name: referredByName || null,
            notes: notes || null,
            // save with audited true if user indicated completion
            // handle with isAudited in case it came in earlier
            audited: status === 'complete' ? true : false,
            cb_primary_agent_name: selectedPrimaryAgentName || editClientData.cb_primary_agent_name,
            deceased: deceased,
            doNotContact: doNotContact,
            movedBusiness: movedBusiness,
            updated_by: userDetails.email || ''
        };
        console.log(clientToSubmit);
        // saveForm(clientToSubmit);
    };

    const handleCategoryChange = (category) => {
        resetReferralState();
        setSelectedReferralCategory(category);
        if (category === "client") {
            setSelectedReferralType('existing_client');
        } else if (category === "employee") {
            setSelectedReferralType('employee');
        } else if (category === "travel_agency") {
            setSelectedReferralType('existing_agency');
        }
    };

    // const handleFreeTypedAgency = (value, type) => {
    //     if (type === 'agency') {
    //         setReferralAgencyName(value);
    //         setSelectedReferringAgencyId(null);
    //     } else if (type === 'agent') {
    //         setReferralAgentName(value);
    //     }
        
    //     // Combine agency and agent names when both are available
    //     if (referralAgencyName && referralAgentName) {
    //         setReferredByName(`${referralAgencyName} - ${referralAgentName}`);
    //     } else if (referralAgencyName) {
    //         setReferredByName(referralAgencyName);
    //     } else if (referralAgentName) {
    //         setReferredByName(referralAgentName);
    //     } else {
    //         setReferredByName("");  // Set to empty string if neither is typed
    //     }
    // };

    console.log("selectedReferringAgencyId: " + selectedReferringAgencyId);
    console.log("referralAgencyName: " + referralAgencyName);
    console.log("referralAgentName: " + referralAgentName);
    console.log("referredByName: " + referredByName);

    const handleFreeTypedAgency = (value, type) => {
        if (type === 'agency') {
            setReferralAgencyName(value);
            setSelectedReferringAgencyId(null);
        } else if (type === 'agent') {
            setReferralAgentName(value);
        }
    };

    useEffect(() => {
        if (selectedReferralType === 'other_agency') {
            const combinedName = `${referralAgencyName || ''} - ${referralAgentName || ''}`.trim();
            setReferredByName(combinedName);
        } else if (selectedReferralType === 'existing_agency') {
            setReferredByName(referralAgentName);
        }
    }, [referralAgencyName, referralAgentName, selectedReferralType]);
    

    return (
        <div id="add-edit-modal" className="modal referral-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '10px' }}>
                    Edit Referral for {editClientData?.display_name || 'Client'}
                </h4>
                <div className="container" style={{ width: '90%' }}>
                    <div className="row">
                        <span
                            className={`chip ${reassign ? 'tb-teal' : 'tb-grey lighten-3'}`}
                            onClick={() => {
                                setReassign(!reassign);
                                setSelectedPrimaryAgentName(null);
                            }}
                        >
                            Re-Assign Consultant
                        </span>
                        {reassign &&
                            <div className="card">
                                <div className="card-content">
                                    <div className="row" style={{marginBottom: '0px'}}>
                                        <div className="col s5">
                                            <p className="text-bold">{originalConsultant}</p>
                                            <span className="text-small">Original Consultant</span>
                                        </div>
                                        <div className="col s2" style={{fontSize: '2rem'}}>
                                            <span className="material-symbols-outlined">
                                                arrow_forward
                                            </span>
                                        </div>
                                        <div className="col s5">
                                            <Select
                                                placeholder="Select new primary agent"
                                                inputId="agent_select"
                                                value={primaryAgentOptions.find(agent => agent.value === selectedPrimaryAgentName) || ''}
                                                onChange={(selectedOption) => {
                                                    setSelectedPrimaryAgentName(selectedOption ? selectedOption.value : '');
                                                }}
                                                options={primaryAgentOptions}
                                                isClearable
                                                style={{ flexGrow: '1', width: '60%' }}
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                    <div className="row" style={{marginTop: '15px'}}>
                        <div className="col s6">
                            <span className="tb-teal-text text-bold">
                                Previously referred by:
                            </span>
                            <br/>
                            <span>{originalReferringClient || 'none'}</span>
                        </div>
                        <div className="col s6">
                            <span className="tb-teal-text text-bold">CB marketing sources: </span>
                            <br/>
                            {Array.isArray(editClientData?.cb_marketing_sources) && editClientData?.cb_marketing_sources.length > 0 ? (
                                editClientData?.cb_marketing_sources.map((source, index) => (
                                    <span key={index}>
                                        {source}
                                    </span>
                                ))
                            ) : (
                                <>
                                    <span className="">
                                        <span className="material-symbols-outlined">
                                            live_help
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'left', marginTop: '15px' }}>
                        <form id="referralForm">
                            <div className="row center">
                                <span
                                    className={`btn-small ${selectedReferralCategory === 'client' ? 'tb-teal' : 'tb-grey lighten-2'}`}
                                    onClick={() => handleCategoryChange("client")}
                                    style={{marginRight: '10px'}}
                                >
                                    Client
                                </span>
                                <span
                                    className={`btn-small ${selectedReferralCategory === 'employee' ? 'tb-teal' : 'tb-grey lighten-2'}`}
                                    style={{marginRight: '10px'}}
                                    onClick={() => handleCategoryChange("employee")}
                                >
                                    Employee
                                </span>
                                <span className={`btn-small ${selectedReferralCategory === 'internet' ? 'tb-teal' : 'tb-grey lighten-2'}`}
                                    onClick={() => handleCategoryChange("internet")}
                                    style={{marginRight: '10px'}}
                                >
                                    Internet
                                </span>
                                <span className={`btn-small ${selectedReferralCategory === 'travel_agency' ? 'tb-teal' : 'tb-grey lighten-2'}`}
                                    onClick={() => handleCategoryChange("travel_agency")}
                                    style={{marginRight: '10px'}}
                                >
                                    Travel Agency
                                </span>
                                <span className={`btn-small ${selectedReferralCategory === 'third_party' ? 'tb-teal' : 'tb-grey lighten-2'}`}
                                    onClick={() => handleCategoryChange("third_party")}

                                >
                                    Event/Third Party
                                </span>
                            </div>
                            <div className="row center" style={{marginTop: '40px'}}>
                                {/* Client */}
                                {selectedReferralCategory === 'client' &&
                                <>
                                    <div className="row center" style={{marginTop: '40px', marginBottom: '40px'}}>
                                        <div className="col s6">
                                            <label htmlFor="existing_client">
                                                <input
                                                    type="radio"
                                                    id="existing_client"
                                                    // className="filled-in"
                                                    checked={selectedReferralType === "existing_client"}
                                                    onChange={() => {
                                                        setSelectedReferralType('existing_client');
                                                        setReferredByName(null);
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        how_to_reg
                                                    </span>
                                                    Existing client
                                                </span>
                                            </label>
                                        </div>
                                        <div className="col s6">
                                            <label htmlFor="other_client">
                                                <input
                                                    type="radio"
                                                    id="other_client"
                                                    // className="filled-in tb-teal"
                                                    checked={selectedReferralType === "other_client"}
                                                    onChange={(e) => {
                                                        setSelectedReferralType('other_client');
                                                        setSelectedReferringClientId(null);
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        border_color
                                                    </span>
                                                    Other client
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="row center" style={{ width: '70%'}}>
                                    {selectedReferralType === "existing_client" &&
                                        <Select
                                            placeholder="Select referring client"
                                            inputId="client_select"
                                            value={clientOptions.find(client => client.value === selectedReferringClientId) || ''}
                                            onChange={(selectedOption) => {
                                                setSelectedReferringClientId(selectedOption ? selectedOption.value : '');
                                            }}
                                            options={clientOptions}
                                            isClearable
                                            style={{ flexGrow: '1', width: '60%' }}
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
                                    }
                                    {selectedReferralType === "other_client" &&
                                    <div className="input-field col s12 l12">
                                        <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                            person_add
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Client's name (Last/First)"
                                            value={referredByName || ''}
                                            onChange={(e) => setReferredByName(e.target.value)}
                                            className="search-input" 
                                        />
                                    </div>
                                    }
                                </div>
                                </>
                                }
                                {/* Employee */}
                                {selectedReferralCategory === 'employee' &&
                                <>
                                    <div className="row center" style={{marginTop: '40px', marginBottom: '40px'}}>
                                        <div className="col s6">
                                            <label htmlFor="employee">
                                                <input
                                                    type="radio"
                                                    id="employee"
                                                    // className="filled-in"
                                                    checked={selectedReferralType === "employee"}
                                                    onChange={() => {
                                                        setSelectedReferralType('employee');
                                                        setReferredByName(null);
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        how_to_reg
                                                    </span>
                                                    Employee - Direct
                                                </span>
                                            </label>
                                        </div>
                                        <div className="col s6">
                                            <label htmlFor="employee_network">
                                                <input
                                                    type="radio"
                                                    id="employee_network"
                                                    // className="filled-in tb-teal"
                                                    checked={selectedReferralType === "employee_network"}
                                                    onChange={(e) => {
                                                        setSelectedReferralType('employee_network');
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        diversity_1
                                                    </span>
                                                    Employee's Network
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="row center" style={{ width: '70%', marginBottom: '0px'}}>
                                        <Select
                                            placeholder="Select referring employee"
                                            inputId="employee_select"
                                            value={employeeOptions.find(employee => employee.value === selectedReferringEmployeeId) || ''}
                                            onChange={(selectedOption) => {
                                                setSelectedReferringEmployeeId(selectedOption ? selectedOption.value : '');
                                            }}
                                            options={employeeOptions}
                                            isClearable
                                            style={{ flexGrow: '1', width: '60%' }}
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
                                        {selectedReferralType === "employee_network" &&
                                            <div className="input-field col s12 l12" style={{marginTop: '30px'}}>
                                                <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                    border_color
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="Employee contact's name (Last/First)"
                                                    value={referredByName || ''}
                                                    onChange={(e) => setReferredByName(e.target.value)}
                                                    className="search-input" 
                                                />
                                            </div>
                                        }
                                    </div>
                                </>
                                }
                                {/* Travel Agency */}
                                {selectedReferralCategory === 'travel_agency' &&
                                <>
                                    <div className="row center" style={{marginTop: '40px', marginBottom: '40px'}}>
                                        <div className="col s6">
                                            <label htmlFor="existing_agency">
                                                <input
                                                    type="radio"
                                                    id="existing_agency"
                                                    // className="filled-in"
                                                    checked={selectedReferralType === "existing_agency"}
                                                    onChange={() => {
                                                        setReferralAgencyName(null);
                                                        setSelectedReferralType('existing_agency');
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        store
                                                    </span>
                                                    Existing agency
                                                </span>
                                            </label>
                                        </div>
                                        <div className="col s6">
                                            <label htmlFor="other_agency">
                                                <input
                                                    type="radio"
                                                    id="other_agency"
                                                    // className="filled-in tb-teal"
                                                    checked={selectedReferralType === "other_agency"}
                                                    onChange={(e) => {
                                                        setSelectedReferralType('other_agency');
                                                    }}
                                                />
                                                <span className="text-bold">
                                                    <span className="material-symbols-outlined">
                                                        border_color
                                                    </span>
                                                    Other agency
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="row center" style={{ width: '70%'}}>
                                        {selectedReferralType === "existing_agency" &&
                                        <Select
                                            placeholder="Select referring travel agency"
                                            inputId="agency_select"
                                            value={agencyOptions.find(agency => agency.value === selectedReferringAgencyId) || ''}
                                            onChange={(selectedOption) => {
                                                setSelectedReferringAgencyId(selectedOption ? selectedOption.value : '');
                                            }}
                                            options={agencyOptions}
                                            isClearable
                                            style={{ flexGrow: '1', width: '60%' }}
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
                                        }
                                        {selectedReferralType === "other_agency" &&
                                        <div className="input-field col s12 l12">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                store
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Agency name"
                                                value={referralAgencyName || ''}
                                                onChange={(e) => {
                                                    handleFreeTypedAgency(e.target.value, "agency");
                                                }}
                                                className="search-input"
                                            />
                                        </div>
                                        }
                                        <div className="input-field col s12 l12">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                badge
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Agent's name (Last/First)"
                                                value={referralAgentName || ''}
                                                onChange={(e) => handleFreeTypedAgency(e.target.value, "agent")}
                                                className="search-input" 
                                            />
                                        </div>
                                </div>
                                </>
                                }
                                {/* Internet */}
                                {selectedReferralCategory === 'internet' &&
                                <>
                                    <div className="row center" style={{ width: '70%'}}>
                                    <Select
                                        placeholder="Select internet source"
                                        inputId="internet_select"
                                        value={internetOptions.find(source => source.value === selectedInternetSource) || ''}
                                        onChange={handleInternetSelectChange}
                                        options={internetOptions}
                                        isClearable
                                        style={{ flexGrow: '1', width: '60%' }}
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
                                    {otherInternetSource &&
                                        <div className="input-field col s12 l12" style={{marginTop: '30px'}}>
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                language
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Name of source"
                                                value={referredByName || ''}
                                                onChange={(e) => setReferredByName(e.target.value)}
                                                className="search-input"
                                            />
                                        </div>
                                    }
                                </div>
                                </>
                                }
                                {/* Third Party */}
                                {selectedReferralCategory === 'third_party' &&
                                <div className="row center" style={{ width: '90%', marginBottom: '0px'}}>
                                    <div className="input-field col s12 l12">
                                        <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                            volunteer_activism
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Name of organization (zoo, church, non-profit, etc.) or event"
                                            value={referredByName || ''}
                                            onChange={(e) => setReferredByName(e.target.value)}
                                            className="search-input" 
                                        />
                                    </div>
                                </div>
                                }
                            </div>
                            <div className="row">
                                <div className="input-field col s12">
                                    <span className="tb-grey-text text-darken-3">
                                        Other Notes
                                    </span>
                                    <textarea
                                        maxLength='200'
                                        style={{marginBottom: '0px', paddingBottom: '0px'}}
                                        value={notes || ''}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="materialize-textarea input-placeholder-dark trip-report-comments"
                                    />
                                    <span className="text-small tb-grey-text text-darken-3">
                                        Max 200 Characters
                                    </span>
                                    {/* <label for="textarea1">Other Notes</label> */}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="container">
                <div className="card">
                    <div className="card-content">
                        <p className="tb-grey-text">Other Info</p>
                        <div className="row center" style={{paddingTop: '10px'}}>
                            <div className="col s4">
                                <label htmlFor="deceased">
                                    <input
                                        type="checkbox"
                                        id="deceased"
                                        // className="filled-in"
                                        checked={deceased}
                                        onChange={() => {
                                            setDeceased(!deceased);
                                        }}
                                    />
                                    <span className="text-bold" style={{paddingLeft: '20px'}}>
                                        <span className="material-symbols-outlined">
                                            skull
                                        </span>
                                        Deceased
                                    </span>
                                </label>
                            </div>
                            <div className="col s4">
                                <label htmlFor="do_not_contact">
                                    <input
                                        type="checkbox"
                                        id="do_not_contact"
                                        // className="filled-in"
                                        checked={doNotContact}
                                        onChange={() => {
                                            setDoNotContact(!doNotContact);
                                        }}
                                    />
                                    <span className="text-bold" style={{paddingLeft: '20px'}}>
                                        <span className="material-symbols-outlined">
                                            block
                                        </span>
                                        Do not contact
                                    </span>
                                </label>
                            </div>
                            <div className="col s4">
                                <label htmlFor="moved_business">
                                    <input
                                        type="checkbox"
                                        id="moved_business"
                                        // className="filled-in"
                                        checked={movedBusiness}
                                        onChange={() => {
                                            setMovedBusiness(!movedBusiness);
                                        }}
                                    />
                                    <span className="text-bold" style={{paddingLeft: '20px'}}>
                                        <span className="material-symbols-outlined">
                                            move_location
                                        </span>
                                        Moved business
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div className="center" style={{ paddingBottom: '20px' }}>
                    <button className="btn modal-close waves-effect waves-light error-red" onClick={onClose}>
                        Close
                    </button>
                    &nbsp;&nbsp;
                    <button
                        type="submit"
                        form="referralForm"
                        onClick={(e) => handleSave(e, "incomplete")}
                        className="btn waves-effect waves-light tb-teal lighten-1"
                    >
                        Save for later
                    </button>
                    &nbsp;&nbsp;
                    <button
                        type="submit"
                        form="referralForm"
                        onClick={(e) => handleSave(e, "complete")}
                        className="btn waves-effect waves-light success-green"
                    >
                        Save + Complete
                    </button>
                </div>
            </div>
        </div>
    )

}

export default EditReferralModal;
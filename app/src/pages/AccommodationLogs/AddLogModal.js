import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useRole } from '../../components/RoleContext';
import M from 'materialize-css';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const AddLogModal = ({ isOpen, onClose, onRefresh, editLogData = null, isEditMode = false }) => {
    const [accommodationLogs, setAccommodationLogs] = useState([{}]);
    const { role, userName } = useRole();
    const [primaryTraveler, setPrimaryTraveler] = useState('');
    const [numPax, setNumPax] = useState(1);
    const [selectedConsultantId, setSelectedConsultantId] = useState(null);
    const [selectedAgencyId, setSelectedAgencyId] = useState(null);
    const [isNewAgency, setIsNewAgency] = useState(false);
    const [newAgencyName, setNewAgencyName] = useState('');
    const [properties, setProperties] = useState([]);
    const [countries, setCountries] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [bookingChannels, setBookingChannels] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [userNewPropertyInteractions, setUserNewPropertyInteractions] = useState({});
    const [touched, setTouched] = useState({
        primaryTraveler: false,
        agency: false
    });

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editLogData) {
            setAccommodationLogs([editLogData]);
            setPrimaryTraveler(editLogData.primary_traveler);
            setNumPax(editLogData.num_pax);
            setSelectedAgencyId(editLogData.agency_id);
            setSelectedConsultantId(editLogData.consultant_id);
        }
    }, [isOpen, isEditMode, editLogData]);


    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('add-log-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen) return;

        // Fetch properties
        fetch(`${process.env.REACT_APP_API}/v1/properties`)
            .then((res) => res.json())
            .then((data) => {
                const formattedProperties = data.map((property) => ({
                    value: property.id,
                    label: property.name,
                    portfolio: property.portfolio_name,
                    country_name: property.country_name,
                    core_destination_name: property.core_destination_name
                }));
                setProperties(formattedProperties);
            })
            .catch((err) => console.error(err));

        // Fetch countries
        fetch(`${process.env.REACT_APP_API}/v1/countries`)
            .then((res) => res.json())
            .then((data) => {
                const formattedCountries = data.map((country) => ({
                    value: country.id,
                    label: country.name,
                    core_destination_name: country.core_destination_name,
                    core_destination_id: country.core_destination_id
                }));
                setCountries(formattedCountries);
            })
            .catch((err) => console.error(err));

        // Fetch consultants
        fetch(`${process.env.REACT_APP_API}/v1/consultants`)
            .then((res) => res.json())
            .then((data) => {
                const formattedConsultants = data.map((consultant) => ({
                    value: consultant.id,
                    label: consultant.display_name
                }));
                setConsultants(formattedConsultants);
            })
            .catch((err) => console.error(err));

        // Fetch countries
        fetch(`${process.env.REACT_APP_API}/v1/booking_channels`)
            .then((res) => res.json())
            .then((data) => {
                const formattedBookingChannels = data.map((booking_channel) => ({
                    value: booking_channel.id,
                    label: booking_channel.name,
                }));
                setBookingChannels(formattedBookingChannels);
            })
            .catch((err) => console.error(err));

        // Fetch countries
        fetch(`${process.env.REACT_APP_API}/v1/agencies`)
            .then((res) => res.json())
            .then((data) => {
                const formattedAgencies = data.map((agency) => ({
                    value: agency.id,
                    label: agency.name,
                }));
                setAgencies(formattedAgencies);
            })
            .catch((err) => console.error(err));
    }, [isOpen, onClose]);

    const addLogEntry = () => {
        setAccommodationLogs([...accommodationLogs, {}]);
    };

    const resetFormState = () => {
        setAccommodationLogs([{}]);
        setNumPax(1);
        setPrimaryTraveler('');
        setSelectedConsultantId(null);
        setSelectedAgencyId(null);
        setNewAgencyName('');
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

    const validateConsultant = (value) => {
        if (!(value || '').trim()) {
            return 'Missing consultant';
        }
        return '';
    };

    const validateAgency = () => {
        if (!touched.agency) {
            return '';
        }
        // If not a new agency, check if an existing agency is selected
        if (!isNewAgency && !selectedAgencyId) {
            return 'Missing agency';
        }
        // If a new agency, check if the new agency name is provided
        if (isNewAgency && !newAgencyName.trim()) {
            return 'Missing agency name';
        }
        // If everything is fine, return an empty string
        return '';
    };

    const updateAgencyValidation = () => {
        const agencyError = validateAgency();
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            agency: agencyError,
        }));
    };

    useEffect(() => {
        updateAgencyValidation();
    }, [isNewAgency, newAgencyName, selectedAgencyId]);

    const validateNumPax = (value) => {
        const num = parseInt(value, 10);
        if (num < 1) return 'Number of passengers must be greater than 0';
        if (num > 50) return 'Number of passengers must be less than 50';
        return '';
    };

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

        // Ensure each log includes the primary traveler's name and the selected consultant when submitting
        const logsToSubmit = accommodationLogs.map(log => ({
            ...log,
            log_id: log.id || null,
            primary_traveler: primaryTraveler,
            num_pax: numPax,
            agency_id: selectedAgencyId || null,
            consultant_id: selectedConsultantId,
            new_agency_name: newAgencyName || null,
            booking_channel_id: log.booking_channel_id ? (log.booking_channel_id !== '' ? log.booking_channel_id : null) : null,
            updated_by: userName || ''
        }));
        if (role !== 'admin') {
            M.toast({
                html: 'Your entry was valid, but only admins are able to save to the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logsToSubmit, null, 2),
            })
                .then(response => response.json())
                .then(data => {
                    // Handle success response
                    const insertedCount = data?.inserted_count ?? 0;
                    const updatedCount = data?.updated_count ?? 0;
                    const message = data?.message ?? "No logs were processed.";
                    let toastHtml = '';
                    if (insertedCount > 0) {
                        toastHtml = `Added ${insertedCount} log(s) to the database.`;
                    } if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} log(s) in the database.`;
                    } else {
                        // Use the message from the response if no logs were added
                        toastHtml = message;
                    }
                    M.toast({
                        html: toastHtml,
                        displayLength: 4000,
                        classes: 'green darken-1',
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
                        html: 'Your entry was valid, but was unable to save to the database.',
                        displayLength: 4000,
                        classes: 'amber darken-1',
                    });
                });
            // }
        }

    };

    const handlePrimaryTravelerChange = (e) => {
        const value = e.target.value;
        setPrimaryTraveler(value);

        // Only validate in real-time if the field has been touched
        if (touched.primaryTraveler) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                primaryTraveler: validatePrimaryTraveler(value),
            }));
        }
    };

    const handleAgencyChange = (selectedOption) => {
        setTouched(prev => ({ ...prev, agency: true }));
        setSelectedAgencyId(selectedOption ? selectedOption.value : '');
        // Note: No need to set validation errors here as it's handled by useEffect
    };

    const handleNewAgencyNameChange = (e) => {
        setTouched(prev => ({ ...prev, agency: true }));
        const value = e.target.value;
        setNewAgencyName(value);
        // Note: No need to log here; also, commented out code related to consultant validation is not relevant to this context
    };

    const handlePrimaryTravelerBlur = () => {
        setTouched(prev => ({ ...prev, primaryTraveler: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            primaryTraveler: validatePrimaryTraveler(primaryTraveler),
        }));
    };

    const handleConsultantChange = (selectedOption) => {
        setSelectedConsultantId(selectedOption ? selectedOption.value : '');
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            consultant: validateConsultant(selectedOption ? selectedOption.value : ''),
        }));
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

        const updatedLogs = accommodationLogs.map((log) => {
            if (log.date_in && log.date_out) {
                return {
                    ...log,
                    bed_nights: calculateBedNights(log.date_in, log.date_out, parsedNumPax),
                };
            }
            return log;
        });

        setAccommodationLogs(updatedLogs);
    };

    const calculateBedNights = (dateIn, dateOut, numPax) => {
        // Skip calculation if either date is not set
        if (!dateIn || !dateOut) {
            return 0;
        }
        const startDate = moment(dateIn);
        const endDate = moment(dateOut);
        const diffDays = endDate.diff(startDate, 'days');
        return !isNaN(diffDays) && diffDays >= 0 ? diffDays * numPax : 0;
    };

    const validateLogEntry = (log) => {
        let logError = {};

        if (!log.date_in) logError.date_in = 'Missing check-in date';
        if (!log.date_out) logError.date_out = 'Missing check-out date';
        if (!log.property_id && !log.new_property_name) {
            logError.property = 'Missing property';
        } else if (!log.property_id) {
            if (!((log.new_property_name || '').trim())) logError.new_property_name = 'Missing new property name';
            if (!log.new_property_country_id) logError.new_property_country_id = 'Missing new property country';
        }
        if (!log.booking_channel_id && !log.new_booking_channel_name) {
            logError.property = 'Missing booking channel';
        }

        return logError;
    };

    const validateDateIn = (dateIn) => {
        if (!dateIn) return 'Missing check-in date';
        return '';
    };

    const validateDateOut = (dateOut) => {
        if (!dateOut) return 'Missing check-out date';
        return '';
    };

    const validateBookingChannel = (bookingChannel) => {
        if (!bookingChannel) return 'Missing booking channel';
        return '';
    };

    const validateDateRange = (dateIn, dateOut) => {
        // Skip validation if either date is not set
        if (!dateIn || !dateOut) {
            return '';
        }

        // Convert string dates to moment objects
        const checkInDate = moment(dateIn);
        const checkOutDate = moment(dateOut);

        // Check if check-in date is after check-out date
        if (checkInDate.isAfter(checkOutDate)) {
            return 'Check-in date must be before check-out date';
        }

        // Check if the stay is longer than 30 days
        const duration = checkOutDate.diff(checkInDate, 'days');
        if (duration > 30) {
            return 'Stay cannot be longer than 30 days';
        }
        if (duration === 0) {
            return 'Check-in and check-out dates cannot be the same';
        }

        // If both checks pass, return an empty string indicating no errors
        return '';
    };

    const validateDateOverlaps = (logs) => {
        // This function will store any date overlap errors
        let overlapErrors = [];

        // Iterate through each log and compare it against all other logs
        for (let i = 0; i < logs.length; i++) {
            for (let j = i + 1; j < logs.length; j++) {
                // Convert string dates to moment objects for easy comparison
                const logADateIn = moment(logs[i].date_in);
                const logADateOut = moment(logs[i].date_out);
                const logBDateIn = moment(logs[j].date_in);
                const logBDateOut = moment(logs[j].date_out);

                // Check for overlap
                if (logADateIn.isBefore(logBDateOut) && logADateOut.isAfter(logBDateIn)) {
                    // If there's an overlap, add an error message for these logs
                    overlapErrors.push(`Overlapping dates between property ${i + 1} and property ${j + 1}`);
                }
            }
        }

        return overlapErrors;
    };

    const validateProperty = (log, index) => {
        const errors = {};
        const hasInteractedNewProperty = userNewPropertyInteractions[index];

        // property_id is not set and it is not a new property
        if (!log.property_id && !log.is_new_property) {
            errors.property = 'Missing property';
        }
        // user is entering a new property and user has interacted
        if (log.is_new_property && hasInteractedNewProperty) {
            if (!log.new_property_name) errors.newPropertyName = "Missing new property name";
            if (!log.new_property_country_id) errors.newPropertyCountry = "Missing new property country";
        }

        return errors;
    };


    const validateForm = () => {
        let errors = {};

        if (!(primaryTraveler || '').trim()) {
            errors.primaryTraveler = 'Missing primary traveler';
        }
        if (!(selectedConsultantId || '').trim()) {
            errors.consultant = 'Missing consultant';
        }
        if (!(selectedAgencyId || '').trim() && !newAgencyName) {
            errors.agency = 'Missing agency';
        }
        if (parseInt(numPax, 10) < 1) {
            errors.numPax = 'Number of passengers is less than 0';
        }
        if (parseInt(numPax, 10) > 50) {
            errors.numPax = 'Number of passengers exceeds limit of 50';
        }

        let logErrors = accommodationLogs.map(log => validateLogEntry(log));

        if (logErrors.some(error => Object.keys(error).length > 0)) {
            errors.logs = logErrors;
        }

        // Validate date overlaps
        const dateOverlapErrors = validateDateOverlaps(accommodationLogs);
        if (dateOverlapErrors.length > 0) {
            errors.date_overlaps = dateOverlapErrors;
        }

        setValidationErrors(errors);

        // Determine if the form is valid based on the presence of errors
        return Object.keys(errors).length === 0;
    };

    const handleLogChange = (index, field, value) => {
        const updatedLogs = [...accommodationLogs];
        if (!updatedLogs[index]) updatedLogs[index] = {};
        updatedLogs[index][field] = value;

        // Initialize logErrors from current validationErrors state or create a new array if undefined
        const logErrors = validationErrors.logs ? [...validationErrors.logs] : [];

        // Ensure there's an object to hold errors for the current log
        if (!logErrors[index]) logErrors[index] = {};

        // Check if dates are provided to calculate bed nights
        if (field === 'date_in' || field === 'date_out') {
            const log = updatedLogs[index];
            updatedLogs[index].bed_nights = calculateBedNights(log.date_in, log.date_out, numPax);
            const dateRangeError = validateDateRange(log.date_in, log.date_out);
            if (dateRangeError) {
                logErrors[index].date_range = dateRangeError;
            } else {
                delete logErrors[index].date_range; // Remove the key if no error
            }
        }

        if (['new_property_name', 'new_property_country_id', 'new_property_portfolio_name'].includes(field)) {
            setUserNewPropertyInteractions({
                ...userNewPropertyInteractions,
                [index]: true
            });
        }

        // Validate the changed field only
        switch (field) {
            case 'date_in':
                const dateInError = validateDateIn(value);
                if (dateInError) {
                    logErrors[index].date_in = dateInError;
                } else {
                    delete logErrors[index].date_in; // Remove the key if no error
                }
                break;
            case 'date_out':
                const dateOutError = validateDateOut(value);
                if (dateOutError) {
                    logErrors[index].date_out = dateOutError;
                } else {
                    delete logErrors[index].date_out; // Remove the key if no error
                }
                break;
            case 'booking_channel_id':
                const bookingChannelError = validateBookingChannel(value);
                if (bookingChannelError) {
                    logErrors[index].booking_channel = bookingChannelError;
                } else {
                    delete logErrors[index].booking_channel; // Remove the key if no error
                }
                break;
            default:
                break;
        }

        if (['property_id', 'new_property_name', 'new_property_country_id', 'new_property_portfolio_name', 'is_new_property'].includes(field)) {
            const propertyErrors = validateProperty(updatedLogs[index], index);

            // Clear previous property-related errors
            Object.keys(logErrors[index]).forEach(errorKey => {
                if (errorKey.startsWith('newProperty') || errorKey === 'property') {
                    delete logErrors[index][errorKey];
                }
            });

            // Apply new property-related errors
            Object.assign(logErrors[index], propertyErrors);
        }

        // Update both the logs and validation errors state
        setAccommodationLogs(updatedLogs);
        setValidationErrors(prevErrors => ({ ...prevErrors, logs: logErrors }));
    };


    const handleRemoveClick = (index) => {
        // Remove the log entry at the specified index
        const updatedLogs = [...accommodationLogs];
        updatedLogs.splice(index, 1);
        setAccommodationLogs(updatedLogs);

        // Remove any corresponding validation errors for the log entry
        const updatedErrors = validationErrors.logs ? [...validationErrors.logs] : [];
        updatedErrors.splice(index, 1);

        // Update the validationErrors state with the updated errors array
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            logs: updatedErrors,
            date_overlaps: [],
        }));
    };



    return (
        <div id="add-log-modal" className="modal add-log-modal">
            <div className="modal-content">
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Service Provider Entry
                </h4>
                <div style={{ textAlign: 'left', marginTop: '50px' }}>
                    <form id="logForm" onSubmit={handleFormSubmit}>
                        {/* Trip Information Section */}
                        {/* <div className="teal-text text-lighten-3">Trip Details</div> */}
                        {(validationErrors.primaryTraveler || validationErrors.consultant || validationErrors.numPax || validationErrors.agency) && (
                            <div className="row" style={{ marginBottom: '20px' }}>
                                {validationErrors.primaryTraveler && (
                                    <div className="chip red lighten-4 text-bold">{validationErrors.primaryTraveler}</div>
                                )}
                                {validationErrors.consultant && (
                                    <div className="chip red lighten-4 text-bold">{validationErrors.consultant}</div>
                                )}
                                {validationErrors.numPax && (
                                    <div className="chip red lighten-4 text-bold">{validationErrors.numPax}</div>
                                )}
                                {validationErrors.agency && (
                                    <div className="chip red lighten-4 text-bold">{validationErrors.agency}</div>
                                )}
                            </div>
                        )}
                        <div className="row" style={{ marginBottom: '60px' }}>
                            {/* Primary Traveler Name Field */}
                            <div className="col s3">
                                <input
                                    type="text"
                                    id="primary_traveler"
                                    value={primaryTraveler}
                                    onChange={handlePrimaryTravelerChange}
                                    onBlur={handlePrimaryTravelerBlur}
                                    placeholder="Name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.primaryTraveler ? 'invalid' : ''}
                                />
                                <label htmlFor="primary_traveler">
                                    <span className="material-symbols-outlined">
                                        hiking
                                    </span>
                                    Primary Traveler (Last/First)

                                </label>
                                {/* <span className="helper-text" data-error="wrong" data-success="right">Enter the full name of the primary traveler</span> */}
                            </div>

                            <div className="col s1" style={{ textAlign: 'center' }}>
                                {/* Number of Pax Numeric Selection */}
                                < input
                                    type="number"
                                    id="num_pax"
                                    value={numPax}
                                    onChange={(e) => handleNumPaxChange(e.target.value)}
                                    placeholder="#"
                                    style={{ marginBottom: '10px', textAlign: 'center' }}
                                    className={validationErrors.numPax ? 'invalid' : ''}
                                />
                                <label htmlFor="num_pax">
                                    <span className="material-symbols-outlined">
                                        airplane_ticket
                                    </span>
                                    Pax
                                </label>
                            </div>

                            <div className="col s4">

                                {role === 'admin' ? (
                                    <>
                                        {!isNewAgency ? (
                                            <Select
                                                placeholder="Select agency"
                                                id="agency_select"
                                                value={agencies.find(agency => agency.value === selectedAgencyId) || ''}
                                                onChange={handleAgencyChange}
                                                options={agencies}
                                                isClearable
                                                style={{ flexGrow: '1' }}
                                                classNamePrefix="select"
                                                className={validationErrors.agency ? 'invalid-select' : ''}
                                                styles={{
                                                    control: (provided, state) => ({
                                                        ...provided,
                                                        borderColor: validationErrors.agency ? 'red' : provided.borderColor,
                                                        '&:hover': {
                                                            borderColor: validationErrors.agency ? 'darkred' : provided['&:hover'].borderColor,
                                                        },
                                                        boxShadow: state.isFocused ? (validationErrors.agency ? '0 0 0 1px darkred' : provided.boxShadow) : 'none',
                                                    })
                                                }}
                                            />

                                        ) : (
                                            <input
                                                type="text"
                                                id="new_agency_name"
                                                value={newAgencyName}
                                                onChange={handleNewAgencyNameChange}
                                                placeholder="Agency Name"
                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                            />
                                        )}
                                        <label htmlFor="new_agency_name">
                                            <span className="material-symbols-outlined">
                                                contact_mail
                                            </span>
                                            Agency Name
                                        </label>
                                        {(!selectedAgencyId && !newAgencyName) && (
                                            <div>
                                                <em className="grey-text text-lighten-1">
                                                    <a
                                                        className="text-bold new-existing-prop teal-text text-lighten-2"
                                                        href="/#"
                                                        onClick={() => {
                                                            setIsNewAgency(false);
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            manage_search
                                                        </span>
                                                        Existing Agency
                                                    </a>
                                                    &nbsp;or&nbsp;

                                                    <a
                                                        className="text-bold new-existing-prop green-text text-lighten-2"
                                                        href="/#"
                                                        onClick={() => setIsNewAgency(true)} >
                                                        <span className="material-symbols-outlined">
                                                            add_circle
                                                        </span>
                                                        New Agency
                                                    </a>
                                                </em>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <Select
                                                placeholder="Select agency"
                                                id="agency_select"
                                                value={agencies.find(agency => agency.value === selectedAgencyId) || ''}
                                                onChange={handleAgencyChange}
                                                options={agencies}
                                                isClearable
                                                style={{ flexGrow: '1' }}
                                                classNamePrefix="select"
                                                className={validationErrors.agency ? 'invalid-select' : ''}
                                                styles={{
                                                    control: (provided, state) => ({
                                                        ...provided,
                                                        borderColor: validationErrors.agency ? 'red' : provided.borderColor,
                                                        '&:hover': {
                                                            borderColor: validationErrors.agency ? 'darkred' : provided['&:hover'].borderColor,
                                                        },
                                                        boxShadow: state.isFocused ? (validationErrors.agency ? '0 0 0 1px darkred' : provided.boxShadow) : 'none',
                                                    })
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="col s4">
                                <Select
                                    placeholder="Select Consultant"
                                    id="consultant_select"
                                    value={consultants.find(cons => cons.value === selectedConsultantId) || ''}
                                    onChange={handleConsultantChange}
                                    options={consultants}
                                    isClearable
                                    style={{ flexGrow: '1' }}
                                    classNamePrefix="select" // Use this for prefixing generated class names
                                    className={validationErrors.consultant ? 'invalid-select' : ''} // This class is for the container
                                    styles={{
                                        control: (provided, state) => ({
                                            ...provided,
                                            borderColor: validationErrors.consultant ? 'red' : provided.borderColor,
                                            '&:hover': {
                                                borderColor: validationErrors.consultant ? 'darkred' : provided['&:hover'].borderColor,
                                            },
                                            boxShadow: state.isFocused ? (validationErrors.consultant ? '0 0 0 1px darkred' : provided.boxShadow) : 'none',
                                        })
                                    }}
                                />
                                <label htmlFor="consultant_select">
                                    <span className="material-symbols-outlined">
                                        badge
                                    </span>
                                    Consultant Name
                                </label>
                            </div>
                        </div>

                        {validationErrors.date_overlaps && validationErrors.date_overlaps.length > 0 && (
                            <div className="row">
                                {validationErrors.date_overlaps.map((errorMessage, index) => (
                                    <div key={index} className="chip red lighten-4 text-bold">
                                        {errorMessage}
                                    </div>
                                ))}
                            </div>
                        )}

                        {accommodationLogs.map((log, index) => (
                            // <>
                            <div key={index} style={{ marginBottom: '20px' }}>
                                <div className="row">
                                    <div className="col s11">
                                        {!isEditMode &&
                                            <div className="chip teal accent-4 text-bold">{index + 1}</div>
                                        }
                                        {log.bed_nights > 0 &&
                                            <div className="chip blue lighten-2">
                                                <span className="text-bold">
                                                    Bed Nights:&nbsp;
                                                </span>
                                                {log.bed_nights}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    dark_mode
                                                </span>
                                            </div>
                                        }
                                        {(log.portfolio_name || log.new_property_portfolio_name) &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Portfolio:&nbsp;
                                                </span>
                                                {log.portfolio_name || log.new_property_portfolio_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    store
                                                </span>
                                            </div>
                                        }
                                        {(log.country_name || log.new_property_country_name) &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Country:&nbsp;
                                                </span>
                                                {log.country_name || log.new_property_country_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    globe
                                                </span>
                                            </div>
                                        }
                                        {(log.core_destination_name || log.new_property_core_destination_name) &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Core Destination:&nbsp;
                                                </span>
                                                {log.core_destination_name || log.new_property_core_destination_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    explore
                                                </span>
                                            </div>
                                        }


                                    </div>

                                    <div className="col s1" style={{ textAlign: 'right' }}>
                                        {!isEditMode &&
                                            <a
                                                className="btn-floating btn-small waves-effect waves-light red lighten-2"
                                                href="/#"
                                                onClick={() => handleRemoveClick(index)}>
                                                <i className="material-icons">remove</i>
                                            </a>
                                        }
                                    </div>
                                </div>
                                {validationErrors.logs && validationErrors.logs[index] && Object.keys(validationErrors.logs[index]).length > 0 && (
                                    <div className="row">
                                        {Object.keys(validationErrors.logs[index]).map((errorKey) => (
                                            <div key={errorKey} className="chip red lighten-4 text-bold">
                                                {validationErrors.logs[index][errorKey]}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Property Info */}
                                {role === 'admin' ? (
                                    <>
                                        {(!log.property_id && !(log.new_property_name && log.new_property_country_id && log.new_property_portfolio_name)) && (
                                            <div className="row">
                                                <div>
                                                    <em className="grey-text text-lighten-1">
                                                        Please select an&nbsp;
                                                        <a
                                                            className="text-bold new-existing-prop teal-text text-lighten-2"
                                                            href="/#"
                                                            onClick={() => {
                                                                handleLogChange(index, 'is_new_property', false);
                                                                handleLogChange(index, 'new_property_country_id', '');
                                                                handleLogChange(index, 'new_property_core_destination_name', '');
                                                                handleLogChange(index, 'new_property_core_destination_id', '');
                                                                handleLogChange(index, 'new_property_name', '');
                                                                handleLogChange(index, 'new_property_portfolio_name', '');
                                                                handleLogChange(index, 'new_property_country_name', '');
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                manage_search
                                                            </span>
                                                            Existing Property
                                                        </a>
                                                        &nbsp;or&nbsp;

                                                        <a
                                                            className="text-bold new-existing-prop green-text text-lighten-2"
                                                            href="/#"
                                                            onClick={() => handleLogChange(index, 'is_new_property', true)}>
                                                            <span className="material-symbols-outlined">
                                                                add_circle
                                                            </span>
                                                            New Property
                                                        </a>
                                                    </em>
                                                </div>
                                            </div>
                                        )
                                        }



                                        <div className="row">
                                            {!log.is_new_property ? (
                                                <div className="col s12">
                                                    <Select
                                                        placeholder="Search for a property"
                                                        id="property_select"
                                                        value={properties.find(prop => prop.value === log.property_id) || ''}
                                                        onChange={(selectedOption) => {
                                                            handleLogChange(index, 'property_id', selectedOption ? selectedOption.value : '');
                                                            handleLogChange(index, 'property_name', selectedOption ? selectedOption.label : '');
                                                            handleLogChange(index, 'portfolio_name', selectedOption ? selectedOption.portfolio : '');
                                                            handleLogChange(index, 'country_name', selectedOption ? selectedOption.country_name : '');
                                                            handleLogChange(index, 'core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                                        }}
                                                        options={properties}
                                                        isClearable
                                                    />
                                                    <label htmlFor="property_select">
                                                        <span className="material-symbols-outlined">
                                                            hotel
                                                        </span>
                                                        Property Name
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="col s12">
                                                    <div className="card new-property-card cyan lighten-5">
                                                        <div className="card-content">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <em className="grey-text">
                                                                    Creating a new property...&nbsp;
                                                                </em>
                                                                <a
                                                                    className="text-bold new-existing-prop red-text text-lighten-3"
                                                                    href="/#"
                                                                    onClick={() => {
                                                                        handleLogChange(index, 'is_new_property', false);
                                                                        handleLogChange(index, 'new_property_country_id', '');
                                                                        handleLogChange(index, 'new_property_core_destination_name', '');
                                                                        handleLogChange(index, 'new_property_core_destination_id', '');
                                                                        handleLogChange(index, 'new_property_name', '');
                                                                        handleLogChange(index, 'new_property_portfolio_name', '');
                                                                        handleLogChange(index, 'new_property_country_name', '');
                                                                    }}
                                                                >
                                                                    Cancel
                                                                    <span className="material-symbols-outlined">
                                                                        close
                                                                    </span>
                                                                </a>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col s6">
                                                                    <input
                                                                        type="text"
                                                                        id="new_property_name"
                                                                        value={log.new_property_name || ''}
                                                                        onChange={(e) => handleLogChange(index, 'new_property_name', e.target.value)}
                                                                        placeholder="Property Name"
                                                                        style={{ marginRight: '10px', flexGrow: '1' }}
                                                                    />
                                                                    <label htmlFor="new_property_name">
                                                                        <span className="material-symbols-outlined">
                                                                            hotel
                                                                        </span>
                                                                        Property Name
                                                                    </label>
                                                                </div>
                                                                <div className="col s6">
                                                                    <input
                                                                        type="text"
                                                                        id="new_property_portfolio_name"
                                                                        value={log.new_property_portfolio_name || ''}
                                                                        onChange={(e) => handleLogChange(index, 'new_property_portfolio_name', e.target.value)}
                                                                        placeholder="Portfolio Name"
                                                                        style={{ marginRight: '10px', flexGrow: '1' }}
                                                                    />
                                                                    <label htmlFor="new_property_portfolio_name">
                                                                        <span className="material-symbols-outlined">
                                                                            store
                                                                        </span>
                                                                        Portfolio Name
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col s6">
                                                                    <Select
                                                                        placeholder="Select Country"
                                                                        value={countries.find(prop => prop.value === log.new_property_country_id) || ''}
                                                                        onChange={(selectedOption) => {
                                                                            handleLogChange(index, 'new_property_country_id', selectedOption ? selectedOption.value : '');
                                                                            handleLogChange(index, 'new_property_core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                                                            handleLogChange(index, 'new_property_core_destination_id', selectedOption ? selectedOption.core_destination_id : '');
                                                                            handleLogChange(index, 'new_property_country_name', selectedOption ? selectedOption.label : '');
                                                                        }}
                                                                        options={countries}
                                                                        isClearable
                                                                        style={{ flexGrow: '1' }}
                                                                        id="new_country_select"
                                                                    />
                                                                    <label htmlFor="new_country_select">
                                                                        <span className="material-symbols-outlined">
                                                                            globe
                                                                        </span>
                                                                        Country Name
                                                                    </label>
                                                                </div>
                                                                <div className="col s6">
                                                                    {log.new_property_core_destination_name &&
                                                                        <div className="chip">
                                                                            <span className="text-bold">
                                                                                Core Destination:&nbsp;
                                                                            </span>
                                                                            {log.new_property_core_destination_name}
                                                                            &nbsp;
                                                                            <span className="material-symbols-outlined">
                                                                                explore
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                            }
                                        </div>
                                    </>
                                ) : (
                                    <div className="col s12">
                                        <Select
                                            placeholder="Search for a property"
                                            id="property_select"
                                            value={properties.find(prop => prop.value === log.property_id) || ''}
                                            onChange={(selectedOption) => {
                                                handleLogChange(index, 'property_id', selectedOption ? selectedOption.value : '');
                                                handleLogChange(index, 'property_name', selectedOption ? selectedOption.label : '');
                                                handleLogChange(index, 'portfolio_name', selectedOption ? selectedOption.portfolio : '');
                                                handleLogChange(index, 'country_name', selectedOption ? selectedOption.country_name : '');
                                                handleLogChange(index, 'core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                            }}
                                            options={properties}
                                            isClearable
                                        />
                                        <label htmlFor="property_select">
                                            <span className="material-symbols-outlined">
                                                hotel
                                            </span>
                                            Property Name
                                        </label>
                                    </div>
                                )}


                                <div className="row">
                                    <div className="col s3">

                                        {/* Date In Selector */}
                                        <div>
                                            <ReactDatePicker
                                                selected={log.date_in ? moment(log.date_in).toDate() : null}
                                                onChange={(date) => {
                                                    handleLogChange(index, 'date_in', date ? moment(date).format('YYYY-MM-DD') : '');
                                                }}
                                                isClearable
                                                placeholderText="Select date in"
                                                className="date-input"
                                                dateFormat="MM/dd/yyyy"
                                            />
                                        </div>
                                        <label htmlFor="date_in">
                                            <span className="material-symbols-outlined">
                                                flight_land
                                            </span>
                                            Check-In Date
                                        </label>
                                    </div>
                                    <div className="col s3">

                                        {/* Date Out Selector */}
                                        <div>
                                            <div>
                                                <ReactDatePicker
                                                    selected={log.date_out ? moment(log.date_out).toDate() : null}
                                                    onChange={(date) => handleLogChange(index, 'date_out', date ? moment(date).format('YYYY-MM-DD') : '')}
                                                    isClearable
                                                    placeholderText="Select date out"
                                                    className="date-input"
                                                    dateFormat="MM/dd/yyyy"
                                                />
                                            </div>
                                        </div>
                                        <label htmlFor="date_out">
                                            <span className="material-symbols-outlined">
                                                flight_takeoff
                                            </span>
                                            Check-Out Date
                                        </label>
                                    </div>
                                    <div className="col s6">
                                        {role === 'admin' ? (
                                            <>
                                                {!log.is_new_booking_channel ? (
                                                    <Select
                                                        placeholder="Search for a booking channel"
                                                        value={bookingChannels.find(prop => prop.value === log.booking_channel_id) || ''}
                                                        onChange={(selectedOption) => {
                                                            handleLogChange(index, 'booking_channel_id', selectedOption ? selectedOption.value : '');
                                                        }}
                                                        options={bookingChannels}
                                                        isClearable
                                                        style={{ flexGrow: '1' }}
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="new_booking_channel_name"
                                                        value={log.new_booking_channel_name || ''}
                                                        onChange={(e) => handleLogChange(index, 'new_booking_channel_name', e.target.value)}
                                                        placeholder="Booking Channel Name"
                                                        style={{ marginRight: '10px', flexGrow: '1' }}
                                                    />
                                                )}
                                                <label htmlFor="new_booking_channel_name">
                                                    <span className="material-symbols-outlined">
                                                        alt_route
                                                    </span>
                                                    Booking Channel
                                                </label>
                                                {(!log.booking_channel_id && !(log.new_booking_channel_name)) && (
                                                    <div>
                                                        <em className="grey-text text-lighten-1">
                                                            Select an&nbsp;
                                                            <a
                                                                className="text-bold new-existing-prop teal-text text-lighten-2"
                                                                href="/#"
                                                                onClick={() => {
                                                                    handleLogChange(index, 'is_new_booking_channel', false);
                                                                    handleLogChange(index, 'new_booking_channel_name', '');
                                                                }}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    manage_search
                                                                </span>
                                                                Existing Channel
                                                            </a>
                                                            &nbsp;or&nbsp;

                                                            <a
                                                                className="text-bold new-existing-prop green-text text-lighten-2"
                                                                href="/#"
                                                                onClick={() => handleLogChange(index, 'is_new_booking_channel', true)}>
                                                                <span className="material-symbols-outlined">
                                                                    add_circle
                                                                </span>
                                                                New Channel
                                                            </a>
                                                        </em>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div>
                                                <Select
                                                    placeholder="Select booking channel"
                                                    value={bookingChannels.find(prop => prop.value === log.booking_channel_id) || ''}
                                                    onChange={(selectedOption) => {
                                                        handleLogChange(index, 'booking_channel_id', selectedOption ? selectedOption.value : '');
                                                    }}
                                                    options={bookingChannels}
                                                    isClearable
                                                    style={{ flexGrow: '1' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            //{/* <div style={{ textAlign: 'center' }}>
                            //<hr style={{ width: '10%', borderColor: '#000', borderWidth: '1px', margin: '20px auto' }} />
                            //</div> */}
                            // </>
                        ))}
                        {!isEditMode &&
                            <button type="button" className="btn" onClick={addLogEntry}>Add More</button>
                        }
                    </form>
                </div>
                {
                    !isEditMode &&
                    accommodationLogs.length >= 1 &&
                    accommodationLogs.some(log => log.bed_nights && log.property_name) && (
                        <div className="summary-row" style={{ textAlign: 'left', marginTop: '40px' }}>
                            <h5>Summary</h5>
                            <div className="chip blue lighten-4">
                                <span className="text-bold">
                                    Bed Nights:&nbsp;
                                </span>
                                {
                                    accommodationLogs.reduce((acc, log) => acc + (log.bed_nights || 0), 0)
                                }
                                &nbsp;
                                <span className="material-symbols-outlined">
                                    dark_mode
                                </span>
                            </div>
                            <div className="chip blue lighten-4">
                                <span className="text-bold">
                                    Number of properties:&nbsp;
                                </span>
                                {accommodationLogs.length}
                                &nbsp;
                                <span className="material-symbols-outlined">
                                    hotel
                                </span>
                            </div>
                            <div className="chip blue lighten-4">
                                <span className="text-bold">
                                    Start date:&nbsp;
                                </span>
                                {
                                    (() => {
                                        const datesIn = accommodationLogs.map(log => new Date(log.date_in)).filter(date => !isNaN(date));
                                        const earliestDateIn = datesIn.length ? new Date(Math.min(...datesIn)) : 'N/A';
                                        return `${moment(earliestDateIn).format("MMM D, YYYY")}`;
                                    })()
                                }
                                &nbsp;
                                <span className="material-symbols-outlined">
                                    flight_land
                                </span>
                            </div>
                            <div className="chip blue lighten-4">
                                <span className="text-bold">
                                    End date:&nbsp;
                                </span>
                                {
                                    (() => {
                                        const datesOut = accommodationLogs.map(log => new Date(log.date_out)).filter(date => !isNaN(date));
                                        const latestDateOut = datesOut.length ? new Date(Math.max(...datesOut)) : 'N/A';
                                        return `${moment(latestDateOut).format("MMM D, YYYY")}`;
                                    })()
                                }
                                &nbsp;
                                <span className="material-symbols-outlined">
                                    flight_takeoff
                                </span>
                            </div>
                            <div>
                                <span className="text-bold">Properties: </span>
                                {
                                    accommodationLogs
                                        .filter(log => log.property_name) // Filter out logs without a property name
                                        .map((log, index, filteredLogs) =>
                                            // Check if it's the last property to decide whether to add a comma
                                            `${log.property_name}${index < filteredLogs.length - 1 ? ', ' : ''}`
                                        )
                                        .join('') // Join the resulting strings without any additional separator
                                }
                            </div>
                        </div>
                    )
                }
            </div >
            <div className="modal-footer" style={{ marginBottom: '20px' }}>
                <div>
                    <a href="#!" className="btn modal-close waves-effect waves-light red lighten-2" onClick={onClose}>
                        Close
                    </a>
                    &nbsp;&nbsp;
                    <button type="submit" form="logForm" className="btn waves-effect waves-light green">Save</button>
                </div>
            </div>
        </div >
    );
};

export default AddLogModal;

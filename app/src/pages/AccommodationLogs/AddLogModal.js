import React, { useEffect, useState, useCallback } from 'react';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const AddLogModal = ({ isOpen, onClose, onRefresh, editLogData = null, isEditMode = false }) => {
    const [accommodationLogs, setAccommodationLogs] = useState([{}]);
    const { userDetails } = useAuth();
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
    const [portfolios, setPortfolios] = useState([]);
    const [railId, setRailId] = useState('');
    const [shipId, setShipId] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [userNewPropertyInteractions, setUserNewPropertyInteractions] = useState({});
    // const [portfolioNames, setPortfolioNames] = useState([]);
    // const [filteredPortfolioSuggestions, setFilteredPortfolioSuggestions] = useState([]);
    // const [showPortfolioSuggestions, setShowPortfolioSuggestions] = useState(false);
    // const suggestionsRef = useRef(null);
    // TODO? propertyNames, filteredPropertySuggestions, showPropertySuggestions?
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
            // setFilteredPortfolioSuggestions([]);
            // setShowPortfolioSuggestions(false);
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
        fetch(`${process.env.REACT_APP_API}/v1/properties`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {

                const formattedProperties = data.map((property) => ({
                    value: property.id,
                    label: `${property.name} (${property.country_name || property.core_destination_name})`,
                    name: property.name,
                    portfolio_id: property.portfolio_id,
                    portfolio_name: property.portfolio_name,
                    country_name: property.country_name,
                    core_destination_name: property.core_destination_name
                }));
                setProperties(formattedProperties);
                // const portfolioNames = [...new Set(data.map(property => property.portfolio_name))];
                // setPortfolioNames(portfolioNames);
                // setFilteredPortfolioSuggestions(portfolioNames);
            })
            .catch((err) => console.error(err));

        // Fetch portfolios
        fetch(`${process.env.REACT_APP_API}/v1/portfolios`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const formattedPortfolios = data.map((portfolio) => ({
                    value: portfolio.id,
                    label: portfolio.name
                }));
                setPortfolios(formattedPortfolios);
            })
            .catch((err) => console.error(err));

        // Fetch countries
        fetch(`${process.env.REACT_APP_API}/v1/countries`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
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

        // Fetch core destinations
        fetch(`${process.env.REACT_APP_API}/v1/core_destinations`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(res => res.json())
            .then((data) => {
                // Handle core destinations data
                const formattedCoreDestinations = data.map(core_dest => ({
                    value: core_dest.id,
                    label: core_dest.name
                }));
                const railId = formattedCoreDestinations.find(dest => dest.label === "Rail")?.value;
                const shipId = formattedCoreDestinations.find(dest => dest.label === "Ship")?.value;
                setRailId(railId || '');
                setShipId(shipId || '');
            })
            .catch((err) => console.error(err));



        // Fetch consultants
        fetch(`${process.env.REACT_APP_API}/v1/consultants`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const sortedConsultants = data.sort((a, b) => {
                    // Sort by is_active, true before false
                    if (a.is_active && !b.is_active) return -1;
                    if (!a.is_active && b.is_active) return 1;

                    // Then sort alphabetically by last_name
                    const lastNameA = a.last_name.toUpperCase();
                    const lastNameB = b.last_name.toUpperCase();
                    if (lastNameA < lastNameB) return -1;
                    if (lastNameA > lastNameB) return 1;

                    return 0;
                });

                const formattedConsultants = sortedConsultants.map((consultant) => ({
                    value: consultant.id,
                    label: `${consultant.display_name} ${consultant.is_active ? '' : '(inactive)'}`,
                }));
                setConsultants(formattedConsultants);
            })
            .catch((err) => console.error(err));

        // Fetch countries
        fetch(`${process.env.REACT_APP_API}/v1/booking_channels`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const directOption = data.find(channel => channel.name === "Direct");
                const otherOptions = data.filter(channel => channel.name !== "Direct");
                const formattedBookingChannels = [directOption, ...otherOptions].map((booking_channel) => ({
                    value: booking_channel.id,
                    label: booking_channel.name,
                }));
                setBookingChannels(formattedBookingChannels);
            })
            .catch((err) => console.error(err));

        // Fetch countries
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
                setAgencies(formattedAgencies);
            })
            .catch((err) => console.error(err));
    }, [isOpen, onClose, userDetails.token]);

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
        setIsNewAgency(false);
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

    const validateAgency = useCallback(() => {
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
    }, [isNewAgency, newAgencyName, selectedAgencyId, touched.agency]);

    const updateAgencyValidation = useCallback(() => {
        const agencyError = validateAgency();
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            agency: agencyError,
        }));
    }, [validateAgency, setValidationErrors]);

    useEffect(() => {
        updateAgencyValidation();
    }, [updateAgencyValidation, isNewAgency, newAgencyName, selectedAgencyId]);

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
                classes: 'error-red',
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
            // if property_id was selected, but then changed to new_property, set property_id as null instead of ''
            property_id: log.new_property_name || log.new_property_portfolio_id || log.new_property_country_id || log.new_property_core_destination_id ? null : log.property_id,
            new_property_name: log.new_property_name || null,
            new_property_portfolio_name: log.new_property_portfolio_name || null,
            new_property_portfolio_id: log.new_property_portfolio_id || null,
            new_property_country_id: log.new_property_country_id || null,
            new_property_core_destination_id: log.new_property_core_destination_id || null,
            new_property_core_destination_name: log.new_property_core_destination_name || null,
            updated_by: userDetails.email || ''
        }));
        console.log(logsToSubmit);
        if (userDetails.role !== 'admin' && userDetails.role !== 'user') {
            M.toast({
                html: 'Your entry was valid, but only admins & users are able to save to the database.',
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
            // }
        }

    };

    const handleDelete = () => {
        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Only admins are able to delete from the database at this time.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        }
        else {
            const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
            if (confirmDelete) {
                const entryId = accommodationLogs.length > 0 ? accommodationLogs[0].id : null;
                if (!entryId) {
                    M.toast({ html: 'Error: No entry ID found', classes: 'error-red' });
                    return;
                }
                // Replace `/your-api-endpoint/` with the actual endpoint and `entryId` with the actual ID
                fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs/${entryId}`, {
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
                        M.toast({ html: 'Entry successfully deleted', classes: 'success-green' });
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Handle error - show error message
                        M.toast({ html: 'Error deleting entry', classes: 'error-red' });
                    });
            }
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
    };

    const handleNewAgencyNameChange = (e) => {
        setTouched(prev => ({ ...prev, agency: true }));
        const value = e.target.value;
        setNewAgencyName(value);
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

        let dateRangeErrors = validateDateRange(log.date_in, log.date_out);
        if (dateRangeErrors) {
            logError.date_range = dateRangeErrors;
        }

        // Validate property
        if (!log.property_id) { // This check is sufficient to cover both cases where new property might be involved
            if (!((log.new_property_name || '').trim())) logError.new_property_name = 'Missing new property name';

            // Conditionally require new_property_country_id based on coreDestination not being "ship" or "rail"
            if (!log.new_property_country_id &&
                !(
                    log.new_property_core_destination_name === "Ship" ||
                    log.new_property_core_destination_name === "Rail"
                )
            ) {
                logError.new_property_country_id = 'Missing new property country';
            }
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

            // Only validate new_property_country_id if neither ship nor rail is selected
            if (!log.new_property_country_id &&
                !(
                    log.new_property_core_destination_name === "Ship" ||
                    log.new_property_core_destination_name === "Rail"
                )
            ) {
                errors.newPropertyCountry = "Missing new property country";
            }
        }

        return errors;
    };

    const validateForm = () => {
        let errors = {};
        const namePattern = /^[^/]+\/[^/]+$/;

        if (!(primaryTraveler || '').trim()) {
            errors.primaryTraveler = 'Missing primary traveler';
        } else if (!namePattern.test(primaryTraveler.trim())) {
            errors.primaryTraveler = 'Please enter the name in "Last/First" format';
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

        const isShipOrRail = updatedLogs[index].new_property_core_destination_name === "Ship" ||
            updatedLogs[index].new_property_core_destination_name === "Rail" ||
            updatedLogs[index].new_property_core_destination_id === shipId ||
            updatedLogs[index].new_property_core_destination_id === railId;

        if (field === 'new_property_core_destination_name' && (value === "Ship" || value === "Rail")) {
            // Directly toggle "Ship"/"Rail" and their respective ids
            updatedLogs[index][field] = updatedLogs[index][field] === value ? '' : value;
            // Toggle the id only if setting, not clearing (since clearing would be handled by country change logic)
            if (value === "Ship" || value === "Rail") {
                updatedLogs[index]['new_property_core_destination_id'] = value === "Ship" ? shipId : railId;
            }
        } else if (field === 'new_property_country_id') {
            // Update country related fields only if not currently set to "Ship" or "Rail"
            if (!isShipOrRail) {
                updatedLogs[index]['new_property_country_id'] = value;
                // Assume country change logic to fetch and set new_property_core_destination_name and id here if necessary
            }
        } else {
            // For fields other than core_destination_name or country_id, update normally
            updatedLogs[index][field] = value;
        }

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

        if (['new_property_name', 'new_property_country_id', 'new_property_portfolio_id'].includes(field)) {
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

        if (['property_id', 'new_property_name', 'new_property_country_id', 'new_property_core_destination_name', 'new_property_portfolio_id'].includes(field)) {
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

    const handlePropertyChange = (index, fieldOrSelectedOption, value) => {
        if (typeof fieldOrSelectedOption === 'string') {
            // It's a direct input change, handle it accordingly
            handleLogChange(index, fieldOrSelectedOption, value);

            // if (fieldOrSelectedOption === 'new_property_portfolio_name') {
            //     if (value.trim() === '') {
            //         // If the input is empty, clear suggestions and don't show the list
            //         setFilteredPortfolioSuggestions(portfolioNames);
            //         setShowPortfolioSuggestions(true);
            //     } else {
            //         // Filter and show suggestions based on the input
            //         const filtered = portfolioNames.filter(portfolioName =>
            //             portfolioName.toLowerCase().includes(value.toLowerCase())
            //         );
            //         setFilteredPortfolioSuggestions(filtered);
            //         setShowPortfolioSuggestions(true);
            //     }
            // }
        } else {
            // It's a selection from the dropdown
            const selectedOption = fieldOrSelectedOption;
            handleLogChange(index, 'property_id', selectedOption ? selectedOption.value : '');
            handleLogChange(index, 'property_name', selectedOption ? selectedOption.label : '');
            handleLogChange(index, 'portfolio_id', selectedOption ? selectedOption.portfolio_id : '');
            handleLogChange(index, 'portfolio_name', selectedOption ? selectedOption.portfolio_name : '');
            handleLogChange(index, 'country_name', selectedOption ? selectedOption.country_name : '');
            handleLogChange(index, 'core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
        }

        // Check and apply business rule for portfolio vs booking channel regardless of input type
        validatePropertyAndBookingChannel(index);
    };

    const handleBookingChannelChange = (index, fieldOrSelectedOption, value) => {
        if (typeof fieldOrSelectedOption === 'string') {
            // It's a direct input change for a free-typed booking channel
            handleLogChange(index, fieldOrSelectedOption, value);
        } else {
            // It's a selection from the dropdown
            const selectedOption = fieldOrSelectedOption;
            // Update booking channel based on selection
            handleLogChange(index, 'booking_channel_id', selectedOption ? selectedOption.value : '');
            handleLogChange(index, 'booking_channel_name', selectedOption ? selectedOption.label : '');
        }

        // Check and apply business rule for portfolio vs booking channel regardless of input type
        validatePropertyAndBookingChannel(index);
    };

    // const validatePropertyAndBookingChannel = (index) => {
    //     const log = accommodationLogs[index];
    //     // const portfolioName = log.portfolio_name || log.new_property_portfolio_name || '';

    //     // TODO see if need to look for "Elewana" booking channel too
    //     const cheliAndPeacockChannelId = bookingChannels.find(channel => channel.label === "Cheli & Peacock")?.value;
    //     const directChannelId = bookingChannels.find(channel => channel.label === "Direct")?.value;

    //     const elewanaPortfolioId = portfolios.find(portfolio => portfolio.label === "Elewana Collection")?.value;

    //     if (log.portfolio_id === elewanaPortfolioId && log.booking_channel_id === cheliAndPeacockChannelId) {
    //         // Automatically change booking channel to Direct if conditions are met
    //         M.toast({
    //             html: "Booking channel automatically changed to Direct",
    //             displayLength: 4000,
    //             classes: 'success-green darken-1',
    //         });
    //         handleLogChange(index, 'booking_channel_id', directChannelId);

    //     }
    // };
    const validatePropertyAndBookingChannel = (index) => {
        const log = accommodationLogs[index];

        // Retrieve the 'Direct' channel ID once at the beginning to improve performance
        const directChannelId = bookingChannels.find(channel => channel.label.trim().toLowerCase() === "direct")?.value;

        // Special case handling for "Elewana" portfolio and "Cheli & Peacock" booking channel
        const cheliAndPeacockChannelId = bookingChannels.find(channel => channel.label.trim().toLowerCase() === "cheli & peacock")?.value;
        const elewanaPortfolioId = portfolios.find(portfolio => portfolio.label.trim().toLowerCase() === "elewana collection")?.value;

        // Special case handling for "Ecoventura" portfolio and "Galapagos Network/Ecoventura" booking channel
        const galapagosChannelId = bookingChannels.find(channel => channel.label.trim().toLowerCase() === "galapagos network/ecoventura")?.value;
        const ecoventuraPortfolioId = portfolios.find(portfolio => portfolio.label.trim().toLowerCase() === "ecoventura")?.value;
        // Special case handling for properties Magashi, Sabyinyo, Bisate and "Thousand Hills Rwanda" booking channel
        const magashiPropertyId = properties.find(prop => prop.name.trim().toLowerCase() === "wilderness magashi")?.value;
        const bisatePropertyId = properties.find(prop => prop.name.trim().toLowerCase() === "wilderness bisate")?.value;
        const sabyinyoPropertyId = properties.find(prop => prop.name.trim().toLowerCase() === "wilderness sabyinyo")?.value;
        const thousandHillsChannelId = bookingChannels.find(channel => channel.label.trim().toLowerCase() === "thousand hills rwanda")?.value;

        // First check for the special case
        if (log.portfolio_id === elewanaPortfolioId && log.booking_channel_id === cheliAndPeacockChannelId) {
            // Automatically change booking channel to Direct if conditions are met
            M.toast({
                html: "Booking channel automatically changed to 'Direct' for Elewana Collection",
                displayLength: 4000,
                classes: 'success-green',
            });
            handleLogChange(index, 'booking_channel_id', directChannelId);
        } else if (
            (log.property_id === magashiPropertyId
                || log.property_id === bisatePropertyId
                || log.property_id === sabyinyoPropertyId)
            && log.booking_channel_id === thousandHillsChannelId) {
            // Automatically change booking channel to Direct if conditions are met
            M.toast({
                html: "Booking channel automatically changed to 'Direct' for Thousand Hills Rwanda",
                displayLength: 4000,
                classes: 'success-green',
            });
            handleLogChange(index, 'booking_channel_id', directChannelId);
        } else if (log.portfolio_id === ecoventuraPortfolioId && log.booking_channel_id === galapagosChannelId) {
            // Automatically change booking channel to Direct if conditions are met
            M.toast({
                html: "Booking channel automatically changed to 'Direct' for Ecoventura",
                displayLength: 4000,
                classes: 'success-green',
            });
            handleLogChange(index, 'booking_channel_id', directChannelId);
        } else {
            // General case: match booking channel with portfolio name exactly (case-insensitive and trimmed)
            const portfolioName = portfolios.find(portfolio => portfolio.value === log.portfolio_id)?.label.trim().toLowerCase();
            const bookingChannelName = bookingChannels.find(channel => channel.value === log.booking_channel_id)?.label.trim().toLowerCase();

            if (portfolioName && bookingChannelName && portfolioName === bookingChannelName) {
                // If the names match, automatically consider the booking channel as "Direct"
                M.toast({
                    html: "Booking channel automatically changed to 'Direct' due to matching names",
                    displayLength: 4000,
                    classes: 'success-green',
                });
                handleLogChange(index, 'booking_channel_id', directChannelId);
            }
        }
    };


    // const selectPortfolioSuggestion = (index, suggestion) => {
    //     handlePropertyChange(index, 'new_property_portfolio_name', suggestion);
    //     setFilteredPortfolioSuggestions([]);
    //     setShowPortfolioSuggestions(false);
    // };

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
        <div id="add-log-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="tb-grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Service Provider Entry&nbsp;&nbsp;
                    {isEditMode &&
                        <button
                            className="btn waves-effect waves-light error-red"
                            onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined tb-grey-text text-darken-2" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                delete_forever
                            </span>
                        </button>
                    }
                </h4>

                <div style={{ textAlign: 'left', marginTop: '50px' }}>
                    <form id="logForm" onSubmit={handleFormSubmit}>
                        {(validationErrors.primaryTraveler || validationErrors.consultant || validationErrors.numPax || validationErrors.agency) && (
                            <div className="row" style={{ marginBottom: '20px' }}>
                                {validationErrors.primaryTraveler && (
                                    <div className="chip error-red-light text-bold">{validationErrors.primaryTraveler}</div>
                                )}
                                {validationErrors.consultant && (
                                    <div className="chip error-red-light text-bold">{validationErrors.consultant}</div>
                                )}
                                {validationErrors.numPax && (
                                    <div className="chip error-red-light text-bold">{validationErrors.numPax}</div>
                                )}
                                {validationErrors.agency && (
                                    <div className="chip error-red-light text-bold">{validationErrors.agency}</div>
                                )}
                            </div>
                        )}
                        <div className="row" style={{ marginBottom: '30px' }}>
                            {/* Primary Traveler Name Field */}
                            <div className="col s12 l3">
                                <input
                                    type="text"
                                    id="primary_traveler"
                                    value={primaryTraveler}
                                    onChange={handlePrimaryTravelerChange}
                                    onBlur={handlePrimaryTravelerBlur}
                                    placeholder="Name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={`${validationErrors.primaryTraveler ? 'invalid' : ''} input-placeholder-dark`}
                                />
                                <label htmlFor="primary_traveler">
                                    <span className="material-symbols-outlined">
                                        hiking
                                    </span>
                                    Primary Traveler (Last/First)

                                </label>
                            </div>

                            <div className="col s4 l1" style={{ textAlign: 'center' }}>
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

                            <div className="col s8 l4">

                                {userDetails.role === 'admin' ? (
                                    <>
                                        {!isNewAgency ? (
                                            <Select
                                                placeholder="Select agency"
                                                inputId="agency_select"
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
                                                        borderColor: validationErrors.agency ? '#d1685d' : provided.borderColor,
                                                        '&:hover': {
                                                            borderColor: validationErrors.agency ? '#d1685d' : provided['&:hover'].borderColor,
                                                        },
                                                        boxShadow: state.isFocused ? (validationErrors.agency ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                    }),
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

                                        ) : (
                                            <input
                                                type="text"
                                                id="agency_select"
                                                value={newAgencyName}
                                                onChange={handleNewAgencyNameChange}
                                                placeholder="Agency Name"
                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                            />
                                        )}
                                        <label htmlFor="agency_select">
                                            <span className="material-symbols-outlined">
                                                contact_mail
                                            </span>
                                            Agency Name
                                        </label>
                                        {(!selectedAgencyId && !newAgencyName) && (
                                            <div>
                                                <em className="tb-grey-text">
                                                    <a
                                                        className="text-bold new-existing-prop tb-teal-text text-darken-1"
                                                        href="/#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
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
                                                        className="text-bold new-existing-prop success-green-text"
                                                        href="/#"
                                                        onClick={(e) => { e.preventDefault(); setIsNewAgency(true); }} >
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
                                                inputId="agency_select"
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
                                                        borderColor: validationErrors.agency ? '#d1685d' : provided.borderColor,
                                                        '&:hover': {
                                                            borderColor: validationErrors.agency ? '#d1685d' : provided['&:hover'].borderColor,
                                                        },
                                                        boxShadow: state.isFocused ? (validationErrors.agency ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                    }),
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
                                    </>
                                )}
                            </div>

                            <div className="col s12 l4">
                                <Select
                                    placeholder="Select Consultant"
                                    inputId="consultant_select"
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
                                            borderColor: validationErrors.consultant ? '#d1685d' : provided.borderColor,
                                            '&:hover': {
                                                borderColor: validationErrors.consultant ? '#d1685d' : provided['&:hover'].borderColor,
                                            },
                                            boxShadow: state.isFocused ? (validationErrors.consultant ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                        }),
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
                                    <div key={index} className="chip error-red-light text-bold">
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
                                            <div
                                                className="chip tb-teal lighten-2 text-bold"
                                                style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {index + 1}
                                            </div>
                                        }
                                        {log.bed_nights > 0 &&
                                            <div className="chip tb-teal lighten-3">
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
                                        {(log.portfolio_name || log.new_property_portfolio_name || log.property_portfolio) &&
                                            <div className="chip tb-teal lighten-3">
                                                {/* TODO figure out why portfolio name isn't populating */}
                                                <span className="text-bold">
                                                    Portfolio:&nbsp;
                                                </span>
                                                {log.portfolio_name || log.new_property_portfolio_name || log.property_portfolio}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    store
                                                </span>
                                            </div>
                                        }
                                        {(log.country_name || log.new_property_country_name) &&
                                            <div className="chip tb-grey lighten-3">
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
                                            <div className="chip tb-grey lighten-3">
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
                                                className="btn-floating btn-small waves-effect waves-light error-red"
                                                href="/#"
                                                onClick={(e) => { e.preventDefault(); handleRemoveClick(index); }}>
                                                <i className="material-icons">remove</i>
                                            </a>
                                        }
                                    </div>
                                </div>
                                {validationErrors.logs && validationErrors.logs[index] && Object.keys(validationErrors.logs[index]).length > 0 && (
                                    <div className="row">
                                        {Object.keys(validationErrors.logs[index]).map((errorKey) => (
                                            <div key={errorKey} className="chip error-red-light text-bold">
                                                {validationErrors.logs[index][errorKey]}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Property Info */}
                                {userDetails.role === 'admin' ? (
                                    <>
                                        {(!log.property_id && !(log.new_property_name && log.new_property_country_id && log.new_property_portfolio_id)) && (
                                            <div className="row">
                                                <div>
                                                    <em className="tb-grey-text">
                                                        Please select an&nbsp;
                                                        <a
                                                            className="text-bold new-existing-prop tb-teal-text text-darken-1"
                                                            href="/#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleLogChange(index, 'is_new_property', false);
                                                                handleLogChange(index, 'new_property_country_id', '');
                                                                handleLogChange(index, 'new_property_core_destination_name', '');
                                                                handleLogChange(index, 'new_property_core_destination_id', '');
                                                                handleLogChange(index, 'new_property_name', '');
                                                                handleLogChange(index, 'new_property_portfolio_name', '');
                                                                handleLogChange(index, 'new_property_portfolio_id', '');
                                                                handleLogChange(index, 'new_property_country_name', '');
                                                                // handleLogChange(index, 'new_property_is_ship', false);
                                                                // handleLogChange(index, 'new_property_is_rail', '');
                                                                // setShowPortfolioSuggestions(false);
                                                                // setFilteredPortfolioSuggestions(portfolioNames);
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                manage_search
                                                            </span>
                                                            Existing Property
                                                        </a>
                                                        &nbsp;or&nbsp;

                                                        <a
                                                            className="text-bold new-existing-prop success-green-text"
                                                            href="/#"
                                                            onClick={(e) => { e.preventDefault(); handleLogChange(index, 'is_new_property', true); }}>
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
                                                        placeholder="Select property"
                                                        inputId="property_select"
                                                        value={properties.find(prop => prop.value === log.property_id) || ''}
                                                        onChange={(selectedOption) => handlePropertyChange(index, selectedOption)}
                                                        options={properties}
                                                        // styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        classNamePrefix="select"
                                                        styles={{
                                                            control: (provided, state) => ({
                                                                ...provided,
                                                                borderColor: validationErrors?.[index]?.property ? '#d1685d' : provided.borderColor,
                                                                '&:hover': {
                                                                    borderColor: validationErrors?.[index]?.property ? '#d1685d' : provided['&:hover'].borderColor,
                                                                },
                                                                boxShadow: state.isFocused ? (validationErrors?.[index]?.property ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                            }),
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
                                                    <div className="card new-property-card tb-grey lighten-4">
                                                        <div className="card-content">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <em className="tb-grey-text text-darken-1">
                                                                    Creating a new property...&nbsp;
                                                                </em>
                                                                <a
                                                                    className="text-bold new-existing-prop error-red-light-text"
                                                                    href="/#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleLogChange(index, 'is_new_property', false);
                                                                        handleLogChange(index, 'new_property_country_id', '');
                                                                        handleLogChange(index, 'new_property_core_destination_name', '');
                                                                        handleLogChange(index, 'new_property_core_destination_id', '');
                                                                        handleLogChange(index, 'new_property_name', '');
                                                                        handleLogChange(index, 'new_property_portfolio_name', '');
                                                                        handleLogChange(index, 'new_property_portfolio_id', '');
                                                                        handleLogChange(index, 'new_property_country_name', '');
                                                                        // setShowPortfolioSuggestions(false);
                                                                        // setFilteredPortfolioSuggestions(portfolioNames);
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
                                                                        onChange={(e) => handlePropertyChange(index, 'new_property_name', e.target.value)}
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
                                                                <div
                                                                    className="col s6"
                                                                    style={{ position: 'relative' }}
                                                                >
                                                                    <Select
                                                                        placeholder="Select Portfolio"
                                                                        id="portfolio_select"
                                                                        value={portfolios.find(cons => cons.value === log.new_property_portfolio_id) || ''}
                                                                        onChange={(selectedOption) => {
                                                                            handleLogChange(index, 'new_property_portfolio_id', selectedOption ? selectedOption.value : '');
                                                                            handleLogChange(index, 'new_property_portfolio_name', selectedOption ? selectedOption.label : '');
                                                                        }}
                                                                        // onBlur={handleSelectedPortfolioIdBlur}
                                                                        options={portfolios}
                                                                        isClearable
                                                                        style={{ flexGrow: '1' }}
                                                                        classNamePrefix="select" // Use this for prefixing generated class names
                                                                        className={validationErrors.portfolio ? 'invalid-select' : ''} // This class is for the container
                                                                        styles={{
                                                                            control: (provided, state) => ({
                                                                                ...provided,
                                                                                borderColor: validationErrors?.[index]?.portfolio ? '#d1685d' : provided.borderColor,
                                                                                '&:hover': {
                                                                                    borderColor: validationErrors?.[index]?.portfolio ? '#d1685d' : provided['&:hover'].borderColor,
                                                                                },
                                                                                boxShadow: state.isFocused ? (validationErrors?.[index]?.portfolio ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                                            }),
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
                                                                    <label htmlFor="portfolio_select">
                                                                        <span className="material-symbols-outlined">
                                                                            store
                                                                        </span>
                                                                        Portfolio Name
                                                                    </label>
                                                                    {/* <div>
                                                                        <input
                                                                            type="text"
                                                                            id="new_property_portfolio_name"
                                                                            value={log.new_property_portfolio_name || ''}
                                                                            onChange={(e) => handlePropertyChange(index, 'new_property_portfolio_name', e.target.value)}
                                                                            onFocus={() => setShowPortfolioSuggestions(true)}
                                                                            onBlur={(e) => {
                                                                                // First, check if suggestionsRef.current exists to avoid the null reference error
                                                                                if (suggestionsRef.current && e.relatedTarget) {
                                                                                    // Then, check if the relatedTarget is not within the suggestions list
                                                                                    if (!suggestionsRef.current.contains(e.relatedTarget)) {
                                                                                        setShowPortfolioSuggestions(false);
                                                                                    }
                                                                                } else {
                                                                                    // If suggestionsRef.current is null or e.relatedTarget is null, hide the suggestions
                                                                                    setShowPortfolioSuggestions(false);
                                                                                }
                                                                            }}
                                                                            placeholder="Portfolio Name"
                                                                            style={{ marginRight: '10px', flexGrow: '1' }}
                                                                            autoComplete="off"
                                                                        />
                                                                        {showPortfolioSuggestions && filteredPortfolioSuggestions.length > 0 && (
                                                                            <ul className="suggestions-list" ref={suggestionsRef}>
                                                                                {filteredPortfolioSuggestions.map((suggestion, suggestionIndex) => (
                                                                                    <li
                                                                                        key={suggestionIndex}
                                                                                        tabIndex="0"
                                                                                        onClick={() => selectPortfolioSuggestion(index, suggestion)}
                                                                                    >
                                                                                        {suggestion}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                    <label htmlFor="new_property_portfolio_name">
                                                                        <span className="material-symbols-outlined">
                                                                            store
                                                                        </span>
                                                                        Portfolio Name
                                                                    </label> */}
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
                                                                        styles={{
                                                                            control: (provided, state) => ({
                                                                                ...provided,
                                                                                borderColor: validationErrors?.[index]?.new_property_country_id ? '#d1685d' : provided.borderColor,
                                                                                '&:hover': {
                                                                                    borderColor: validationErrors?.[index]?.portfolio ? '#d1685d' : provided['&:hover'].borderColor,
                                                                                },
                                                                                boxShadow: state.isFocused ? (validationErrors?.[index]?.new_property_country_id ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                                            }),
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
                                                                    <div className="row">
                                                                        <div className="col s6">
                                                                            <label>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="filled-in"
                                                                                    checked={log.new_property_core_destination_name === "Ship"}
                                                                                    onChange={(e) => {
                                                                                        handleLogChange(index, 'new_property_core_destination_name', 'Ship');
                                                                                        handleLogChange(index, 'new_property_core_destination_id', shipId);
                                                                                    }}
                                                                                />
                                                                                <span className="text-bold">
                                                                                    <span className="material-symbols-outlined">
                                                                                        directions_boat
                                                                                    </span>
                                                                                    Ship
                                                                                </span>
                                                                            </label>
                                                                        </div>
                                                                        <div className="col s6">
                                                                            <label>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="filled-in tb-teal"
                                                                                    checked={log.new_property_core_destination_name === "Rail"}
                                                                                    onChange={(e) => {
                                                                                        handleLogChange(index, 'new_property_core_destination_name', 'Rail');
                                                                                        handleLogChange(index, 'new_property_core_destination_id', railId);
                                                                                    }}
                                                                                />
                                                                                <span className="text-bold">
                                                                                    <span className="material-symbols-outlined">
                                                                                        train
                                                                                    </span>
                                                                                    Rail
                                                                                </span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
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
                                            placeholder="Select property"
                                            inputId="property_select"
                                            value={properties.find(prop => prop.value === log.property_id) || ''}
                                            onChange={(selectedOption) => handlePropertyChange(index, selectedOption)}
                                            options={properties}
                                            classNamePrefix="select"
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderColor: validationErrors?.[index]?.property ? '#d1685d' : provided.borderColor,
                                                    '&:hover': {
                                                        borderColor: validationErrors?.[index]?.property ? '#d1685d' : provided['&:hover'].borderColor,
                                                    },
                                                    boxShadow: state.isFocused ? (validationErrors?.[index]?.property ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                }),
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
                                    <div className="col s6 l3">

                                        {/* Date In Selector */}
                                        <div>
                                            <ReactDatePicker
                                                id="form-date-in"
                                                selected={log.date_in ? moment(log.date_in).toDate() : null}
                                                onChange={(date) => {
                                                    const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
                                                    handleLogChange(index, 'date_in', newValue);
                                                }}
                                                isClearable
                                                placeholderText="Date in"
                                                className="date-input-modal"
                                                dateFormat="MM/dd/yyyy"
                                                minDate={new Date('2017-01-01')}
                                                maxDate={new Date('2100-12-31')}
                                                autoComplete="off"
                                                openToDate={log.date_out ? moment(log.date_out).subtract(1, 'days').toDate() : new Date()}
                                            />
                                        </div>
                                        <label htmlFor="form-date-in">
                                            <span className="material-symbols-outlined">
                                                flight_land
                                            </span>
                                            Check-In Date
                                        </label>
                                    </div>
                                    <div className="col s6 l3">

                                        {/* Date Out Selector */}
                                        <div>
                                            <div>
                                                <ReactDatePicker
                                                    id="form-date-out"
                                                    selected={log.date_out ? moment(log.date_out).toDate() : null}
                                                    onChange={(date) => {
                                                        const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
                                                        handleLogChange(index, 'date_out', newValue);
                                                    }}
                                                    isClearable
                                                    placeholderText="Date out"
                                                    className="date-input-modal"
                                                    dateFormat="MM/dd/yyyy"
                                                    minDate={new Date('2017-01-01')}
                                                    maxDate={new Date('2100-12-31')}
                                                    autoComplete="off"
                                                    openToDate={log.date_in ? moment(log.date_in).add(1, 'days').toDate() : new Date()}
                                                />
                                            </div>
                                        </div>
                                        <label htmlFor="form-date-out">
                                            <span className="material-symbols-outlined">
                                                flight_takeoff
                                            </span>
                                            Check-Out Date
                                        </label>
                                    </div>
                                    <div className="col s12 l6">
                                        {userDetails.role === 'admin' ? (
                                            <>
                                                {!log.is_new_booking_channel ? (
                                                    <Select
                                                        inputId="booking_channel_select"
                                                        placeholder="Select booking channel"
                                                        value={bookingChannels.find(prop => prop.value === log.booking_channel_id) || ''}
                                                        onChange={(selectedOption) => handleBookingChannelChange(index, selectedOption)}
                                                        options={bookingChannels}
                                                        isClearable
                                                        style={{ flexGrow: '1' }}
                                                        classNamePrefix="select"
                                                        styles={{
                                                            control: (provided, state) => ({
                                                                ...provided,
                                                                borderColor: validationErrors?.[index]?.booking_channel ? '#d1685d' : provided.borderColor,
                                                                '&:hover': {
                                                                    borderColor: validationErrors?.[index]?.booking_channel ? '#d1685d' : provided['&:hover'].borderColor,
                                                                },
                                                                boxShadow: state.isFocused ? (validationErrors?.[index]?.booking_channel ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                            }),
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
                                                ) : (
                                                    <input
                                                        type="text"
                                                        id="booking_channel_select"
                                                        value={log.new_booking_channel_name || ''}
                                                        onChange={(e) => {
                                                            handleBookingChannelChange(index, 'new_booking_channel_name', e.target.value);
                                                            handleBookingChannelChange(index, 'booking_channel_name', e.target.value);
                                                        }}
                                                        placeholder="Booking Channel Name"
                                                        style={{ marginRight: '10px', flexGrow: '1' }}
                                                    />
                                                )}
                                                <label htmlFor="booking_channel_select">
                                                    <span className="material-symbols-outlined">
                                                        alt_route
                                                    </span>
                                                    Booking Channel
                                                </label>
                                                {(!log.booking_channel_id && !(log.new_booking_channel_name)) && (
                                                    <div>
                                                        <em className="tb-grey-text">
                                                            Please select an&nbsp;
                                                            <a
                                                                className="text-bold new-existing-prop tb-teal-text text-darken-1"
                                                                href="/#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
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
                                                                className="text-bold new-existing-prop success-green-text"
                                                                href="/#"
                                                                onClick={(e) => { e.preventDefault(); handleLogChange(index, 'is_new_booking_channel', true); }}>
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
                                                    onChange={(selectedOption) => handleBookingChannelChange(index, selectedOption)}
                                                    options={bookingChannels}
                                                    isClearable
                                                    style={{ flexGrow: '1' }}
                                                    classNamePrefix="select"
                                                    styles={{
                                                        control: (provided, state) => ({
                                                            ...provided,
                                                            borderColor: validationErrors?.[index]?.booking_channel ? '#d1685d' : provided.borderColor,
                                                            '&:hover': {
                                                                borderColor: validationErrors?.[index]?.booking_channel ? '#d1685d' : provided['&:hover'].borderColor,
                                                            },
                                                            boxShadow: state.isFocused ? (validationErrors?.[index]?.booking_channel ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                        }),
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
                            <button type="button" className="btn tb-teal" onClick={addLogEntry}>
                                <span className="material-symbols-outlined">
                                    add
                                </span>
                                Add Property
                            </button>
                        }
                    </form>
                </div>
                {
                    !isEditMode &&
                    accommodationLogs.length >= 1 &&
                    accommodationLogs.some(log => log.bed_nights && log.property_name) && (
                        <div className="summary-row" style={{ textAlign: 'left', marginTop: '40px' }}>
                            {/* TODO figure out why summary isn't populating*/}
                            <h5>Summary</h5>
                            <div className="chip tb-teal lighten-3">
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
                            <div className="chip tb-teal lighten-3">
                                <span className="text-bold">
                                    Number of properties:&nbsp;
                                </span>
                                {accommodationLogs.length}
                                &nbsp;
                                <span className="material-symbols-outlined">
                                    hotel
                                </span>
                            </div>
                            <div className="chip tb-teal lighten-3">
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
                            <div className="chip tb-teal lighten-3">
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
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div>
                    <button className="btn modal-close waves-effect waves-light error-red" onClick={onClose}>
                        Close
                    </button>
                    &nbsp;&nbsp;
                    <button type="submit" form="logForm" className="btn waves-effect waves-light success-green">Save</button>
                </div>
            </div>
        </div >
    );
};

export default AddLogModal;

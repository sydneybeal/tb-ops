import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TricklingDotsPreloader from '../../components/TricklingDotsPreloader';
// import moment from 'moment';

const AddEditPropertyModal = ({ isOpen, onClose, onRefresh, editPropertyData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [loading, setLoading] = useState(false);
    const [propertyId, setPropertyId] = useState(null);
    const [propertyName, setPropertyName] = useState('');
    // const [selectedPortfolioId, setSelectedPortfolioId] = useState(n);
    const [selectedCountryId, setSelectedCountryId] = useState(null);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
    const [selectedCoreDestinationId, setSelectedCoreDestinationId] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [countries, setCountries] = useState([]);
    const [relatedEntries, setRelatedEntries] = useState([]);
    const [portfolios, setPortfolios] = useState([]);
    const [propertyNames, setPropertyNames] = useState([]);
    const [filteredPropertySuggestions, setFilteredPropertySuggestions] = useState([]);
    const [showPropertySuggestions, setShowPropertySuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    const [railId, setRailId] = useState('');
    const [shipId, setShipId] = useState('');
    const [touched, setTouched] = useState({
        propertyName: false,
        portfolioName: false,
        selectedCountryId: false,
        selectedPortfolioId: false,
    });

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

        const propertyToSubmit = {
            property_id: propertyId || null,
            name: propertyName || null,
            portfolio_id: selectedPortfolioId || null,
            country_id: selectedCountryId || null,
            core_destination_id: selectedCoreDestinationId || null,
            updated_by: userDetails.email || ''
        };

        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Your entry was valid, but only admins are able to save to the database at this time.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        }
        else {
            setLoading(true);
            fetch(`${process.env.REACT_APP_API}/v1/properties`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(propertyToSubmit, null, 2),
            })
                .then(response => {
                    if (!response.ok) {
                        setLoading(false);
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    setLoading(false);
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
                        toastHtml = `Added ${insertedCount} property.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} property.`;
                    } else {
                        toastHtml = data?.message ?? "No properties were added.";
                        toastColor = 'error-red';
                    }
                    M.toast({
                        html: toastHtml,
                        displayLength: 4000,
                        classes: toastColor,
                    });
                })
                .finally(() => {
                    setLoading(false);
                    resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    setLoading(false);
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'warning-yellow tb-md-black-text',
                    });
                });
            // }
        }
    };

    const validateForm = () => {
        let errors = {};

        if (!(propertyName || '').trim()) {
            errors.name = 'Missing property name';
        }
        if (!(selectedPortfolioId || '').trim()) {
            errors.portfolio = 'Missing portfolio name';
        }
        const isCountryRequired = selectedCoreDestinationId !== shipId && selectedCoreDestinationId !== railId;
        if (isCountryRequired && !(selectedCountryId || '').trim()) {
            errors.country = 'Missing country';
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

        setLoading(true);


        let promises = [
            fetch(`${process.env.REACT_APP_API}/v1/countries`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            }).then(res => res.json()),
            fetch(`${process.env.REACT_APP_API}/v1/core_destinations`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            }).then(res => res.json()),
            fetch(`${process.env.REACT_APP_API}/v1/portfolios`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            }).then(res => res.json()),
            fetch(`${process.env.REACT_APP_API}/v1/properties`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            }).then(res => res.json()),
        ];

        Promise.all(promises)
            .then((results) => {
                const [countriesData, coreDestinationsData, portfoliosData, propertiesData] = results;
                // Handle countries data
                const formattedCountries = countriesData.map(country => ({
                    value: country.id,
                    label: country.name
                }));
                setCountries(formattedCountries);

                // Handle core destinations data
                const formattedCoreDestinations = coreDestinationsData.map(core_dest => ({
                    value: core_dest.id,
                    label: core_dest.name
                }));
                const railId = formattedCoreDestinations.find(dest => dest.label === "Rail")?.value;
                const shipId = formattedCoreDestinations.find(dest => dest.label === "Ship")?.value;
                setRailId(railId || '');
                setShipId(shipId || '');

                // Handle portfolios data
                const formattedPortfolios = portfoliosData.map(portfolio => ({
                    value: portfolio.id,
                    label: portfolio.name
                }));
                setPortfolios(formattedPortfolios);

                const propertiesMap = propertiesData.reduce((acc, property) => {
                    if (!acc[property.name]) {
                        acc[property.name] = property; // Store the whole object
                    }
                    return acc;
                }, {});

                const uniqueProperties = Object.values(propertiesMap);

                setPropertyNames(uniqueProperties);
                setFilteredPropertySuggestions(uniqueProperties);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen, onClose, userDetails.token]);

    useEffect(() => {
        if (!propertyId || !isOpen) return;

        setLoading(true);

        fetch(`${process.env.REACT_APP_API}/v1/related_entries?identifier=${propertyId}&identifier_type=property_id`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(res => res.json())
            .then((relatedEntriesData) => {
                const parsedRelatedEntries = relatedEntriesData.affected_logs.map(log => JSON.parse(log));
                parsedRelatedEntries.sort((a, b) => {
                    if (a.date_in < b.date_in) {
                        return -1;
                    }
                    if (a.date_in > b.date_in) {
                        return 1;
                    }
                    return 0;
                });
                setRelatedEntries(parsedRelatedEntries);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [propertyId, isOpen, userDetails.token]);



    const handleDelete = () => {
        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Only admins are able to delete from the database at this time.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        }
        else {
            const confirmDelete = window.confirm("Are you sure you want to delete this property?");
            if (confirmDelete) {
                if (!propertyId) {
                    M.toast({
                        html: 'Error: No property ID found',
                        classes: 'error-red',
                        displayLength: 4000
                    });
                    return;
                }
                fetch(`${process.env.REACT_APP_API}/v1/properties/${propertyId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userDetails.token}`,
                    },
                })
                    .then(response => response.json().then(data => ({ status: response.status, body: data })))
                    .then(({ status, body }) => {
                        if (status !== 200) {
                            let errorMessage = body.error || 'Unknown API error';
                            if (body.affected_logs && body.affected_logs.length > 0) {
                                // Parse the JSON string from each detail into an object
                                const affected_logs = body.affected_logs.map(detail => JSON.parse(detail));
                                // Limit the details to 10 for display
                                const limitedDetails = affected_logs.slice(0, 10).map(log =>
                                    `Traveler: ${log.primary_traveler}, Dates: ${log.date_in} to ${log.date_out}`
                                ).join('<br/>');
                                const additionalCount = affected_logs.length - 10;
                                errorMessage += `<br/><br/>${limitedDetails}` +
                                    (additionalCount > 0 ? `<br/>...and ${additionalCount} others` : '');
                            }
                            throw new Error(errorMessage);
                        }
                        // Handle success here
                        M.toast({
                            html: `Property '${propertyName}' successfully deleted`,
                            classes: 'success-green',
                            displayLength: 2000
                        });
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        M.toast({
                            html: error.message,
                            classes: 'error-red',
                            displayLength: 8000
                        });
                    });
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setTouched({});
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editPropertyData) {
            setPropertyId(editPropertyData.id);
            setPropertyName(editPropertyData.name);
            // setPortfolioName(editPropertyData.portfolio_name);
            setSelectedPortfolioId(editPropertyData.portfolio_id);
            setSelectedCountryId(editPropertyData.country_id);
            setSelectedCoreDestinationId(editPropertyData.core_destination_id);
            setTouched({});
            const filtered = propertyNames.filter(property =>
                property.name.toLowerCase().includes(editPropertyData.name.toLowerCase())
            );
            setFilteredPropertySuggestions(filtered);
            setShowPropertySuggestions(false);
        }
    }, [isOpen, isEditMode, editPropertyData, propertyNames]);

    const resetFormState = () => {
        setPropertyId(null);
        setPropertyName('');
        setSelectedCountryId(null);
        setSelectedPortfolioId(null);
        setSelectedCoreDestinationId(null);
        setValidationErrors({});
        setFilteredPropertySuggestions([]);
        setShowPropertySuggestions(false);
        setTouched({});
        setRelatedEntries([]);
    };

    const validatePropertyName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing property name';
        }
        return '';
    };

    const handlePropertyNameChange = (e) => {
        const value = e.target.value;
        setPropertyName(value);

        // Only validate in real-time if the field has been touched
        if (touched.propertyName) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                name: validatePropertyName(value),
            }));
        }
        if (value.trim() === '') {
            // If the input is empty, clear suggestions and don't show the list
            setFilteredPropertySuggestions(propertyNames);
            setShowPropertySuggestions(true);
        } else {
            // Filter and show suggestions based on the input
            const filtered = propertyNames.filter(property =>
                property.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredPropertySuggestions(filtered);
            setShowPropertySuggestions(true);
        }
    };

    const handlePropertyNameBlur = () => {
        setTouched(prev => ({ ...prev, propertyName: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            propertyName: validatePropertyName(propertyName),
        }));
    };

    const selectPropertySuggestion = (suggestion) => {
        console.log(suggestion);
        setPropertyName(suggestion.name);
        setPropertyId(suggestion.id);
        if (touched.propertyName) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                portfolio: validatePropertyName(suggestion.name),
            }));
        }

        setFilteredPropertySuggestions([]);
        setShowPropertySuggestions(false);
    };

    const validateSelectedCountryId = (value) => {
        const isCountryRequired = selectedCoreDestinationId !== shipId && selectedCoreDestinationId !== railId;
        if (isCountryRequired && !(value || '').trim()) {
            return 'Missing country';
        }
        return '';
    };

    const handleSelectedCountryIdChange = (selectedOption) => {
        setSelectedCountryId(selectedOption ? selectedOption.value : '');

        // Only validate in real-time if the field has been touched
        if (touched.selectedCountryId) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                country: validateSelectedCountryId(selectedOption ? selectedOption.value : ''),
            }));
        }
    };

    const handleSelectedCountryIdBlur = () => {
        setTouched(prev => ({ ...prev, selectedCountryId: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            country: validateSelectedCountryId(selectedCountryId),
        }));
    };

    const validateCountry = (coreDestinationId) => {
        const isCountryRequired = coreDestinationId !== shipId && coreDestinationId !== railId;
        if (isCountryRequired && !(selectedCountryId || '').trim()) {
            return 'Missing country';
        }
        return '';
    };

    const validateSelectedPortfolioId = (value) => {
        if (!(value || '').trim()) {
            return 'Missing portfolio';
        }
        return '';
    };


    const handleSelectedPortfolioIdChange = (selectedOption) => {
        setSelectedPortfolioId(selectedOption ? selectedOption.value : '');

        // Only validate in real-time if the field has been touched
        if (touched.selectedPortfolioId) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                portfolio: validateSelectedPortfolioId(selectedOption ? selectedOption.value : ''),
            }));
        }
    };

    const handleSelectedPortfolioIdBlur = () => {
        setTouched(prev => ({ ...prev, selectedPortfolioId: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            portfolio: validateSelectedPortfolioId(selectedPortfolioId),
        }));
    };



    const handleShipChange = (e) => {
        const checked = e.target.checked;
        const newCoreDestinationId = checked ? shipId : null;
        setSelectedCoreDestinationId(newCoreDestinationId);

        // Re-validate selected country when Ship is checked/unchecked
        const countryError = validateCountry(newCoreDestinationId);
        setValidationErrors(prevErrors => {
            // Remove or update the country error based on validation
            if (countryError) {
                return { ...prevErrors, country: countryError };
            } else {
                const { country, ...restErrors } = prevErrors; // Remove the country error
                return restErrors;
            }
        });
    };

    const handleRailChange = (e) => {
        const checked = e.target.checked;
        const newCoreDestinationId = checked ? railId : null;
        setSelectedCoreDestinationId(newCoreDestinationId);

        // Re-validate selected country when Rail is checked/unchecked
        const countryError = validateCountry(newCoreDestinationId);
        setValidationErrors(prevErrors => {
            // Remove or update the country error based on validation
            if (countryError) {
                return { ...prevErrors, country: countryError };
            } else {
                const { country, ...restErrors } = prevErrors; // Remove the country error
                return restErrors;
            }
        });
    };


    return (
        <div id="add-edit-modal" className="modal add-edit-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Property&nbsp;&nbsp;
                    {isEditMode &&
                        <button
                            className="btn waves-effect waves-light error-red-light"
                            onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined grey-text text-darken-2" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                delete_forever
                            </span>
                        </button>
                    }
                </h4>
                {!loading ? (
                    <div className="container" style={{ width: '60%' }}>
                        <div style={{ textAlign: 'left', marginTop: '50px' }}>
                            <form id="propertyForm" onSubmit={handleFormSubmit}>
                                {(validationErrors.name || validationErrors.portfolio || validationErrors.country) && (
                                    <div className="row" style={{ marginBottom: '20px' }}>
                                        {validationErrors.name && (
                                            <div className="chip error-red-light text-bold">{validationErrors.name}</div>
                                        )}
                                        {validationErrors.portfolio && (
                                            <div className="chip error-red-light text-bold">{validationErrors.portfolio}</div>
                                        )}
                                        {validationErrors.country && (
                                            <div className="chip error-red-light text-bold">{validationErrors.country}</div>
                                        )}
                                    </div>
                                )}
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    <div
                                        style={{ position: 'relative' }}
                                    >
                                        <input
                                            type="text"
                                            id="name"
                                            value={propertyName}
                                            onChange={handlePropertyNameChange}
                                            // onBlur={handlePropertyNameBlur}
                                            onBlur={(e) => {
                                                // First, check if suggestionsRef.current exists to avoid the null reference error
                                                if (suggestionsRef.current && e.relatedTarget) {
                                                    // Then, check if the relatedTarget is not within the suggestions list
                                                    if (!suggestionsRef.current.contains(e.relatedTarget)) {
                                                        setShowPropertySuggestions(false);
                                                    }
                                                } else {
                                                    // If suggestionsRef.current is null or e.relatedTarget is null, hide the suggestions
                                                    setShowPropertySuggestions(false);
                                                }
                                                handlePropertyNameBlur();
                                            }}
                                            onFocus={() => setShowPropertySuggestions(true)}
                                            placeholder="Property name"
                                            style={{ marginRight: '10px', flexGrow: '1' }}
                                            className={validationErrors.name ? 'invalid' : ''}
                                            autoComplete="off"
                                        />

                                        {showPropertySuggestions && filteredPropertySuggestions.length > 0 && (
                                            <ul className="suggestions-list" ref={suggestionsRef}>
                                                {filteredPropertySuggestions.map((suggestion, suggestionIndex) => (
                                                    <li
                                                        key={suggestionIndex}
                                                        tabIndex="0"
                                                        className="suggestion-item"
                                                        onClick={() => selectPropertySuggestion(suggestion)}
                                                    >
                                                        {suggestion.name} {/* Display the name field */}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                    </div>
                                    <label htmlFor="property_name">
                                        <span className="material-symbols-outlined">
                                            hotel
                                        </span>
                                        Property Name
                                    </label>
                                </div>
                                <div className="row" style={{
                                    marginBottom: '20px',
                                    // position: 'relative'
                                }}>
                                    {/* <div
                                    style={{ position: 'relative' }}
                                    > */}
                                    <Select
                                        placeholder="Select Portfolio"
                                        id="portfolio_select"
                                        value={portfolios.find(cons => cons.value === selectedPortfolioId) || ''}
                                        onChange={handleSelectedPortfolioIdChange}
                                        onBlur={handleSelectedPortfolioIdBlur}
                                        options={portfolios}
                                        isClearable
                                        style={{ flexGrow: '1' }}
                                        classNamePrefix="select" // Use this for prefixing generated class names
                                        className={validationErrors.portfolio ? 'invalid-select' : ''} // This class is for the container
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                borderColor: validationErrors.portfolio ? '#d1685d' : provided.borderColor,
                                                '&:hover': {
                                                    borderColor: validationErrors.portfolio ? '#d1685d' : provided['&:hover'].borderColor,
                                                },
                                                boxShadow: state.isFocused ? (validationErrors.portfolio ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
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
                                    {/* <input
                                            type="text"
                                            id="name"
                                            value={portfolioName}
                                            onChange={handlePortfolioNameChange}
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
                                            onFocus={() => setShowPortfolioSuggestions(true)}
                                            placeholder="Portfolio name"
                                            style={{ marginRight: '10px', flexGrow: '1' }}
                                            className={validationErrors.portfolio ? 'invalid' : ''}
                                            autoComplete="off"
                                        />
                                        {showPortfolioSuggestions && filteredPortfolioSuggestions.length > 0 && (
                                            <ul className="suggestions-list" ref={suggestionsRef}>
                                                {filteredPortfolioSuggestions.map((suggestion, suggestionIndex) => (
                                                    <li
                                                        key={suggestionIndex}
                                                        tabIndex="0"
                                                        className="suggestion-item"
                                                        onClick={() => selectPortfolioSuggestion(suggestion)}
                                                    >
                                                        {suggestion}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <label htmlFor="portfolio_name">
                                        <span className="material-symbols-outlined">
                                            store
                                        </span>
                                        Portfolio Name
                                    </label> */}
                                </div>
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    <Select
                                        placeholder="Select Country"
                                        id="country_select"
                                        value={countries.find(cons => cons.value === selectedCountryId) || ''}
                                        onChange={handleSelectedCountryIdChange}
                                        onBlur={handleSelectedCountryIdBlur}
                                        options={countries}
                                        isClearable
                                        style={{ flexGrow: '1' }}
                                        classNamePrefix="select" // Use this for prefixing generated class names
                                        className={validationErrors.country ? 'invalid-select' : ''} // This class is for the container
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                borderColor: validationErrors.country ? '#d1685d' : provided.borderColor,
                                                '&:hover': {
                                                    borderColor: validationErrors.country ? '#d1685d' : provided['&:hover'].borderColor,
                                                },
                                                boxShadow: state.isFocused ? (validationErrors.country ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
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
                                    <label htmlFor="country_select">
                                        <span className="material-symbols-outlined">
                                            globe
                                        </span>
                                        Country Name
                                    </label>
                                </div>
                                <div className="row">
                                    <div className="col s6">
                                        <label>
                                            <input
                                                type="checkbox"
                                                className="filled-in"
                                                checked={selectedCoreDestinationId === shipId}
                                                onChange={handleShipChange}
                                            />
                                            <span>
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
                                                className="filled-in"
                                                checked={selectedCoreDestinationId === railId}
                                                onChange={handleRailChange}
                                            />
                                            <span>
                                                <span className="material-symbols-outlined">
                                                    train
                                                </span>
                                                Rail
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div >
                ) : (
                    <TricklingDotsPreloader show={true} />
                )
                }
            </div >
            <div className="modal-footer" style={{ zIndex: '-1' }}>
                {!loading &&
                    <>
                        {isEditMode ? (
                            <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                                <em className="tb-grey-text">
                                    This property has <span className="text-bold">{relatedEntries.length}</span> associated service provider entries.
                                </em>
                            </div>
                        ) : (
                            relatedEntries.length > 0 ? (
                                <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                                    <em className="error-red-text">
                                        The selected property already exists and has <span className="text-bold">{relatedEntries.length} </span>
                                        related entries. Please double check.
                                    </em>
                                </div>
                            ) : null // Or any other content you'd want to show when not in edit mode and there are no related entries
                        )}

                        {/* {Array.isArray(relatedEntries) && relatedEntries.length > 0 ? (
                    <>
                        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                            <h5 className="grey-text text-darken-3" style={{ marginBottom: '30px' }}>Related Service Provider Entries</h5>
                            {relatedEntries.slice(0, 5).map((item, index) => (
                                <div key={index}>
                                    <div>
                                        <span className="material-symbols-outlined">
                                            hiking
                                        </span>
                                        <span className="text-bold">{item.primary_traveler}  </span>
                                        <div className="chip blue lighten-5">
                                            <span className="material-symbols-outlined">
                                                flight_land
                                            </span>
                                            {item.date_in}
                                        </div>
                                        to&nbsp;
                                        <div className="chip blue lighten-5">
                                            <span className="material-symbols-outlined">
                                                flight_takeoff
                                            </span>
                                            {item.date_out}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {relatedEntries.length > 5 && (
                                <p className="grey-text">and {relatedEntries.length - 5} more...</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                        <em className="grey-text text-lighten-1">No associated service provider entries.</em>
                    </div>
                )} */}
                        <div style={{ paddingBottom: '20px' }}>
                            <button className="btn modal-close waves-effect waves-light error-red" onClick={onClose}>
                                Close
                            </button>
                            &nbsp;&nbsp;
                            <button type="submit" form="propertyForm" className="btn waves-effect waves-light success-green">Save</button>
                        </div>

                    </>
                }
            </div>
        </div >
    )
}

export default AddEditPropertyModal;
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const AddEditPropertyModal = ({ isOpen, onClose, onRefresh, editPropertyData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [propertyId, setPropertyId] = useState(null);
    const [propertyName, setPropertyName] = useState('');
    const [portfolioName, setPortfolioName] = useState('');
    const [selectedCountryId, setSelectedCountryId] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [countries, setCountries] = useState([]);
    const [touched, setTouched] = useState({
        propertyName: false,
        portfolioName: false,
        selectedCountryId: false,
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

        const propertyToSubmit = {
            property_id: propertyId || null,
            name: propertyName || null,
            portfolio: portfolioName,
            country_id: selectedCountryId,
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
                        toastHtml = `Added ${insertedCount} property.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} property.`;
                    } else {
                        toastHtml = data?.message ?? "No properties were added.";
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

        if (!(propertyName || '').trim()) {
            errors.name = 'Missing property name';
        }
        if (!(portfolioName || '').trim()) {
            errors.portfolio = 'Missing portfolio name';
        }
        if (!(selectedCountryId || '').trim()) {
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
                    label: country.name
                }));
                setCountries(formattedCountries);
            })
            .catch((err) => console.error(err));
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
            const confirmDelete = window.confirm("Are you sure you want to delete this property?");
            if (confirmDelete) {
                // const entryId = property.id : null;
                // const propertyId = 'abc';
                if (!propertyId) {
                    M.toast({ html: 'Error: No property ID found', classes: 'red lighten-2' });
                    return;
                }
                // Replace `/your-api-endpoint/` with the actual endpoint and `entryId` with the actual ID
                fetch(`${process.env.REACT_APP_API}/v1/properties/${propertyId}`, {
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
                        M.toast({ html: 'Property successfully deleted', classes: 'green' });
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Handle error - show error message
                        M.toast({ html: 'Error deleting property', classes: 'red' });
                    });
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editPropertyData) {
            setPropertyId(editPropertyData.id);
            setPropertyName(editPropertyData.name);
            setPortfolioName(editPropertyData.portfolio_name);
            setSelectedCountryId(editPropertyData.country_id);
        }
    }, [isOpen, isEditMode, editPropertyData]);

    const resetFormState = () => {
        setPropertyName('');
        setPortfolioName('');
        setSelectedCountryId(null);
        setValidationErrors({});
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
    };

    const handlePropertyNameBlur = () => {
        setTouched(prev => ({ ...prev, propertyName: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            propertyName: validatePropertyName(propertyName),
        }));
    };

    const validatePortfolioName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing portfolio name';
        }
        return '';
    };

    const handlePortfolioNameChange = (e) => {
        const value = e.target.value;
        setPortfolioName(value);

        // Only validate in real-time if the field has been touched
        if (touched.portfolioName) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                portfolio: validatePortfolioName(value),
            }));
        }
    };

    const handlePortfolioNameBlur = () => {
        setTouched(prev => ({ ...prev, portfolioName: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            portfolio: validatePortfolioName(portfolioName),
        }));
    };

    const validateSelectedCountryId = (value) => {
        if (!(value || '').trim()) {
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

    return (
        <div id="add-edit-modal" className="modal add-edit-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Property&nbsp;&nbsp;
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
                        <form id="propertyForm" onSubmit={handleFormSubmit}>
                            {(validationErrors.name || validationErrors.portfolio || validationErrors.country) && (
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    {validationErrors.name && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.name}</div>
                                    )}
                                    {validationErrors.portfolio && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.portfolio}</div>
                                    )}
                                    {validationErrors.country && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.country}</div>
                                    )}
                                </div>
                            )}
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="name"
                                    value={propertyName}
                                    onChange={handlePropertyNameChange}
                                    onBlur={handlePropertyNameBlur}
                                    placeholder="Property name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.name ? 'invalid' : ''}
                                />
                                <label htmlFor="property_name">
                                    <span className="material-symbols-outlined">
                                        hotel
                                    </span>
                                    Property Name
                                </label>
                            </div>
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="name"
                                    value={portfolioName}
                                    onChange={handlePortfolioNameChange}
                                    onBlur={handlePortfolioNameBlur}
                                    placeholder="Portfolio name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.portfolio ? 'invalid' : ''}
                                />
                                <label htmlFor="portfolio_name">
                                    <span className="material-symbols-outlined">
                                        store
                                    </span>
                                    Portfolio Name
                                </label>
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
                                            borderColor: validationErrors.country ? 'red' : provided.borderColor,
                                            '&:hover': {
                                                borderColor: validationErrors.country ? 'darkred' : provided['&:hover'].borderColor,
                                            },
                                            boxShadow: state.isFocused ? (validationErrors.country ? '0 0 0 1px darkred' : provided.boxShadow) : 'none',
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
                    <button type="submit" form="propertyForm" className="btn waves-effect waves-light green">Save</button>
                </div>
            </div>
        </div >
    )
}

export default AddEditPropertyModal;
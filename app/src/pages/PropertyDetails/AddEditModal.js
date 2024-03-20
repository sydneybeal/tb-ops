import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TricklingDotsPreloader from '../../components/TricklingDotsPreloader';
// import moment from 'moment';

const AddEditPropertyDetailModal = ({ isOpen, onClose, onRefresh, editPropertyData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [loading, setLoading] = useState(false);
    const [propertyId, setPropertyId] = useState(null);
    // const [propertyName, setPropertyName] = useState('');
    const [properties, setProperties] = useState([]);
    const [selectedPropertyDetails, setSelectedPropertyDetails] = useState(null);
    const [selectedPropertyType, setSelectedPropertyType] = useState(null);
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const propertyTypeOptions = useMemo(() => ([
        { value: 'hotel', label: 'Hotel' },
        { value: 'camp', label: 'Camp' },
        { value: 'boat', label: 'Boat' },
    ]), []); // Dependencies array is empty, so this only runs once

    const priceRangeOptions = useMemo(() => ([
        { value: '<$500', label: '<$500' },
        { value: '$500-$1000', label: '$500-$1000' },
        { value: '$1000-$2000', label: '$1000-$2000' },
        { value: '$2000-$3000', label: '$2000-$3000' },
        { value: '$3000+', label: '$3000+' },
    ]), []);
    const [features, setFeatures] = useState({
        num_tents: null,
        has_trackers: false,
        has_wifi_in_room: false,
        has_wifi_in_common_areas: false,
        has_hairdryers: false,
        has_pool: false,
        has_heated_pool: false,
        is_handicap_accessible: false,
        // Add more features as needed
    });

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('property-detail-modal');
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

        fetch(`${process.env.REACT_APP_API}/v1/properties`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(res => res.json())
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
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [isOpen, onClose, userDetails.token]);


    useEffect(() => {
        if (!propertyId) {
            return;
        }
        fetch(`${process.env.REACT_APP_API}/v1/property_details/${propertyId}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(res => res.json())
            .then((data) => {
                setSelectedPropertyDetails(data);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [propertyId, userDetails.token]);


    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!propertyId) {
            M.toast({
                html: 'Please select a property.',
                displayLength: 4000,
                classes: 'error-red',
            });
            return;
        }

        const propertyDetailsToSubmit = {
            property_id: propertyId,
            property_type: selectedPropertyType.value,
            price_range: selectedPriceRange.value,
            updated_by: userDetails.email || '',
            ...features
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
            fetch(`${process.env.REACT_APP_API}/v1/property_details`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(propertyDetailsToSubmit, null, 2),
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
                        toastHtml = `Added ${insertedCount} property details.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} property details.`;
                    } else {
                        toastHtml = data?.message ?? "No property details were added.";
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
                    // resetFormState();
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

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editPropertyData) {
            setPropertyId(editPropertyData.property_id);
            const priceRangeOption = priceRangeOptions.find(option => option.value === editPropertyData.price_range);
            setSelectedPriceRange(priceRangeOption || null);
            const propertyTypeOption = propertyTypeOptions.find(option => option.value?.toLowerCase() === editPropertyData.property_type?.toLowerCase());
            setSelectedPropertyType(propertyTypeOption || null);
            setFeatures({
                num_tents: editPropertyData.num_tents,
                has_trackers: editPropertyData.has_trackers,
                has_wifi_in_room: editPropertyData.has_wifi_in_room,
                has_wifi_in_common_areas: editPropertyData.has_wifi_in_common_areas,
                has_hairdryers: editPropertyData.has_hairdryers,
                has_pool: editPropertyData.has_pool,
                has_heated_pool: editPropertyData.has_heated_pool,
                is_handicap_accessible: editPropertyData.is_handicap_accessible,
            });
        }
    }, [isOpen, isEditMode, editPropertyData, propertyTypeOptions, priceRangeOptions]);

    const resetFormState = () => {
        setPropertyId(null);
        setSelectedPriceRange(null);
        setSelectedPropertyType(null);
        setFeatures({
            num_tents: null,
            has_trackers: false,
            has_wifi_in_room: false,
            has_wifi_in_common_areas: false,
            has_hairdryers: false,
            has_pool: false,
            has_heated_pool: false,
            is_handicap_accessible: false,
        });
    };

    const handlePropertyIdChange = (selectedOption) => {
        setPropertyId(selectedOption ? selectedOption.value : '');
    }

    const handleCheckboxChange = (featureName) => {
        setFeatures(prevState => ({
            ...prevState,
            [featureName]: !prevState[featureName],
        }));
    };


    return (
        <div id="property-detail-modal" className="modal property-detail-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    Property Details&nbsp;&nbsp;
                    {isEditMode &&
                        <button
                            className="btn waves-effect waves-light error-red-light"
                        // onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined grey-text text-darken-2" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                delete_forever
                            </span>
                        </button>
                    }
                </h4>
                {!loading ? (
                    <div className="container" style={{ width: '90%' }}>
                        <div style={{ textAlign: 'left', marginTop: '50px' }}>
                            <form
                                id="propertyForm"
                                onSubmit={handleFormSubmit}
                            >
                                <div className="row">
                                    <div className="col s12">
                                        <Select
                                            placeholder="Select Property"
                                            id="property_select"
                                            value={properties.find(cons => cons.value === propertyId) || ''}
                                            onChange={handlePropertyIdChange}
                                            options={properties}
                                            isClearable
                                            style={{ flexGrow: '1' }}
                                            classNamePrefix="select" // Use this for prefixing generated class names
                                            // className={validationErrors.country ? 'invalid-select' : ''} // This class is for the container
                                            styles={{
                                                // control: (provided, state) => ({
                                                //     ...provided,
                                                //     borderColor: validationErrors.country ? '#d1685d' : provided.borderColor,
                                                //     '&:hover': {
                                                //         borderColor: validationErrors.country ? '#d1685d' : provided['&:hover'].borderColor,
                                                //     },
                                                //     boxShadow: state.isFocused ? (validationErrors.country ? '0 0 0 1px #d1685d' : provided.boxShadow) : 'none',
                                                // }),
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
                                        <label htmlFor="property_select">
                                            <span className="material-symbols-outlined">
                                                hotel
                                            </span>
                                            Property Name
                                        </label>
                                    </div>
                                </div>
                                {selectedPropertyDetails &&
                                    <div className="row">
                                        {selectedPropertyDetails.portfolio_name &&
                                            <div className="chip tb-teal lighten-3">
                                                <span className="text-bold">
                                                    Portfolio:&nbsp;
                                                </span>
                                                {selectedPropertyDetails.portfolio_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    store
                                                </span>
                                            </div>
                                        }
                                        {selectedPropertyDetails.country_name &&
                                            <div className="chip tb-teal lighten-3">
                                                <span className="text-bold">
                                                    Country:&nbsp;
                                                </span>
                                                {selectedPropertyDetails.country_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    globe
                                                </span>
                                            </div>
                                        }
                                        {selectedPropertyDetails.core_destination_name &&
                                            <div className="chip tb-teal lighten-3">
                                                <span className="text-bold">
                                                    Core Destination:&nbsp;
                                                </span>
                                                {selectedPropertyDetails.core_destination_name}
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    explore
                                                </span>
                                            </div>
                                        }
                                    </div>

                                }
                                <br />
                                <div className="row">
                                    <div className="col s6">
                                        <Select
                                            placeholder="Property Type"
                                            id="property_type_select"
                                            value={selectedPropertyType}
                                            onChange={selectedOption => setSelectedPropertyType(selectedOption ? selectedOption : null)}
                                            options={propertyTypeOptions}
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
                                        <label htmlFor="property_select">
                                            <span className="material-symbols-outlined">
                                                camping
                                            </span>
                                            Property Type
                                        </label>
                                    </div>
                                    <div className="col s6">
                                        <Select
                                            placeholder="Price Range"
                                            id="property_type_select"
                                            value={selectedPriceRange}
                                            onChange={selectedOption => setSelectedPriceRange(selectedOption ? selectedOption : null)}
                                            options={priceRangeOptions}
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
                                        <label htmlFor="property_select">
                                            <span className="material-symbols-outlined">
                                                payments
                                            </span>
                                            Price Range (Per Person Per Night)
                                        </label>
                                    </div>
                                </div>
                                <br />
                                <div className="row center">
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                pets
                                            </span>
                                            <br />
                                            Trackers
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_trackers}
                                                    onChange={() => handleCheckboxChange('has_trackers')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                wifi
                                            </span>
                                            <br />
                                            WiFi (In Room)
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_wifi_in_room}
                                                    onChange={() => handleCheckboxChange('has_wifi_in_room')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                wifi
                                            </span>
                                            <br />
                                            WiFi (Common Area)
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_wifi_in_common_areas}
                                                    onChange={() => handleCheckboxChange('has_wifi_in_common_areas')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <br />
                                <div className="row center">
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                pool
                                            </span>
                                            <br />
                                            Pool
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_pool}
                                                    onChange={() => handleCheckboxChange('has_pool')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                pool
                                            </span>
                                            <br />
                                            Heated Pool
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_heated_pool}
                                                    onChange={() => handleCheckboxChange('has_heated_pool')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="tb-teal-text text-bold" style={{ marginBottom: '10px' }}>
                                            <span className="material-symbols-outlined">
                                                self_care
                                            </span>
                                            <br />
                                            Hairdryers
                                        </div>
                                        <div className="switch property-switch">
                                            <label>
                                                No
                                                <input
                                                    type="checkbox"
                                                    checked={features.has_hairdryers}
                                                    onChange={() => handleCheckboxChange('has_hairdryers')}
                                                />
                                                <span className="lever"></span>
                                                Yes
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <TricklingDotsPreloader show={true} />
                )
                }
            </div >
            <div className="modal-footer" style={{ zIndex: '-1' }}>
                {!loading &&
                    <div style={{ paddingBottom: '20px' }}>
                        <button className="btn modal-close waves-effect waves-light error-red" onClick={onClose}>
                            Close
                        </button>
                        &nbsp;&nbsp;
                        <button type="submit" form="propertyForm" className="btn waves-effect waves-light success-green">Save</button>
                    </div>
                }
            </div>
        </div>
    )
}

export default AddEditPropertyDetailModal;
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';
import RatingSelect from './RatingSelect';
import CommentInput from './CommentInput';
import AttributeChip from '../PropertyDetails/AttributeChip';
import ReactDatePicker from 'react-datepicker';
import Select from 'react-select';
import moment from 'moment';

const CreateEditTripReport = () => {
    const { userDetails } = useAuth();
    const { trip_report_id } = useParams(); // Get the id from URL params
    const [propertyOptions, setPropertyOptions] = useState();
    const [locationOptions, setLocationOptions] = useState();
    const [userOptions, setUserOptions] = useState();
    const [filteredUserOptions, setFilteredUserOptions] = useState([]);
    const [showTravelerSuggestions, setShowTravelerSuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    const [travelerSearchText, setTravelerSearchText] = useState('');
    const [formData, setFormData] = useState({
        travelerNames: [],
        documentUpdates: '',
        properties: [
            {
                date_in: '',
                site_inspection_only: false,
                date_out: '',
                property_id: '',
                portfolio: '',
                country: '',
                property_type: '',
                core_destination_name: '',
                accommodation_rating: '',
                service_rating: '',
                food_rating: '',
                guide_rating: '',
                overall_rating: '',
                food_and_beverage_comments: '',
                management_comments: '',
                guiding_comments: '',
                animal_viewing_comments: '',
                seasonality_comments: '',
                clientele_comments: '',
                pairing_comments: '',
                insider_comments: '',
            }
        ],
        activities: [
            {
                name: '',
                rating: '',
                comments: '',
                type: '',
            }
        ]
    });
    const [showHelpers, setShowHelpers] = useState(
        formData.properties.map(() => ({
            animal_viewing_comments: true,
            seasonality_comments: true,
            clientele_comments: true,
            pairing_comments: true,
            insider_comments: true,
            guiding_comments: true,
            attribute_updates: false,
        }))
    );
    // TODO make report title automatic for the properties/countries,
    // dates selected, and traveler names

    const addAccommodation = () => {
        const newProperty = {
            date_in: '',
            site_inspection_only: false,
            date_out: '',
            property_id: '',
            portfolio: '',
            country: '',
            core_destination_name: '',
            property_type: '',
            accommodation_rating: '',
            service_rating: '',
            food_rating: '',
            guide_rating: '',
            overall_rating: '',
            food_and_beverage_comments: '',
            management_comments: '',
            guiding_comments: '',
            animal_viewing_comments: '',
            seasonality_comments: '',
            clientele_comments: '',
            pairing_comments: '',
            insider_comments: '',
        };
        setFormData({
            ...formData,
            properties: [...formData.properties, newProperty]
        });
    };

    const addActivity = () => {
        const newActivity = {
            name: '',
            rating: '',
            comments: '',
            type: '',
        };
    
        setFormData({
            ...formData,
            activities: [...formData.activities, newActivity]
        });
    };

    const handleActivityNameChange = (activityIndex) => (e) => {
        const newActivities = [...formData.activities];
        newActivities[activityIndex].name = e.target.value;
        setFormData({
            ...formData,
            activities: newActivities
        });
    };
    const handleActivityLocationChange = (activityIndex, selectedOption) => {
        const newActivities = [...formData.activities];
        newActivities[activityIndex].location = selectedOption ? selectedOption.value : null; // Use selectedOption.value or reset to null if cleared
        setFormData({
            ...formData,
            activities: newActivities
        });
    };
    

    const handleActivityTypeChange = (activityIndex) => (value) => {
        const newActivities = [...formData.activities];
        newActivities[activityIndex].type = value; // Directly use the passed value
        setFormData({
            ...formData,
            activities: newActivities
        });
    };

    const handleActivityRatingChange = (rating, activityIndex) => {
        const newActivities = [...formData.activities];
        newActivities[activityIndex].rating = rating;
        setFormData({
            ...formData,
            activities: newActivities
        });
    };

    const handleActivityCommentChange = (comment, activityIndex) => {
        const newActivities = [...formData.activities];
        newActivities[activityIndex].comments = comment;
        setFormData({
            ...formData,
            activities: newActivities
        });
    };

    const removeActivity = (activityIndex) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this activity?");
        if (confirmDelete) {
            setFormData({
                ...formData,
                activities: formData.activities.filter((_, i) => i !== activityIndex)
            });
        }
    };

    const removeAccommodation = (index) => {
        const confirmDelete = window.confirm("Are you sure you want to delete your progress on this property?");
        if (confirmDelete) {
            setFormData({
                ...formData,
                properties: formData.properties.filter((_, i) => i !== index)
            });
        }
    };

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/property_details?entered_only=false`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {

                const formattedProperties = data.map((property) => ({
                    value: property.property_id,
                    label: `${property.name} (${property.country_name || property.core_destination_name})`,
                    name: property.name,
                    portfolio_id: property.portfolio_id,
                    portfolio_name: property.portfolio_name,
                    property_type: property.property_type,
                    location: property.location,
                    country_name: property.country_name,
                    core_destination_name: property.core_destination_name,
                    num_tents: property.num_tents,
                    has_trackers: property.has_trackers,
                    has_wifi_in_room: property.has_wifi_in_room,
                    has_wifi_in_common_areas: property.has_wifi_in_common_areas,
                    has_hairdryers: property.has_hairdryers,
                    has_pool: property.has_pool,
                    has_heated_pool: property.has_heated_pool,
                    has_credit_card_tipping: property.has_credit_card_tipping,
                    is_child_friendly: property.is_child_friendly,
                    is_handicap_accessible: property.is_handicap_accessible
                }));
                // formattedProperties.map((property) => {
                //     if (property.name === "MalaMala Camp") {
                //         console.log(property);
                //     }
                // });
                setPropertyOptions(formattedProperties);

                const locationStrings = new Set(data
                    .filter(property => property.location && property.country_name)  // Ensure both location and country_name are truthy
                    .map(property => JSON.stringify({
                        label: `${property.location} (${property.country_name})`,
                        value: property.location
                    }))
                  );
                
                const uniqueLocations = Array.from(locationStrings).map(string => JSON.parse(string));
                  
                setLocationOptions(uniqueLocations);
            })
            .catch((err) => console.error(err));
        
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
                const filteredUsers = data.filter(user => !excludedEmails.includes(user.email));
                setUserOptions(filteredUsers);
            })
            .catch((err) => console.error(err));
    }, [userDetails.token]);
    
    const handleDateChange = (index, name, date) => {
        const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
        const updatedProperties = formData.properties.map((property, i) => {
            if (i === index) {
                return { ...property, [name]: newValue };
            }
            return property;
        });
    
        setFormData({
            ...formData,
            properties: updatedProperties
        });
    };

    const handleUserSearchTextChange = (e) => {
        const value = e.target.value;
        setTravelerSearchText(value);

        // Filter user options based on input and exclude already selected travelers
        const filtered = userOptions.filter(user =>
            user.email.toLowerCase().includes(value.toLowerCase()) &&
            !formData.travelerNames.some(traveler => traveler.id === user.id)
        );
        setFilteredUserOptions(filtered);
    };

    const handleUserSelect = (user) => {
        // Only add the user if they aren't already in the list
        if (!formData.travelerNames.some(traveler => traveler.id === user.id)) {
            setFormData((prevData) => ({
                ...prevData,
                travelerNames: [...prevData.travelerNames, user]
            }));
        }
        setTravelerSearchText('');
        setFilteredUserOptions([]);
        setShowTravelerSuggestions(false);
    };

    const handleChipDelete = (userId) => {
        setFormData((prevData) => ({
            ...prevData,
            travelerNames: prevData.travelerNames.filter(traveler => traveler.id !== userId)
        }));
    };

    const hasAnimals = (property) => {
        // Check if core_destination is Africa
        const isAfrica = property.core_destination_name === 'Africa';
        // Check if property_type is "standard accommodation" or "luxury accommodation"
        const isAccommodation = property.property_type?.toLowerCase() === 'standard accommodation' || property.property_type?.toLowerCase() === 'luxury accommodation';
        
        // Return true if both conditions are met
        return isAfrica && isAccommodation;
    };    
    
    const handlePropertyChange = (index, selectedOption) => {
        // handleLogChange(index, 'property_id', selectedOption ? selectedOption.value : '');
        const updatedProperties = formData.properties.map((property, i) => {
            if (i === index) {
                return {
                    ...property,
                    'property_id': selectedOption ? selectedOption.value : '',
                    'portfolio_name': selectedOption ? selectedOption.portfolio_name : '',
                    'country_name': selectedOption ? selectedOption.country_name : '',
                    'core_destination_name': selectedOption ? selectedOption.core_destination_name : '',
                    'property_type': selectedOption ? selectedOption.property_type : '',
                    'location': selectedOption ? selectedOption.location : '',
                    'num_tents': selectedOption ? selectedOption.num_tents : '',
                    'has_trackers': selectedOption ? selectedOption.has_trackers : '',
                    'has_wifi_in_room': selectedOption ? selectedOption.has_wifi_in_room : '',
                    'has_wifi_in_common_areas': selectedOption ? selectedOption.has_wifi_in_common_areas : '',
                    'has_hairdryers': selectedOption ? selectedOption.has_hairdryers : '',
                    'has_pool': selectedOption ? selectedOption.has_pool : '',
                    'has_heated_pool': selectedOption ? selectedOption.has_heated_pool : '',
                    'has_credit_card_tipping': selectedOption ? selectedOption.has_credit_card_tipping : '',
                    'is_child_friendly': selectedOption ? selectedOption.is_child_friendly : '',
                    'is_handicap_accessible': selectedOption ? selectedOption.is_handicap_accessible : '',
                };
            }
            return property;
        });
    
        setFormData({
            ...formData,
            properties: updatedProperties
        });
    };

    const handleRatingChange = (rating, item, index) => {
        setFormData((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][`${item}_rating`] = rating;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };

    const handleCommentChange = (comment, item, index) => {
        setFormData((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][`${item}_comments`] = comment;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };

    const handleDocumentCommentChange = (comment) => {
        setFormData((prevState) => {
            return {
                ...prevState,
                documentUpdates: comment
            };
        });
    };

    const handleCheckboxChange = (item, index) => {
        setFormData((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][item] = !newProperties[index][item];
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };

    const toggleHelpers = (item, index) => {
        setShowHelpers((prevShowHelpers) => {
            const newShowHelpers = [...prevShowHelpers];
            newShowHelpers[index] = {
                ...newShowHelpers[index],
                [item]: !newShowHelpers[index][item],
            };
            return newShowHelpers;
        });
    };
    

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    useEffect(() => {
        if (trip_report_id) {
        // Fetch the data for editing
        fetch(`/api/trip_reports/${trip_report_id}`)
            .then(response => response.json())
            .then(data => setFormData(data))
            .catch(error => console.log('Error fetching data:', error));
        }
    }, [trip_report_id]);

    const handleSubmit = (event) => {
        event.preventDefault();
        // Submit logic here
        console.log('Form data submitted:', formData);
        // Redirect after submit
    };

    return (
        <>
            <header>
                <Navbar title="Trip Reports" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '80%', paddingBottom: '100px' }}>
                    <h4 className="center report-title">{trip_report_id ? 'Update' : 'New'} Trip Report</h4>
                    <div className="card potential-trip-card" style={{ marginTop: '20px', paddingTop: '10px'}}>
                        <div className="card-content">
                            <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="input-field col s12 l8 offset-l2 center">
                                    <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                        person_add
                                    </span>
                                    <input
                                        type="text"
                                        name="travelerNames"
                                        id="travelerNames"
                                        placeholder="Search to add a traveler"
                                        value={travelerSearchText}
                                        onChange={handleUserSearchTextChange}
                                        onBlur={(e) => {
                                            // First, check if suggestionsRef.current exists to avoid the null reference error
                                            if (suggestionsRef.current && e.relatedTarget) {
                                                // Then, check if the relatedTarget is not within the suggestions list
                                                if (!suggestionsRef.current.contains(e.relatedTarget)) {
                                                    setShowTravelerSuggestions(false);
                                                }
                                            } else {
                                                // If suggestionsRef.current is null or e.relatedTarget is null, hide the suggestions
                                                setShowTravelerSuggestions(false);
                                            }
                                            // handlePropertyNameBlur();
                                        }}
                                        onFocus={() => setShowTravelerSuggestions(true)}
                                        className="search-input"
                                        autoComplete='off'
                                    />
                                    {showTravelerSuggestions && filteredUserOptions.length > 0 && (
                                        <ul className="suggestions-list" ref={suggestionsRef}>
                                            {filteredUserOptions.map(user => (
                                                <li
                                                    key={user.id}
                                                    onClick={() => handleUserSelect(user)}
                                                    tabIndex="0"
                                                    className="suggestion-item"
                                                >
                                                    {user.email}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            {formData.travelerNames.length > 0 && (
                                <div className="row center">
                                    <h5 className="report-title">Travelers</h5>
                                    {formData.travelerNames.map(traveler => (
                                        <span style={{ paddingLeft: '18px' }} key={traveler.id} className="chip tb-teal darken-3 tb-off-white-text">
                                            <span style={{ fontSize: '1.1rem'}} >{traveler.email.split('@')[0]} </span>
                                            <button
                                                className="btn btn-floating btn-tiny tb-grey lighten-2"
                                                type="button"
                                                style={{ marginLeft: '4px', marginBottom: '6px', paddingTop: '5px', paddingLeft: '1px'}}
                                                onClick={() => handleChipDelete(traveler.id)}
                                            >
                                                <span className="material-symbols-outlined text-bold" style={{ fontSize: '0.8rem'}} >
                                                    close
                                                </span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {formData.travelerNames.length > 1 && (
                            <div className="container" style={{ width: '90%'}}>
                                <div>
                                    <ul className="custom-icons">
                                        <li>
                                            If multiple Travel Beyond employees are traveling together, each employee should review a
                                            property in a rotating order so that similar reviews are not written for the same property.
                                        </li>
                                        <li>
                                            The employee(s) who do not write the review should read through the review and only add to it if
                                            they have a differing opinion and/or feel something important was omitted.
                                        </li>
                                    </ul>
                                </div>
                                {/* <span className="tb-md-black-text">
                                    If multiple Travel Beyond employees are traveling together, each employee should review a
                                    property in a rotating order so that similar reviews are not written for the same property.
                                    The employee(s) who do not write the review should read through the review and only add to it if
                                    they have a differing opinion and/or feel something important was omitted.
                                </span> */}
                            </div>
                            )}
                                {/* <div className="row">
                                    <div className="input-field col s12 l8 offset-l2 center">
                                        <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                            hiking
                                        </span>
                                        <input
                                            type="text"
                                            name="travelerNames"
                                            id="travelerNames"
                                            placeholder="Traveler Names"
                                            value={formData.travelerNames}
                                            onChange={handleTextChange}
                                            className="search-input"
                                            autoComplete='off'
                                        />
                                        <span
                                            className="grey-text text-darken-1"
                                        >
                                            Traveler Names
                                        </span>
                                    </div>
                                </div>
                                <div className="row">
                                </div> */}
                                <div className="tb-teal-text text-darken-1 text-bold" style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px'}}>
                                    <span className="material-symbols-outlined">
                                        task
                                    </span>
                                    Document updates
                                </div>
                                <div style={{ paddingLeft: '20px' }}>
                                    <ul className="custom-icons">
                                        <li>Include any guide, document, tipping, etc. updates that need to be made by Steph & Callie.</li>
                                        <li>This section will not be shared on the public trip report once published.</li>
                                    </ul>
                                </div>
                                <CommentInput
                                    key="document-updates"
                                    item="document_updates"
                                    placeholder="Document updates"
                                    comment={formData.documentUpdates}
                                    onCommentChange={(comment) => handleDocumentCommentChange(comment)}
                                />
                                <h4 className="center report-title">Properties</h4>
                                {formData.properties.map((property, index) => {
                                    const propertyHasAnimals = hasAnimals(property);
                                    return (
                                    <div key={index} style={{ marginTop: '60px' }}>
                                        <div className="row">
                                            <div className="col s11">
                                                <div
                                                    className="chip tb-teal lighten-2 text-bold"
                                                    style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {index + 1}
                                                </div>
                                                {property.portfolio_name &&
                                                    <div className="chip tb-teal lighten-3">
                                                        <span className="text-bold">
                                                            Portfolio:&nbsp;
                                                        </span>
                                                            {property.portfolio_name}
                                                        &nbsp;
                                                        <span className="material-symbols-outlined">
                                                            store
                                                        </span>
                                                    </div>
                                                }
                                                {property.country_name &&
                                                    <div className="chip tb-grey lighten-3">
                                                        <span className="text-bold">
                                                            Country:&nbsp;
                                                        </span>
                                                            {property.country_name}
                                                        &nbsp;
                                                        <span className="material-symbols-outlined">
                                                            globe
                                                        </span>
                                                    </div>
                                                }
                                                {property.core_destination_name &&
                                                    <div className="chip tb-grey lighten-3">
                                                        <span className="text-bold">
                                                            Core Destination:&nbsp;
                                                        </span>
                                                            {property.core_destination_name}
                                                        &nbsp;
                                                        <span className="material-symbols-outlined">
                                                            explore
                                                        </span>
                                                    </div>
                                                }
                                            </div>
                                            <div className="col s1" style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn-floating btn-small waves-effect waves-light error-red"
                                                        onClick={() => removeAccommodation(index)}
                                                        >
                                                        <i className="material-icons">remove</i>
                                                    </button>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col s12 l8">
                                                <div className="row">
                                                    <Select
                                                        placeholder="Select property"
                                                        inputId="property_select"
                                                        value={propertyOptions?.find(prop => prop.value === property.property_id) || ''}
                                                        onChange={(selectedOption) => handlePropertyChange(index, selectedOption)}
                                                        options={propertyOptions}
                                                        classNamePrefix="select"
                                                        styles={{
                                                            control: (provided, state) => ({
                                                                ...provided,
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
                                                    <label className="tb-grey-text text-darken-1" htmlFor="property_select">
                                                        <span className="material-symbols-outlined">
                                                            hotel
                                                        </span>
                                                        Property Name
                                                    </label>
                                                </div>
                                                <div className="row">
                                                    {property.location &&
                                                        <div className="chip tb-grey lighten-3">
                                                            <span className="text-bold">
                                                                Location:&nbsp;
                                                            </span>
                                                                {property.location}
                                                            &nbsp;
                                                            <span className="material-symbols-outlined">
                                                                near_me
                                                            </span>
                                                        </div>
                                                    }
                                                    {property.property_type &&
                                                        <div className="chip tb-grey lighten-3">
                                                            <span className="text-bold">
                                                                Property Type:&nbsp;
                                                            </span>
                                                                {toTitleCase(property.property_type)}
                                                            &nbsp;
                                                            <span className="material-symbols-outlined">
                                                                hotel
                                                            </span>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                            <div className="col s12 l4">
                                                <div className="row">
                                                    {/* Date In Selector */}
                                                    <div className={`col ${property.site_inspection_only ? 's12 center' : 's6'}`}>
                                                        <div>
                                                            <ReactDatePicker
                                                                id="form-date-in"
                                                                selected={property.date_in ? moment(property.date_in).toDate() : null}
                                                                onChange={(date) => { handleDateChange(index, 'date_in', date)}}
                                                                isClearable
                                                                name="date_in"
                                                                placeholderText={!property.site_inspection_only ? 'Date In' : 'Visit Date' }
                                                                className="date-input-modal"
                                                                dateFormat="MM/dd/yyyy"
                                                                minDate={new Date('2017-01-01')}
                                                                maxDate={new Date('2100-12-31')}
                                                                autoComplete="off"
                                                                openToDate={property.date_out ? moment(property.date_out).subtract(1, 'days').toDate() : new Date()}
                                                            />
                                                        </div>
                                                        <label className="tb-grey-text text-darken-1" htmlFor="form-date-in">
                                                            <span className="material-symbols-outlined">
                                                                {!property.site_inspection_only ? 'flight_land' : 'event' }
                                                            </span>
                                                            {!property.site_inspection_only ? 'Check-In' : 'Visit' } Date
                                                        </label>
                                                    </div>
                                                    {/* Date Out Selector */}
                                                    {!property.site_inspection_only &&
                                                        <div className="col s6">
                                                            <div>
                                                                <ReactDatePicker
                                                                    id="form-date-out"
                                                                    selected={property.date_out ? moment(property.date_out).toDate() : null}
                                                                    onChange={(date) => { handleDateChange(index, 'date_out', date)}}
                                                                    isClearable
                                                                    name="date_out"
                                                                    placeholderText="Date out"
                                                                    className="date-input-modal"
                                                                    dateFormat="MM/dd/yyyy"
                                                                    minDate={new Date('2017-01-01')}
                                                                    maxDate={new Date('2100-12-31')}
                                                                    autoComplete="off"
                                                                    openToDate={property.date_in ? moment(property.date_in).add(1, 'days').toDate() : new Date()}
                                                                />
                                                            </div>
                                                            <label className="tb-grey-text text-darken-1" htmlFor="form-date-out">
                                                                <span className="material-symbols-outlined">
                                                                    flight_takeoff
                                                                </span>
                                                                Check-Out Date
                                                            </label>
                                                        </div>
                                                    }
                                                </div>
                                                <div className="row">
                                                    <div className="center" style={{margin: '10px 0px 15px 0px'}}>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                // className="filled-in"
                                                                checked={property.site_inspection_only}
                                                                onChange={() => handleCheckboxChange('site_inspection_only', index)}
                                                            />
                                                            <span className="tb-grey-text text-darken-2">
                                                                {/* <span className="material-symbols-outlined">
                                                                    flash_on
                                                                </span> */}
                                                                Site Inspection Only
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {property.property_id &&
                                        <>
                                            <div className="row">
                                                <p className="trip-report-direction center text-bold">
                                                    Do any of the following attributes require updates?
                                                </p>
                                                <div className="col s12 prop-chips-container" style={{ paddingBottom: '20px', paddingTop: '10px' }}>
                                                    {propertyHasAnimals &&
                                                        <AttributeChip
                                                            attribute={property.has_wifi_in_room}
                                                            icon='pets'
                                                            label='Trackers'
                                                        />
                                                    }
                                                    <AttributeChip
                                                        attribute={property.has_wifi_in_room}
                                                        icon='wifi_home'
                                                        label='WiFi (Room)'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_wifi_in_common_areas}
                                                        icon='wifi'
                                                        label='WiFi (Common Area)'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_hairdryers}
                                                        icon='self_care'
                                                        label='Hair Dryers'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_credit_card_tipping}
                                                        icon='credit_card_heart'
                                                        label='Credit Card Tips'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_pool}
                                                        icon='pool'
                                                        label='Pool'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_heated_pool}
                                                        icon='local_fire_department'
                                                        label='Heated Pool'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.is_child_friendly}
                                                        icon='family_restroom'
                                                        label='Child Friendly'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.is_handicap_accessible}
                                                        icon='accessible'
                                                        label='Accessible'
                                                    />
                                                </div>
                                                <div className="center">
                                                    <div
                                                        className="tb-teal-text text-darken-1 text-bold"
                                                        style={{ fontSize: '1.4rem', paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                        onClick={() => toggleHelpers('attribute_updates', index)}
                                                    >
                                                        {/* <span className="material-symbols-outlined">
                                                            electric_bolt
                                                        </span> */}
                                                        <span>YES    </span>
                                                        <span className="material-symbols-outlined">
                                                            expand_more
                                                        </span>
                                                    </div>
                                                </div>
                                                {showHelpers[index]?.attribute_updates &&
                                                    <>
                                                        <CommentInput
                                                            key={`${index}-attribute-updates`}
                                                            item="attribute_updates"
                                                            placeholder="Please explain which attributes need updates."
                                                            comment={property.attribute_updates}
                                                            onCommentChange={(comment) => handleCommentChange(comment, 'attribute_updates', index)}
                                                        />
                                                    </>
                                                }
                                                
                                            </div>
                                            <div className="row">
                                                <p className="trip-report-direction center text-bold">
                                                    Please rate the property on the following qualities:
                                                </p>
                                                <div
                                                    className="rating-box"
                                                >
                                                    <RatingSelect
                                                        keyId={`${index}-accommodation`}
                                                        item="Accommodation"
                                                        icon="hotel"
                                                        rating={property.accommodation_rating}
                                                        onRatingChange={(rating) => handleRatingChange(rating, 'accommodation', index)}
                                                    />
                                                    <RatingSelect
                                                        keyId={`${index}-service`}
                                                        item="Service"
                                                        icon="concierge"
                                                        rating={property.service_rating}
                                                        onRatingChange={(rating) => handleRatingChange(rating, 'service', index)}
                                                    />
                                                    <RatingSelect
                                                        keyId={`${index}-food`}
                                                        item="Food"
                                                        icon="restaurant"
                                                        rating={property.food_rating}
                                                        onRatingChange={(rating) => handleRatingChange(rating, 'food', index)}
                                                    />
                                                    {propertyHasAnimals &&
                                                        <RatingSelect
                                                            keyId={`${index}-guide-vehicle`}
                                                            item="Guide/Vehicle"
                                                            icon="airport_shuttle"
                                                            rating={property.guide_rating}
                                                            onRatingChange={(rating) => handleRatingChange(rating, 'guide', index)}
                                                        />
                                                    }
                                                    <RatingSelect
                                                        keyId={`${index}-overall`}
                                                        item="Overall"
                                                        icon="favorite"
                                                        rating={property.overall_rating}
                                                        onRatingChange={(rating) => handleRatingChange(rating, 'overall', index)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="row" style={{ marginTop: '40px'}}>
                                                <p className="trip-report-direction center text-bold">
                                                    Please comment on the following qualities:
                                                </p>

                                                <div className="tb-teal-text text-darken-1 text-bold" style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px'}}>
                                                    <span className="material-symbols-outlined">
                                                    restaurant
                                                    </span>
                                                    Food & Beverage
                                                </div>
                                                <CommentInput
                                                    key={`${index}-food_and_beverage`}
                                                    item="food_and_beverage"
                                                    placeholder="Comments on the property's food and beverage."
                                                    comment={property.food_and_beverage_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'food_and_beverage', index)}
                                                />
                                                <div className="tb-teal-text text-darken-1 text-bold" style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px'}}>
                                                    <span className="material-symbols-outlined">
                                                    concierge
                                                    </span>
                                                    Management
                                                </div>
                                                <CommentInput
                                                    key={`${index}-management`}
                                                    item="management"
                                                    placeholder="Comments on the property's management."
                                                    comment={property.management_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'management', index)}
                                                />
                                                {propertyHasAnimals &&
                                                    <>
                                                        <div
                                                            className="tb-teal-text text-darken-1 text-bold"
                                                            style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                            onClick={() => toggleHelpers('guiding_comments', index)}
                                                        >
                                                            <span className="material-symbols-outlined">
                                                            airport_shuttle
                                                            </span>
                                                            <span>Guiding    </span>
                                                            <span className="material-symbols-outlined">
                                                                expand_more
                                                            </span>
                                                        </div>
                                                        {showHelpers[index]?.guiding_comments &&
                                                            <div style={{ paddingLeft: '20px' }}>
                                                                <ul className="custom-icons">
                                                                    <li>Include guide's name</li>
                                                                </ul>
                                                            </div>
                                                        }
                                                        <CommentInput
                                                            key={`${index}-guiding`}
                                                            item="guiding"
                                                            placeholder="Comments on the guiding and vehicle experience."
                                                            comment={property.guiding_comments}
                                                            onCommentChange={(comment) => handleCommentChange(comment, 'guiding', index)}
                                                        />
                                                        <div
                                                            className="tb-teal-text text-darken-1 text-bold"
                                                            style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                            onClick={() => toggleHelpers('animal_viewing_comments', index)}
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                pets
                                                            </span>
                                                            <span>Animal Viewing    </span>
                                                            <span className="material-symbols-outlined">
                                                                expand_more
                                                            </span>
                                                        </div>
                                                        {showHelpers[index]?.animal_viewing_comments &&
                                                            <div style={{ paddingLeft: '20px' }}>
                                                                <ul className="custom-icons">
                                                                    <li>What animals you saw or what most guests see according to the guides/what animals you will not see in the area</li>
                                                                </ul>
                                                            </div>
                                                        }
                                                        <CommentInput
                                                            key={`${index}-animal_viewing`}
                                                            item="animal_viewing"
                                                            placeholder="Comments on the animal viewing in the area."
                                                            comment={property.animal_viewing_comments}
                                                            onCommentChange={(comment) => handleCommentChange(comment, 'animal_viewing', index)}
                                                        />
                                                    </>
                                                }
                                                <div
                                                    className="tb-teal-text text-darken-1 text-bold"
                                                    style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                    onClick={() => toggleHelpers('seasonality_comments', index)}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        partly_cloudy_day
                                                    </span>
                                                    <span>Seasonality    </span>
                                                    <span className="material-symbols-outlined">
                                                        expand_more
                                                    </span>
                                                </div>
                                                {showHelpers[index]?.seasonality_comments &&
                                                    <div style={{ paddingLeft: '20px' }}>
                                                        <ul className="custom-icons">
                                                            <li>How the area transforms in different seasons? (ask your guide for this information)</li>
                                                        </ul>
                                                    </div>
                                                }
                                                <CommentInput
                                                    key={`${index}-seasonality`}
                                                    item="seasonality"
                                                    placeholder="Comments on the seasonality of the property."
                                                    comment={property.seasonality_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'seasonality', index)}
                                                />
                                                <div
                                                    className="tb-teal-text text-darken-1 text-bold"
                                                    style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                    onClick={() => toggleHelpers('clientele_comments', index)}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        supervisor_account
                                                    </span>
                                                    <span>Clientele    </span>
                                                    <span className="material-symbols-outlined">
                                                        expand_more
                                                    </span>
                                                </div>
                                                {showHelpers[index]?.clientele_comments &&
                                                <div style={{ paddingLeft: '20px' }}>
                                                    <ul className="custom-icons">
                                                        <li>Is it best for families, people who have mobility challenges, honeymoons, etc.?</li>
                                                    </ul>
                                                </div>
                                                }
                                                <CommentInput
                                                    key={`${index}-clientele`}
                                                    item="clientele"
                                                    placeholder="Comments on the property's clientele."
                                                    comment={property.clientele_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'clientele', index)}
                                                />
                                                <div
                                                    className="tb-teal-text text-darken-1 text-bold"
                                                    style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                    onClick={() => toggleHelpers('pairing_comments', index)}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        add_business
                                                    </span>
                                                    <span>Pairing    </span>
                                                    <span className="material-symbols-outlined">
                                                        expand_more
                                                    </span>
                                                </div>
                                                {showHelpers[index]?.pairing_comments &&
                                                    <div style={{ paddingLeft: '20px' }}>
                                                        <ul className="custom-icons">
                                                            <li>What other properties would this property pair well with?</li>
                                                        </ul>
                                                    </div>
                                                }
                                                <CommentInput
                                                    key={`${index}-pairing`}
                                                    item="pairing"
                                                    placeholder="Comments on the property's ideal pairing."
                                                    comment={property.pairing_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'pairing', index)}
                                                />
                                                <div
                                                    className="tb-teal-text text-darken-1 text-bold"
                                                    style={{ paddingLeft: '20px', paddingBottom: '0px', marginBottom: '0px', cursor: 'pointer'}}
                                                    onClick={() => toggleHelpers('insider_comments', index)}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        electric_bolt
                                                    </span>
                                                    <span>Insider Tips    </span>
                                                    <span className="material-symbols-outlined">
                                                        expand_more
                                                    </span>
                                                </div>
                                                {showHelpers[index]?.insider_comments &&
                                                    <div style={{ paddingLeft: '20px' }}>
                                                        <ul className="custom-icons">
                                                            <li>Services you didn't know about.</li>
                                                            <li>Unique selling points.</li>
                                                            <li>Anything out of the ordinary (good or bad).</li>
                                                            <li>Special rooms like <em>Request #7 for honeymooners as it is the most private or has the best view.</em></li>
                                                            <li>Logistics to get to the property if there is anything specific or special.</li>
                                                            <li>Any recent or upcoming changes to be aware of.</li>
                                                        </ul>
                                                    </div>
                                                }
                                                <CommentInput
                                                    key={`${index}-insider`}
                                                    item="insider"
                                                    placeholder="Any insider tips to pass along."
                                                    icon="psychology"
                                                    comment={property.insider_comments}
                                                    onCommentChange={(comment) => handleCommentChange(comment, 'insider', index)}
                                                />
                                            </div>
                                            
                                        </>
                                        }  
                                    </div>
                                    );
                                })}
                                <div className="row center" style={{ marginTop: '20px', marginBottom: '50px' }}>
                                    <button type="button" onClick={addAccommodation} className="btn tb-grey">
                                        + Property
                                    </button>
                                </div>
                                <h4 className="center report-title">Activities</h4>
                                <div className="container center">
                                    {formData.activities.map((activity, index) => {
                                        // console.log(activity);
                                        return (
                                            <div key={index} className="card potential-trip-card tb-grey lighten-4">
                                                <div className="card-content">
                                                    <div className="row container" style={{ width: '80%'}}>
                                                        <div className="col s11">
                                                            <input
                                                                type="text"
                                                                id="name"
                                                                value={activity.name}
                                                                onChange={handleActivityNameChange(index)}
                                                                placeholder="Activity/restaurant name"
                                                                style={{ marginRight: '20px', flexGrow: '1' }}
                                                                className="input-placeholder-dark"
                                                                autoComplete="off"
                                                            />
                                                        </div>
                                                        <div className="col s1">
                                                            <button
                                                                className="btn-floating btn-small waves-effect waves-light error-red"
                                                                onClick={() => removeActivity(index)}
                                                            >
                                                                x
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <RatingSelect
                                                            keyId={`activity-${index}-rating`}
                                                            item="Rating"
                                                            icon="star"
                                                            rating={activity.rating}
                                                            onRatingChange={(rating) => handleActivityRatingChange(rating, index)}
                                                        />
                                                    </div>
                                                    <div className="row">
                                                        <div className="col s6">
                                                            <Select
                                                                placeholder="Select activity type"
                                                                value={activity.type}
                                                                onChange={handleActivityTypeChange(index)}
                                                                options={[
                                                                    { label: "Restaurant", value: "restaurant" },
                                                                    { label: "Activity", value: "activity" }
                                                                ]}
                                                                classNamePrefix="select"
                                                                styles={{
                                                                    control: (provided, state) => ({
                                                                        ...provided,
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
                                                        </div>
                                                        <div className="col s6">
                                                            <Select
                                                                placeholder="Select property"
                                                                inputId="property_select"
                                                                value={locationOptions?.find(prop => prop.value === activity.location) || ''}
                                                                onChange={(selectedOption) => handleActivityLocationChange(index, selectedOption)}
                                                                options={locationOptions}
                                                                classNamePrefix="select"
                                                                styles={{
                                                                    control: (provided, state) => ({
                                                                        ...provided,
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
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <CommentInput
                                                            key={`activity-${index}-comment`}
                                                            item="comment"
                                                            placeholder="Comments on your experience at this activity."
                                                            icon="dinner_dining"
                                                            comment={activity.comments}
                                                            onCommentChange={(comment) => handleActivityCommentChange(comment, index)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="row">
                                        <button
                                            type="button"
                                            onClick={() => {addActivity()}}
                                            className="btn tb-grey"
                                            style={{ marginBottom: '50px'}}
                                        >
                                            + Activity / Restaurant
                                        </button>
                                    </div>
                                </div>
                                <div className="modal-footer center" style={{ marginBottom: '20px', zIndex: '-1' }}>
                                    <div>
                                        <button
                                            className="btn tb-teal darken-3"
                                            type="submit"
                                        >
                                            <span className="material-symbols-outlined">
                                                save
                                            </span>
                                            {trip_report_id ? 'Update Report' : 'Save Report'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default CreateEditTripReport;

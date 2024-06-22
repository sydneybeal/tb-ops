import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';
import RatingSelect from './RatingSelect';
import CommentInput from './CommentInput';
import SaveModal from './SaveModal';
import AttributeChip from '../PropertyDetails/AttributeChip';
import ReactDatePicker from 'react-datepicker';
import Select from 'react-select';
import moment from 'moment';
import M from 'materialize-css';

const CreateEditTripReport = () => {
    const { userDetails, logout } = useAuth();
    const navigate = useNavigate();
    const { trip_report_id } = useParams();
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [propertyOptions, setPropertyOptions] = useState();
    const [locationOptions, setLocationOptions] = useState();
    const [portfolioOptions, setPortfolioOptions] = useState();
    const [countryOptions, setCountryOptions] = useState();
    const [userOptions, setUserOptions] = useState();
    const [filteredUserOptions, setFilteredUserOptions] = useState([]);
    const [showTravelerSuggestions, setShowTravelerSuggestions] = useState(false);
    const suggestionsRef = useRef(null);
    const [travelerSearchText, setTravelerSearchText] = useState('');
    const [formData, setFormData] = useState({
        trip_report_id: trip_report_id || null,
        status: 'draft',
        travelers: [],
        document_updates: '',
        properties: [
            {
                travelers: [],
                date_in: '',
                site_inspection_only: false,
                date_out: '',
                property_id: '',
                property_name: '',
                portfolio_name: '',
                country_name: '',
                property_type: '',
                attribute_updates_comments: '',
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
                // allow to enter new property if it doesn't exist
                is_new_property: false,
                new_property_name: '',
                new_property_portfolio_id: '',
                new_property_portfolio_name: '',
                new_property_country_id: '',
                new_property_country_name: '',
                new_property_location: '',
                new_property_core_destination_id: '',
                new_property_core_destination_name: '',
            }
        ],
        activities: [
            {
                travelers: [],
                visit_date: '',
                name: '',
                rating: '',
                comments: '',
                type: '',
            }
        ]
    });
    const [hasChanged, setHasChanged] = useState(false);

    const initializeShowHelpers = (properties) => {
        return properties.map(() => ({
            animal_viewing_comments: true,
            seasonality_comments: true,
            clientele_comments: true,
            pairing_comments: true,
            insider_comments: true,
            guiding_comments: true,
            attribute_updates_comments: false,
        }));
    };

    const [showHelpers, setShowHelpers] = useState(initializeShowHelpers(formData.properties));
    const prevPropertiesLength = useRef(formData.properties.length);

    useEffect(() => {
        const newPropertiesCount = formData.properties.length - prevPropertiesLength.current;
        if (newPropertiesCount > 0) {
            setShowHelpers(prevShowHelpers => [
                ...prevShowHelpers,
                ...initializeShowHelpers(formData.properties.slice(-newPropertiesCount))
            ]);
        }
        prevPropertiesLength.current = formData.properties.length;
    }, [formData.properties]);
    
    const activityOptions = [
        { label: "Restaurant", value: "restaurant" },
        { label: "Activity", value: "activity" }
    ];

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const toggleHelpers = (item, index) => {
        setShowHelpers(prevShowHelpers => {
            const newShowHelpers = [...prevShowHelpers];
            newShowHelpers[index] = {
                ...newShowHelpers[index],
                [item]: !newShowHelpers[index][item],
            };
            return newShowHelpers;
        });
    };

    const toggleModal = () => {
        setShowSaveModal(!showSaveModal);
        document.body.style.overflow = '';
    };

    const mapApiToFormData = (data) => {
        const mapProperty = (property) => ({
            travelers: property.travelers || [],
            date_in: property.date_in || '',
            site_inspection_only: property.site_inspection_only || false,
            date_out: property.date_out || '',
            property_id: property.property_id || '',
            property_name: '', // Assuming these details need to be fetched separately or are empty initially
            portfolio_name: '',
            country_name: '',
            property_type: '',
            attribute_updates_comments: property.attribute_updates_comments || '',
            core_destination_name: '',
            accommodation_rating: (property.ratings.find(r => r.attribute === 'accommodation_rating') || {}).rating || '',
            service_rating: (property.ratings.find(r => r.attribute === 'service_rating') || {}).rating || '',
            food_rating: (property.ratings.find(r => r.attribute === 'food_rating') || {}).rating || '',
            guide_rating: (property.ratings.find(r => r.attribute === 'guide_rating') || {}).rating || '',
            overall_rating: (property.ratings.find(r => r.attribute === 'overall_rating') || {}).rating || '',
            food_and_beverage_comments: (property.comments.find(c => c.attribute === 'food_and_beverage_comments') || {}).comments || '',
            management_comments: (property.comments.find(c => c.attribute === 'management_comments') || {}).comments || '',
            guiding_comments: (property.comments.find(c => c.attribute === 'guiding_comments') || {}).comments || '',
            animal_viewing_comments: (property.comments.find(c => c.attribute === 'animal_viewing_comments') || {}).comments || '',
            seasonality_comments: (property.comments.find(c => c.attribute === 'seasonality_comments') || {}).comments || '',
            clientele_comments: (property.comments.find(c => c.attribute === 'clientele_comments') || {}).comments || '',
            pairing_comments: (property.comments.find(c => c.attribute === 'pairing_comments') || {}).comments || '',
            insider_comments: (property.comments.find(c => c.attribute === 'insider_comments') || {}).comments || '',
            is_new_property: false, // Assuming default is false
            new_property_name: '',
            new_property_portfolio_id: '',
            new_property_portfolio_name: '',
            new_property_country_id: '',
            new_property_country_name: '',
            new_property_location: '',
            new_property_core_destination_id: '',
            new_property_core_destination_name: ''
        });
    
        const mapActivity = (activity) => ({
            travelers: activity.travelers || [],
            visit_date: activity.visit_date || '',
            name: activity.name || '',
            rating: activity.rating || '',
            comments: activity.comments || '',
            type: activity.type || '',
            location: activity.location || ''
        });
    
        return {
            trip_report_id: data.id || null,
            status: data.status || 'draft',
            travelers: data.travelers || [],
            document_updates: data.document_updates || '', // Assuming this field is not in the API response and defaulting to empty
            properties: data.properties.map(mapProperty),
            activities: data.activities.map(mapActivity)
        };
    };      

    const fetchTripReport = useCallback(async (tripReportId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API}/v1/trip_reports/${tripReportId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
            });
            if (response.detail && response.detail === "Could not validate credentials") {
                // Session has expired or credentials are invalid
                M.toast({
                    html: 'Your session has timed out, please log in again.',
                    displayLength: 4000,
                    classes: 'error-red',
                });
                logout();
                return;
            }

            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }

            const data = await response.json();
            // console.log(JSON.stringify(data));
            // setFormData(prevState => ({
            //     ...prevState,
            //     ...data,
            //     trip_report_id: tripReportId,
            // }));
            const mappedData = mapApiToFormData(data);
            console.log(JSON.stringify(mappedData));
            setFormData(mappedData);
        } catch (error) {
            console.error('Error fetching trip report:', error);
            M.toast({
                html: 'Failed to load trip report.',
                displayLength: 4000,
                classes: 'error-red',
            });
        }
    }, [logout, userDetails.token]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/property_details?entered_only=false`, {
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
                setPropertyOptions(formattedProperties);

                // set portfolio options for usage in dropdowns
                const portfolioStrings = new Set(data
                    .filter(property => property.portfolio_name && property.portfolio_id)
                    .map(property => JSON.stringify({
                        label: property.portfolio_name,
                        value: property.portfolio_id
                    }))
                );
                const uniquePortfolios = Array.from(portfolioStrings).map(string => JSON.parse(string));
                setPortfolioOptions(uniquePortfolios);

                // set location options for usage in dropdowns
                const locationStrings = new Set(data
                    .filter(property => property.location && property.country_name)  // Ensure both location and country_name are truthy
                    .map(property => JSON.stringify({
                        label: `${property.location} (${property.country_name})`,
                        value: property.location,
                        country_name: property.country_name,
                        country_id: property.country_id,
                    }))
                );
                const uniqueLocations = Array.from(locationStrings).map(string => JSON.parse(string));
                setLocationOptions(uniqueLocations);

                // set country options for usage in dropdowns
                const countryStrings = new Set(data
                    .filter(property => property.country_id && property.country_name)
                    .map(property => JSON.stringify({
                        label: property.country_name,
                        value: property.country_id,
                        core_destination_id: property.core_destination_id,
                        core_destination_name: property.core_destination_name
                    }))
                );
                const uniqueCountries = Array.from(countryStrings).map(string => JSON.parse(string));
                setCountryOptions(uniqueCountries);
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
    }, [userDetails.token, logout]);

    useEffect(() => {
        if (trip_report_id) {
            fetchTripReport(trip_report_id);
        }
    }, [trip_report_id, fetchTripReport]);

    const hasAnimals = (property) => {
        // Allow all answers for newly entered properties
        if (property.is_new_property) {
            return true;
        }
        // Check if core_destination is Africa
        const isAfrica = property.core_destination_name === 'Africa';

        // Check if property_type is "standard accommodation" or "luxury accommodation" or blank
        const isAccommodation = (
            property.property_type?.toLowerCase() === 'standard accommodation' ||
            property.property_type?.toLowerCase() === 'luxury accommodation' ||
            property.property_type === null
        );
        
        // Return true if both conditions are met
        return isAfrica && isAccommodation;
    };

    const prepareFormDataForSubmission = useCallback((formData) => {
        console.log(JSON.stringify(formData));
        const convertEmptyToNull = (value) => {
            return value === '' ? null : value;
        };
        // Copy the formData to avoid direct mutation
        const submissionData = { ...formData };
        submissionData.trip_report_id = convertEmptyToNull(submissionData.trip_report_id);
        submissionData.travelers = submissionData.travelers.map(traveler => traveler.id);
        
        // Process each property
        submissionData.properties = submissionData.properties.map(property => {
            const filteredProperty = {
                travelers: property.travelers.map(traveler => traveler.id),
                date_in: convertEmptyToNull(property.date_in),
                site_inspection_only: property.site_inspection_only,
                date_out: convertEmptyToNull(property.date_out),
                property_id: convertEmptyToNull(property.property_id),
                attribute_updates_comments: convertEmptyToNull(property.attribute_updates_comments),
                accommodation_rating: convertEmptyToNull(property.accommodation_rating),
                service_rating: convertEmptyToNull(property.service_rating),
                food_rating: convertEmptyToNull(property.food_rating),
                guide_rating: convertEmptyToNull(property.guide_rating),
                overall_rating: convertEmptyToNull(property.overall_rating),
                food_and_beverage_comments: convertEmptyToNull(property.food_and_beverage_comments),
                management_comments: convertEmptyToNull(property.management_comments),
                guiding_comments: convertEmptyToNull(property.guiding_comments),
                animal_viewing_comments: convertEmptyToNull(property.animal_viewing_comments),
                seasonality_comments: convertEmptyToNull(property.seasonality_comments),
                clientele_comments: convertEmptyToNull(property.clientele_comments),
                pairing_comments: convertEmptyToNull(property.pairing_comments),
                insider_comments: convertEmptyToNull(property.insider_comments)
            };
    
            // Conditionally include new property fields if it is a new property
            if (property.is_new_property) {
                filteredProperty.new_property_name = convertEmptyToNull(property.new_property_name);
                filteredProperty.new_property_portfolio_id = convertEmptyToNull(property.new_property_portfolio_id);
                filteredProperty.new_property_portfolio_name = convertEmptyToNull(property.new_property_portfolio_name);
                filteredProperty.new_property_country_id = convertEmptyToNull(property.new_property_country_id);
                filteredProperty.new_property_country_name = convertEmptyToNull(property.new_property_country_name);
                filteredProperty.new_property_location = convertEmptyToNull(property.new_property_location);
                filteredProperty.new_property_core_destination_id = convertEmptyToNull(property.new_property_core_destination_id);
                filteredProperty.new_property_core_destination_name = convertEmptyToNull(property.new_property_core_destination_name);
            }
    
            return filteredProperty;
        });
    
        // Process each activity
        submissionData.activities = submissionData.activities.map(activity => ({
            travelers: activity.travelers.map(traveler => traveler.id),
            name: convertEmptyToNull(activity.name),
            visit_date: convertEmptyToNull(activity.visit_date),
            rating: convertEmptyToNull(activity.rating),
            comments: convertEmptyToNull(activity.comments),
            type: convertEmptyToNull(activity.type),
            location: convertEmptyToNull(activity.location)
        }));
    
        submissionData.updated_by = userDetails.email || '';
      
        return submissionData;
    }, [userDetails.email]);

    const saveTripReport = useCallback(async (preparedData, status) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API}/v1/trip_reports`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(preparedData),
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
    
            const data = await response.json();
            let toastHtml = '';
            let toastColor = 'success-green';
    
            if (data.error) {
                toastHtml = data.error;
                toastColor = 'error-red';
            } else {
                toastHtml = status === 'draft' ? 'Draft saved.' : 'Trip report has been published.';
                if (!preparedData.trip_report_id && data.trip_report_id) {
                    setFormData(prevState => ({
                        ...prevState,
                        trip_report_id: data.trip_report_id,
                        status,
                    }));
                } else {
                    setFormData(prevState => ({
                        ...prevState,
                        status,
                    }));
                }
                setHasChanged(false); // Reset change flag after successful save
                if (!trip_report_id && data.trip_report_id) {
                    navigate(`/trip_reports/edit/${data.trip_report_id}`);
                }
            }
    
            M.toast({
                html: toastHtml,
                displayLength: 3000,
                classes: toastColor,
            });
    
            setShowSaveModal(false);
        } catch (error) {
            console.error('Error:', error);
            M.toast({
                html: 'Your entry was valid, but we were unable to save to the database.',
                displayLength: 4000,
                classes: 'warning-yellow tb-md-black-text',
            });
        } finally {
            // setLoading(false);
        }
    }, [userDetails.token, navigate, trip_report_id]);

    const handleFormChange = (newData) => {
        setFormData(newData);
        setHasChanged(true);
    };

    const saveDraft = useCallback(() => {
        if (hasChanged) {
            const preparedData = prepareFormDataForSubmission(formData);
            saveTripReport(preparedData, "draft");
        }
    }, [hasChanged, formData, saveTripReport, prepareFormDataForSubmission]);

    useEffect(() => {
        const handler = setTimeout(() => {
            saveDraft();
        }, 2000); // Debounce time

        return () => clearTimeout(handler);
    }, [saveDraft]);

    const handleSaveAsDraft = () => {
        const preparedData = prepareFormDataForSubmission(formData);
        saveTripReport(preparedData, "draft");
    };

    const handleSaveAsFinal = async () => {
        const updatedFormData = { ...formData, status: 'final' };
        const preparedData = prepareFormDataForSubmission(updatedFormData);

        try {
            await saveTripReport(preparedData, "final");
        } catch (error) {
            console.error('Error saving trip report:', error);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Submit logic here
        // Redirect after submit
    };

    const handleUserSearchTextChange = (e) => {
        const value = e.target.value;
        setTravelerSearchText(value);

        // Filter user options based on input and exclude already selected travelers
        const filtered = userOptions.filter(user =>
            user.email.toLowerCase().includes(value.toLowerCase()) &&
            !formData.travelers.some(traveler => traveler.id === user.id)
        );
        setFilteredUserOptions(filtered);
    };

    const addAccommodation = () => {
        setFormData((prevFormData) => {
            const newProperty = {
                travelers: [...prevFormData.travelers], // Copy the travelers from formData
                date_in: '',
                site_inspection_only: false,
                date_out: '',
                property_id: '',
                property_name: '',
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
                is_new_property: false,
                new_property_name: '',
                new_property_portfolio_id: '',
                new_property_portfolio_name: '',
                new_property_country_id: '',
                new_property_country_name: '',
                new_property_location: '',
                new_property_core_destination_id: '',
                new_property_core_destination_name: '',
            };
    
            return {
                ...prevFormData,
                properties: [...prevFormData.properties, newProperty],
            };
        });
        setShowHelpers(prevShowHelpers => [
            ...prevShowHelpers,
            {
                animal_viewing_comments: true,
                seasonality_comments: true,
                clientele_comments: true,
                pairing_comments: true,
                insider_comments: true,
                guiding_comments: true,
                attribute_updates_comments: false,
            }
        ]);
        setHasChanged(true);
    };

    const addActivity = () => {
        handleFormChange((prevFormData) => {
            const newActivity = {
                name: '',
                visit_date: '',
                travelers: [...prevFormData.travelers], // Copy the travelers from formData
                rating: '',
                comments: '',
                type: '',
            };
    
            return {
                ...prevFormData,
                activities: [...prevFormData.activities, newActivity],
            };
        });
    };

    const handleActivityNameChange = (activityIndex) => (e) => {
        handleFormChange((prevFormData) => {
            const newActivities = [...prevFormData.activities];
            newActivities[activityIndex].name = e.target.value;
    
            return {
                ...prevFormData,
                activities: newActivities
            };
        });
    };

    const handleActivityLocationChange = (activityIndex, selectedOption) => {
        handleFormChange((prevFormData) => {
            const newActivities = [...prevFormData.activities];
            newActivities[activityIndex].location = selectedOption ? selectedOption.value : null; // Use selectedOption.value or reset to null if cleared
    
            return {
                ...prevFormData,
                activities: newActivities
            };
        });
    };

    const handleActivityDateChange = (index, date) => {
        handleFormChange((prevFormData) => {
            const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
            const updatedActivities = prevFormData.activities.map((activity, i) => {
                if (i === index) {
                    return { ...activity, visit_date: newValue };
                }
                return activity;
            });
    
            return {
                ...prevFormData,
                activities: updatedActivities
            };
        });
    };
    
    const getOpenToDate = () => {
        const propertyDates = formData.properties.map(property => property.date_in).filter(date => date);
        if (propertyDates.length === 0) {
            return new Date();
        }
        const minDateIn = moment.min(propertyDates.map(date => moment(date)));
        return minDateIn.isValid() ? minDateIn.toDate() : new Date();
    };

    const handleActivityTypeChange = (activityIndex) => (selectedOption) => {
        handleFormChange((prevFormData) => {
            const newActivities = [...prevFormData.activities];
            newActivities[activityIndex].type = selectedOption ? selectedOption.value : ''; // Check for null and set to empty string
    
            return {
                ...prevFormData,
                activities: newActivities
            };
        });
    };
    
    const handleActivityRatingChange = (rating, activityIndex) => {
        handleFormChange((prevFormData) => {
            const newActivities = [...prevFormData.activities];
            newActivities[activityIndex].rating = rating;
    
            return {
                ...prevFormData,
                activities: newActivities
            };
        });
    };

    const handleActivityCommentChange = (comment, activityIndex) => {
        handleFormChange((prevFormData) => {
            const newActivities = [...prevFormData.activities];
            newActivities[activityIndex].comments = comment;
    
            return {
                ...prevFormData,
                activities: newActivities
            };
        });
    };
    
    const removeActivity = (activityIndex) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this activity?");
        if (confirmDelete) {
            handleFormChange((prevFormData) => {
                return {
                    ...prevFormData,
                    activities: prevFormData.activities.filter((_, i) => i !== activityIndex)
                };
            });
        }
    };

    const removeAccommodation = (index) => {
        const confirmDelete = window.confirm("Are you sure you want to delete your progress on this property?");
        if (confirmDelete) {
            handleFormChange((prevFormData) => {
                return {
                    ...prevFormData,
                    properties: prevFormData.properties.filter((_, i) => i !== index)
                };
            });
            setShowHelpers(prevShowHelpers => prevShowHelpers.filter((_, i) => i !== index));
        }
    };

    const handleDateChange = (index, name, date) => {
        handleFormChange((prevFormData) => {
            const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
            const updatedProperties = prevFormData.properties.map((property, i) => {
                if (i === index) {
                    return { ...property, [name]: newValue };
                }
                return property;
            });
    
            return {
                ...prevFormData,
                properties: updatedProperties
            };
        });
    };

    const handleUserSelect = (user) => {
        // Only add the user if they aren't already in the list
        if (!formData.travelers.some(traveler => traveler.id === user.id)) {
            handleFormChange((prevData) => {
                const updatedTravelers = [...prevData.travelers, user];
    
                // Update properties with the new traveler
                const updatedProperties = prevData.properties.map(property => ({
                    ...property,
                    travelers: updatedTravelers
                }));
    
                // Update activities with the new traveler
                const updatedActivities = prevData.activities.map(activity => ({
                    ...activity,
                    travelers: updatedTravelers
                }));
    
                return {
                    ...prevData,
                    travelers: updatedTravelers,
                    properties: updatedProperties,
                    activities: updatedActivities
                };
            });
    
            setTravelerSearchText('');
            setFilteredUserOptions([]);
            setShowTravelerSuggestions(false);
        }
    };

    const handleUserDelete = (userId) => {
        handleFormChange((prevData) => {
            const updatedTravelers = prevData.travelers.filter(traveler => traveler.id !== userId);
    
            // Update properties to remove the traveler
            const updatedProperties = prevData.properties.map(property => ({
                ...property,
                travelers: property.travelers.filter(traveler => traveler.id !== userId)
            }));
    
            // Update activities to remove the traveler
            const updatedActivities = prevData.activities.map(activity => ({
                ...activity,
                travelers: activity.travelers.filter(traveler => traveler.id !== userId)
            }));
    
            return {
                ...prevData,
                travelers: updatedTravelers,
                properties: updatedProperties,
                activities: updatedActivities
            };
        });
    };

    const handleUserSegmentActivityRemove = (type, index, travelerId) => {
        handleFormChange((prevData) => {
            if (type === 'property') {
                const updatedProperties = prevData.properties.map((property, i) => {
                    if (i === index) {
                        return {
                            ...property,
                            travelers: property.travelers.filter(traveler => traveler.id !== travelerId)
                        };
                    }
                    return property;
                });
    
                return {
                    ...prevData,
                    properties: updatedProperties
                };
            } else if (type === 'activity') {
                const updatedActivities = prevData.activities.map((activity, i) => {
                    if (i === index) {
                        return {
                            ...activity,
                            travelers: activity.travelers.filter(traveler => traveler.id !== travelerId)
                        };
                    }
                    return activity;
                });
    
                return {
                    ...prevData,
                    activities: updatedActivities
                };
            }
            return prevData;
        });
    };

    const handleRestoreTravelers = (type, index) => {
        handleFormChange((prevData) => {
            if (type === 'property') {
                const updatedProperties = prevData.properties.map((property, i) => {
                    if (i === index) {
                        return {
                            ...property,
                            travelers: [...prevData.travelers]
                        };
                    }
                    return property;
                });
    
                return {
                    ...prevData,
                    properties: updatedProperties
                };
            } else if (type === 'activity') {
                const updatedActivities = prevData.activities.map((activity, i) => {
                    if (i === index) {
                        return {
                            ...activity,
                            travelers: [...prevData.travelers]
                        };
                    }
                    return activity;
                });
    
                return {
                    ...prevData,
                    activities: updatedActivities
                };
            }
            return prevData;
        });
    };

    const handlePropertyChange = (index, selectedOption) => {
        handleFormChange((prevData) => {
            const updatedProperties = prevData.properties.map((property, i) => {
                if (i === index) {
                    return {
                        ...property,
                        'property_id': selectedOption ? selectedOption.value : '',
                        'property_name': selectedOption ? selectedOption.name : '',
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
                        // Reset animal/guide ratings/comments if no longer applicable
                        'guide_rating': hasAnimals(selectedOption) ? property.guide_rating : null,
                        'guiding_comments': hasAnimals(selectedOption) ? property.guiding_comments : null,
                        'animal_viewing_comments': hasAnimals(selectedOption) ? property.animal_viewing_comments : null
                    };
                }
                return property;
            });
    
            return {
                ...prevData,
                properties: updatedProperties
            };
        });
    };

    const handleRatingChange = (rating, item, index) => {
        handleFormChange((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][`${item}_rating`] = rating;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };
    
    const handleCommentChange = (comment, item, index) => {
        handleFormChange((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][`${item}_comments`] = comment;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };
    
    const handleDocumentCommentChange = (comment) => {
        handleFormChange((prevState) => {
            return {
                ...prevState,
                document_updates: comment
            };
        });
    };

    const handleSiteInspectionChange = (index) => {
        handleFormChange((prevFormData) => {
            const newProperties = [...prevFormData.properties];
            const property = newProperties[index];
    
            if (property.site_inspection_only) {
                // Unchecking the box
                property.site_inspection_only = false;
            } else {
                // Checking the box
                property.site_inspection_only = true;
                property.date_out = null;
            }
    
            return {
                ...prevFormData,
                properties: newProperties,
            };
        });
    };
    
    const handlePropertyEntryChange = (index, value) => {
        handleFormChange((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index].is_new_property = value;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };
    
    const handlePropertyItemChange = (index, item, value) => {
        handleFormChange((prevState) => {
            const newProperties = [...prevState.properties];
            newProperties[index][item] = value;
            return {
                ...prevState,
                properties: newProperties
            };
        });
    };

    return (
        <>
            <header>
                <Navbar title="Trip Reports" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '80%', paddingBottom: '100px' }}>
                    {showSaveModal && (
                        <SaveModal
                            isOpen={showSaveModal}
                            onClose={toggleModal}
                            formData={formData}
                            onSaveAsDraft={handleSaveAsDraft}
                            onSaveAsFinal={handleSaveAsFinal}
                        />
                    )}
                    <div className="card potential-trip-card" style={{ marginTop: '20px', paddingTop: '10px'}}>
                        <div className="card-content">
                            <h3 className="center report-title">{formData.status === 'final' ? 'Update' : 'New'} Trip Report</h3>
                            <div className="center">
                                {formData.status === 'final' ? (
                                    <div className="chip success-green tb-off-white-text text-bold">
                                        PUBLISHED
                                    </div>
                                ) : (
                                    <div className="chip warning-yellow tb-md-grey-text text-bold">
                                        DRAFT
                                    </div>
                                )
                                }
                            </div>
                            <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="input-field col s12 l8 offset-l2 center">
                                    <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                        person_add
                                    </span>
                                    <input
                                        type="text"
                                        name="travelers"
                                        id="travelers"
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
                            {formData.travelers.length > 0 && (
                                <div className="row center">
                                    <h5 className="report-title">Travelers</h5>
                                    {formData.travelers.map(traveler => (
                                        <span style={{ paddingLeft: '18px' }} key={traveler.id} className="chip tb-teal darken-3 tb-off-white-text">
                                            <span style={{ fontSize: '1.1rem'}} >{traveler.email.split('@')[0]} </span>
                                            <button
                                                className="btn btn-floating btn-tiny tb-grey lighten-2"
                                                type="button"
                                                style={{ marginLeft: '4px', marginBottom: '6px', paddingTop: '5px', paddingLeft: '1px'}}
                                                onClick={() => handleUserDelete(traveler.id)}
                                            >
                                                <span className="material-symbols-outlined text-bold" style={{ fontSize: '0.8rem'}} >
                                                    close
                                                </span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            {formData.travelers.length > 1 && (
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
                            </div>
                            )}
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
                                    comment={formData.document_updates}
                                    onCommentChange={(comment) => handleDocumentCommentChange(comment)}
                                />
                                <h4 className="center report-title">Properties</h4>
                                {formData.properties.map((property, index) => {
                                    const propertyHasAnimals = hasAnimals(property);
                                    return (
                                    <div key={index} style={{ marginTop: '40px' }}>
                                        <div className="row">
                                            <div className="col s11">
                                                <div
                                                    className="chip tb-teal lighten-2 text-bold"
                                                    style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {index + 1}
                                                </div>
                                                {(property.portfolio_name || property.new_property_portfolio_name) &&
                                                    <div className="chip tb-teal lighten-3">
                                                        <span className="text-bold">
                                                            Portfolio:&nbsp;
                                                        </span>
                                                            {property.portfolio_name || property.new_property_portfolio_name}
                                                        &nbsp;
                                                        <span className="material-symbols-outlined">
                                                            store
                                                        </span>
                                                    </div>
                                                }
                                                {(property.country_name || property.new_property_country_name) &&
                                                    <div className="chip tb-grey lighten-3">
                                                        <span className="text-bold">
                                                            Country:&nbsp;
                                                        </span>
                                                            {property.country_name || property.new_property_country_name}
                                                        &nbsp;
                                                        <span className="material-symbols-outlined">
                                                            globe
                                                        </span>
                                                    </div>
                                                }
                                                {(property.core_destination_name || property.new_property_core_destination_name) &&
                                                    <div className="chip tb-grey lighten-3">
                                                        <span className="text-bold">
                                                            Core Destination:&nbsp;
                                                        </span>
                                                            {property.core_destination_name || property.new_property_core_destination_name}
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
                                        {/* TODO: add list of .travelers to allow deleting people from segments */}
                                        {formData.travelers.length > 0 && (
                                            <div className="row center" style={{ fontSize: '1.2rem'}}>
                                                <span className="text-bold">Travelers: </span>
                                                {property.travelers.length > 0 ? (
                                                    property.travelers.map((traveler, travelerIndex) => (
                                                        <React.Fragment key={traveler.id}>
                                                            <span className="text-bold tb-teal-text">
                                                                {traveler.email.split('@')[0]}
                                                            </span>
                                                            <button
                                                                className="btn btn-floating btn-tiny tb-grey lighten-2"
                                                                type="button"
                                                                style={{ marginLeft: '4px', marginBottom: '6px', paddingTop: '5px', paddingLeft: '1px'}}
                                                                onClick={() => handleUserSegmentActivityRemove('property', index, traveler.id)}
                                                            >
                                                                <span className="material-symbols-outlined text-bold" style={{ fontSize: '0.8rem'}}>
                                                                    close
                                                                </span>
                                                            </button>
                                                            {travelerIndex < property.travelers.length - 1 && ', '}
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <button
                                                        className="btn btn-small btn-floating tb-teal darken-2"
                                                        type="button"
                                                        onClick={() => handleRestoreTravelers('property', index)}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            group_add
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div className="row">
                                            <div className="col s12 l8">
                                                <div className="row">
                                                    {(!property.property_id && !(property.new_property_name)) && (
                                                        <div className="row" style={{ marginLeft: '5px'}}>
                                                            <div>
                                                                <em className="tb-grey-text">
                                                                    Please select an&nbsp;
                                                                    <a
                                                                        className="text-bold new-existing-prop tb-teal-text text-darken-1"
                                                                        href="/#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handlePropertyEntryChange(index, false);
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
                                                                        onClick={(e) => { e.preventDefault(); handlePropertyEntryChange(index, true); }}>
                                                                        <span className="material-symbols-outlined">
                                                                            add_circle
                                                                        </span>
                                                                        New Property
                                                                    </a>
                                                                </em>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!property.is_new_property ? (
                                                        <>
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="card new-property-card tb-grey lighten-4">
                                                                <div className="card-content">
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <em className="text-bold tb-grey-text text-darken-3" style={{ marginBottom: '10px'}}>
                                                                            Enter details known about the property...&nbsp;
                                                                        </em>
                                                                        <a
                                                                            className="text-bold new-existing-prop error-red-text"
                                                                            href="/#"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handlePropertyEntryChange(index, false);
                                                                                handlePropertyItemChange(index, 'new_property_name', '');
                                                                                handlePropertyItemChange(index, 'new_property_core_destination_name', '');
                                                                                handlePropertyItemChange(index, 'new_property_core_destination_id', '');
                                                                                handlePropertyItemChange(index, 'new_property_portfolio_name', '');
                                                                                handlePropertyItemChange(index, 'new_property_portfolio_id', '');
                                                                                handlePropertyItemChange(index, 'new_property_country_name', '');
                                                                                handlePropertyItemChange(index, 'new_property_country_id', '');
                                                                                handlePropertyItemChange(index, 'new_property_location', '');
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
                                                                                id={`new_property_name-${index}`}
                                                                                value={property.new_property_name || ''}
                                                                                onChange={(e) => handlePropertyItemChange(index, 'new_property_name', e.target.value)}
                                                                                placeholder="Property Name"
                                                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                                                                className="input-placeholder-dark"
                                                                            />
                                                                            <label htmlFor={`new_property_name-${index}`} className="tb-grey-text text-darken-3">
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
                                                                                id={`new_portfolio_select-${index}`}
                                                                                value={portfolioOptions.find(cons => cons.value === property.new_property_portfolio_id) || ''}
                                                                                onChange={(selectedOption) => {
                                                                                    handlePropertyItemChange(index, 'new_property_portfolio_id', selectedOption ? selectedOption.value : '');
                                                                                    handlePropertyItemChange(index, 'new_property_portfolio_name', selectedOption ? selectedOption.label : '');
                                                                                }}
                                                                                options={portfolioOptions}
                                                                                isClearable
                                                                                style={{ flexGrow: '1' }}
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
                                                                            />
                                                                            <label htmlFor={`new_portfolio_select-${index}`} className="tb-grey-text text-darken-3">
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
                                                                                placeholder="Select location"
                                                                                inputId={`new_property_location_select-${index}`}
                                                                                value={locationOptions?.find(prop => prop.value === property.new_property_location) || ''}
                                                                                onChange={(selectedOption) => {
                                                                                    handlePropertyItemChange(index, 'new_property_location', selectedOption ? selectedOption.value : '');
                                                                                    handlePropertyItemChange(index, 'new_property_country_name', selectedOption ? selectedOption.country_name : '');
                                                                                    handlePropertyItemChange(index, 'new_property_country_id', selectedOption ? selectedOption.country_id : '');
                                                                                }}
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
                                                                            <label htmlFor={`new_property_location_select-${index}`} className="tb-grey-text text-darken-3">
                                                                                <span className="material-symbols-outlined">
                                                                                    near_me
                                                                                </span>
                                                                                Location
                                                                            </label>
                                                                        </div>
                                                                        <div className="col s6">
                                                                            <Select
                                                                                placeholder="Select Country"
                                                                                id={`new_property_country_select-${index}`}
                                                                                value={countryOptions.find(cons => cons.value === property.new_property_country_id) || ''}
                                                                                onChange={(selectedOption) => {
                                                                                    handlePropertyItemChange(index, 'new_property_country_id', selectedOption ? selectedOption.value : '');
                                                                                    handlePropertyItemChange(index, 'new_property_country_name', selectedOption ? selectedOption.label : '');
                                                                                    handlePropertyItemChange(index, 'new_property_core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                                                                    handlePropertyItemChange(index, 'new_property_core_destination_id', selectedOption ? selectedOption.core_destination_id : '');
                                                                                }}
                                                                                options={countryOptions}
                                                                                isClearable
                                                                                style={{ flexGrow: '1' }}
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
                                                                            />
                                                                            <label htmlFor={`new_property_country_select-${index}`} className="tb-grey-text text-darken-3">
                                                                                <span className="material-symbols-outlined">
                                                                                    globe
                                                                                </span>
                                                                                Country Name
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="row">
                                                    {(property.location || property.new_property_location) &&
                                                        <div className="chip tb-grey lighten-3">
                                                            <span className="text-bold">
                                                                Location:&nbsp;
                                                            </span>
                                                                {property.location || property.new_property_location}
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
                                                                checked={property.site_inspection_only || false}
                                                                onChange={() => handleSiteInspectionChange(index)}
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
                                        {(property.property_id || property.is_new_property) &&
                                        <>
                                            <div className="row">
                                                <p className="trip-report-direction center text-bold">
                                                    Do any of the following attributes require updates?
                                                </p>
                                                <div className="col s12 prop-chips-container" style={{ paddingBottom: '20px', paddingTop: '10px' }}>
                                                    {propertyHasAnimals &&
                                                        <AttributeChip
                                                            attribute={property.has_trackers || null}
                                                            icon='pets'
                                                            label='Trackers'
                                                        />
                                                    }
                                                    <AttributeChip
                                                        attribute={property.has_wifi_in_room || null}
                                                        icon='wifi_home'
                                                        label='WiFi (Room)'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_wifi_in_common_areas || null}
                                                        icon='wifi'
                                                        label='WiFi (Common Area)'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_hairdryers || null}
                                                        icon='self_care'
                                                        label='Hair Dryers'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_credit_card_tipping || null}
                                                        icon='credit_card_heart'
                                                        label='Credit Card Tips'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_pool || null}
                                                        icon='pool'
                                                        label='Pool'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.has_heated_pool || null}
                                                        icon='local_fire_department'
                                                        label='Heated Pool'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.is_child_friendly || null}
                                                        icon='family_restroom'
                                                        label='Child Friendly'
                                                    />
                                                    <AttributeChip
                                                        attribute={property.is_handicap_accessible || null}
                                                        icon='accessible'
                                                        label='Accessible'
                                                    />
                                                </div>
                                                <div className="center">
                                                    <div
                                                        className="chip tb-teal darken-2 tb-grey-text text-lighten-4 text-bold"
                                                        style={{ fontSize: '1.1rem', paddingLeft: '20px', paddingBottom: '10px', marginBottom: '0px', cursor: 'pointer'}}
                                                        onClick={() => toggleHelpers('attribute_updates_comments', index)}
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
                                                {showHelpers[index]?.attribute_updates_comments &&
                                                    <>
                                                        <CommentInput
                                                            key={`${index}-attribute-updates`}
                                                            item="attribute_updates"
                                                            placeholder="Please explain which attributes need updates."
                                                            comment={property.attribute_updates_comments || ''}
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
                                <h4 className="center report-title" style={{ marginBottom: '40px' }}>Activities</h4>
                                <div className="container" style={{ width: '80%' }}>
                                    {formData.activities.map((activity, index) => {
                                        return (
                                            <div key={index} className="card potential-trip-card tb-grey lighten-4">
                                                <div className="card-content">
                                                    <div className="row container" style={{ width: '100%'}}>
                                                        <div className="col s8">
                                                            <input
                                                                type="text"
                                                                id={`activity-name-${index}`}
                                                                value={activity.name || ''}
                                                                onChange={handleActivityNameChange(index)}
                                                                placeholder="Activity/Restaurant name"
                                                                style={{ marginRight: '20px', flexGrow: '1', fontSize: '1.25rem' }}
                                                                className="input-placeholder-dark"
                                                                autoComplete="off"
                                                            />
                                                            <label 
                                                                htmlFor={`activity-name-${index}`} 
                                                                className="text-bold" 
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    local_activity
                                                                </span>
                                                                Activity/Restaurant Name
                                                            </label>
                                                        </div>
                                                        <div className="col s3">
                                                            <div>
                                                                <ReactDatePicker
                                                                    id={`activity-date-${index}`}
                                                                    selected={activity.visit_date ? moment(activity.visit_date).toDate() : null}
                                                                    onChange={(date) => { handleActivityDateChange(index, date) }}
                                                                    isClearable
                                                                    name="date_in"
                                                                    placeholderText='Visit Date'
                                                                    className="date-input-modal"
                                                                    dateFormat="MM/dd/yyyy"
                                                                    style={{ fontSize: '1.25rem', width: '100%' }}
                                                                    minDate={new Date('2017-01-01')}
                                                                    maxDate={new Date('2100-12-31')}
                                                                    autoComplete="off"
                                                                    openToDate={getOpenToDate()}
                                                                />
                                                            </div>
                                                            <label 
                                                                htmlFor={`activity-date-${index}`} 
                                                                className="text-bold" 
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    event
                                                                </span>
                                                                Visit Date
                                                            </label>
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
                                                    {/* TODO: add list of .travelers to allow deleting people from activities */}
                                                    {formData.travelers.length > 0 && (
                                                        <div className="row center" style={{ fontSize: '1.2rem'}}>
                                                            <span className="text-bold">Travelers: </span>
                                                            {activity.travelers.length > 0 ? (
                                                                activity.travelers.map((traveler, travelerIndex) => (
                                                                    <React.Fragment key={traveler.id}>
                                                                        <span className="text-bold tb-teal-text">
                                                                            {traveler.email.split('@')[0]}
                                                                        </span>
                                                                        <button
                                                                            className="btn btn-floating btn-tiny tb-grey lighten-2"
                                                                            type="button"
                                                                            style={{ marginLeft: '4px', marginBottom: '6px', paddingTop: '5px', paddingLeft: '1px'}}
                                                                            onClick={() => handleUserSegmentActivityRemove('activity', index, traveler.id)}
                                                                        >
                                                                            <span className="material-symbols-outlined text-bold" style={{ fontSize: '0.8rem'}}>
                                                                                close
                                                                            </span>
                                                                        </button>
                                                                        {travelerIndex < activity.travelers.length - 1 && ', '}
                                                                    </React.Fragment>
                                                                ))
                                                            ) : (
                                                                <button
                                                                    className="btn btn-small btn-floating tb-teal darken-2"
                                                                    type="button"
                                                                    onClick={() => handleRestoreTravelers('activity', index)}
                                                                >
                                                                    <span className="material-symbols-outlined">
                                                                        group_add
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="row">
                                                        <div className="col s6">
                                                            <Select
                                                                placeholder="Select activity type"
                                                                value={activityOptions?.find(prop => prop.value === activity.type) || ''}
                                                                onChange={handleActivityTypeChange(index)}
                                                                options={activityOptions}
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
                                                                placeholder="Select location"
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
                                                    <div className="row rating-row" style={{ marginLeft: '0px', marginBottom: '0px', marginTop: '40px'}}>
                                                        <RatingSelect
                                                            keyId={`activity-${index}-rating`}
                                                            item="Rating"
                                                            icon="star"
                                                            rating={activity.rating}
                                                            onRatingChange={(rating) => handleActivityRatingChange(rating, index)}
                                                        />
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
                                            onClick={toggleModal}
                                        >
                                            <span className="material-symbols-outlined">
                                                save
                                            </span>
                                            Save Report
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

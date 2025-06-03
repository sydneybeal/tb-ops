import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import CircularPreloader from '../../components/CircularPreloader';
import CondensedSingleLogDisplay from '../AccommodationLogs/CondensedSingleLogDisplay';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const TripEdit = () => {
    const { trip_id } = useParams();
    const { userDetails, logout } = useAuth();
    const [tripData, setTripData] = useState({});
    const [users, setUsers] = useState();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/trips/${trip_id}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                
                setTripData(data);
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
                const sortedUsers = data.filter(user => !excludedEmails.includes(user.email));
                const filteredUsers = sortedUsers.map((user) => ({
                    value: user.id,
                    label: `${user.email?.split('@')[0]}`,
                }));
                setUsers(filteredUsers);
            })
            .catch((err) => console.error(err));
    }, [logout, userDetails.token, trip_id]);

    useEffect(() => {
        // M.initializeTextFields();
        M.updateTextFields();
    }, [tripData]);

    const handleFormSubmit = (e) => {
        // send POST request to update trip
        e.preventDefault();
        const tripDataToSend = {
            ...tripData,
            travel_advisor_id: tripData.travel_advisor_id || null,
        };
        console.log('Trip data to send:', tripDataToSend);

        fetch(`${process.env.REACT_APP_API}/v1/trips`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userDetails.token}`
            },
            body: JSON.stringify(tripDataToSend)
        })
            .then(async (res) => {
                const data = await res.json();
                if (data.detail && data.detail === "Could not validate credentials") {
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                if (!res.ok) {
                    M.toast({
                        html: data.detail || 'An error occurred while updating the trip.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    return;
                }
                M.toast({
                    html: 'Trip updated successfully.',
                    displayLength: 4000,
                    classes: 'success-green',
                });
                // setTripData(data);
            })
            .catch((err) => {
                M.toast({
                    html: 'An error occurred while updating the trip.',
                    displayLength: 4000,
                    classes: 'error-red',
                });
                console.error(err);
            });
    }

    const handleTripChange = (field, value) => {
        let newValue = value;
        const decimalFields = ['sell_price', 'cost_from_suppliers'];
  
        if (decimalFields.includes(field)) {
            // If the value ends with a dot or is empty, keep it as a string so the user can continue typing
            if (value === '' || value.endsWith('.')) {
              newValue = value;
            } else {
              // Otherwise, attempt to convert to a float
              newValue = parseFloat(value);
              if (isNaN(newValue)) {
                newValue = null;
              }
            }
          }
    
        const updatedTripData = {
            ...tripData,
            [field]: newValue,
          };
        
        setTripData(updatedTripData);
    }

    const dateField = (field, label, icon) => {
        return (
            <>
            <div>
                <ReactDatePicker
                    id="inquiry_date"
                    selected={tripData[field] ? moment(tripData[field]).toDate() : null}
                    onChange={(date) => {
                        const newValue = date && moment(date).isValid() ? moment(date).format('YYYY-MM-DD') : null;
                        handleTripChange(field, newValue);
                    }}
                    isClearable
                    placeholderText={label}
                    className="date-input-modal"
                    dateFormat="MM/dd/yyyy"
                    minDate={new Date('2017-01-01')}
                    maxDate={new Date('2100-12-31')}
                    autoComplete="off"
                />
            </div>
            <label htmlFor="form-date-in" className="center">
                <span className="material-symbols-outlined">
                    {icon}
                </span>
                {label}
            </label>
            </>
        )
    }
    console.log('Trip Data:', tripData);
    console.log('Trip Name:', tripData?.trip_name);

    return (
        <>
            <header>
                <Navbar title="Trip Details" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center accommodation-logs" style={{ width: '90%', paddingTop: '20px', paddingBottom: '100px' }}>
                    {loaded && tripData ? (
                        <>
                            <div className="row">
                                <h5 className="text-bold" style={{ marginBottom: '10px' }}>
                                    {tripData.trip_name || "Unnamed Trip"}
                                </h5>
                                <div className="chip warning-yellow-light">EDITING</div>
                            </div>

                            <form id="tripForm" className="container" style={{width: '80%'}} onSubmit={handleFormSubmit}>
                                <div className="card potential-trip-card">
                                <div className="card-content">
                                <div className="row">
                                    <div className="input-field col s12 l8">
                                        <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                            airplane_ticket
                                        </span>
                                        <input
                                            type="text"
                                            id="search-query"
                                            placeholder="Trip name"
                                            value={tripData.trip_name || ''}
                                            onChange={(e) => handleTripChange("trip_name", e.target.value)}
                                            className={`${tripData.trip_name === "" ? 'invalid' : ''} name-input`}
                                        />
                                        <span
                                            className="grey-text text-darken-1"
                                        >
                                            Trip Name
                                        </span>
                                    </div>
                                    <div className="col s12 l4">
                                        <Select
                                            placeholder="Select Travel Associate"
                                            inputId="ta_select"
                                            value={users?.find(cons => cons.value === tripData['travel_advisor_id']) || ''}
                                            onChange={(selectedOption) => handleTripChange(
                                                "travel_advisor_id",
                                                selectedOption ? selectedOption.value : ''
                                            )}
                                            options={users}
                                            isClearable
                                            style={{ flexGrow: '1' }}
                                            classNamePrefix="select" // Use this for prefixing generated class names
                                            className=''
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderColor: provided.borderColor,
                                                    '&:hover': {
                                                        borderColor: provided['&:hover'].borderColor,
                                                    },
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
                                        <label htmlFor="ta_select">
                                            <span className="material-symbols-outlined">
                                                badge
                                            </span>
                                            Travel Associate
                                        </label>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col s4">
                                        {dateField('inquiry_date', 'Inquiry Date', 'contact_support')}
                                    </div>
                                    <div className="col s4">
                                        {dateField('deposit_date', 'Deposit Date', 'person_check')}
                                    </div>
                                    <div className="col s4">
                                        {dateField('final_payment_date', 'Final Payment Date', 'payments')}
                                    </div>
                                </div>
                                <div className="row" style={{margin: '50px 0'}}>
                                    <div className="col s4 offset-s2">

                                        <div className="input-field">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">payments</span>
                                            <input
                                                type="text"
                                                id="sellPrice"
                                                value={tripData.sell_price || ''}
                                                onChange={(e) => handleTripChange("sell_price", e.target.value)}
                                                // placeholder=""
                                                autoComplete="off"
                                            />
                                            <label
                                                style={{ fontSize: '1.3rem' }}
                                                htmlFor="sellPrice"
                                                className="grey-text text-darken-3"
                                            >
                                                Sell Price ($USD)
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="input-field">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">payments</span>
                                            <input
                                                type="text"
                                                id="costFromSuppliers"
                                                value={tripData.cost_from_suppliers || ''}
                                                onChange={(e) => handleTripChange("cost_from_suppliers", e.target.value)}
                                                // placeholder=""
                                                autoComplete="off"
                                            />
                                            <label
                                                style={{ fontSize: '1.3rem' }}
                                                htmlFor="costFromSuppliers"
                                                className="grey-text text-darken-3"
                                            >
                                                Cost from Suppliers ($USD)
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="row" style={{ display: 'flex', alignItems: 'stretch' }}>
                                    <div className="col s4">
                                        <div className="input-field">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                forum
                                            </span>
                                            <input
                                                type="text"
                                                id="leadSource"
                                                // placeholder="Lead source"
                                                value={tripData.lead_source || ''}
                                                onChange={(e) => handleTripChange("lead_source", e.target.value)}
                                                // className={`${tripData.trip_name === "" ? 'invalid' : ''} name-input`}
                                            />
                                                <label
                                                    style={{ fontSize: '1.3rem' }}
                                                    htmlFor="leadSource"
                                                    className="grey-text text-darken-3"
                                                >
                                                Lead Source
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col s4">
                                        <div className="input-field">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                airplane_ticket
                                            </span>
                                            <input
                                                type="text"
                                                id="flightsHandled"
                                                // placeholder="Flights Handled By"
                                                value={tripData.flights_handled_by || ''}
                                                onChange={(e) => handleTripChange("flights_handled_by", e.target.value)}
                                                className={`${tripData.trip_name === "" ? 'invalid' : ''} name-input`}
                                            />
                                            <label
                                                    style={{ fontSize: '1.3rem' }}
                                                    htmlFor="flightsHandled"
                                                    className="grey-text text-darken-3"
                                                >
                                                Flights Handled By
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col s4" style={{ paddingTop: '20px'}}>
                                        <>
                                            <div className="switch property-switch">
                                                <label>
                                                    No
                                                    <input
                                                        type="checkbox"
                                                        checked={tripData.full_coverage_policy || ''}
                                                        onChange={(e) => handleTripChange("full_coverage_policy", e.target.checked)}
                                                    />
                                                    <span className="lever"></span>
                                                    Yes
                                                </label>
                                            </div>
                                            <br />
                                            <div className="grey-text text-darken-1" style={{ marginBottom: '10px' }}>
                                                <span className="material-symbols-outlined">
                                                    health_and_safety
                                                </span>
                                                Full Coverage Policy
                                            </div>
                                        </>
                                    </div>
                                </div>
                                <div className="row" style={{marginTop: '30px'}}>
                                    <div className="input-field col s10 offset-s1">
                                        <textarea
                                            name="notes"
                                            id="notes"
                                            value={tripData.notes || ''}
                                            placeholder={tripData.notes}
                                            onChange={(e) => handleTripChange("notes", e.target.value)}
                                            // style={{paddingLeft: '10px'}}
                                            className="materialize-textarea input-placeholder-dark comments"
                                        />
                                        <label htmlFor="notes" className="text-bold">Consultant Notes</label>
                                    </div>
                                </div>
                                <div className="row">
                                    <button type="submit" form="tripForm" className="btn waves-effect waves-light success-green">Save</button>
                                </div>
                                </div>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default TripEdit;
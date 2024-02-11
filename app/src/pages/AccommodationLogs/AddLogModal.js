import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import M from 'materialize-css';
import moment from 'moment';

const AddLogModal = ({ isOpen, onClose }) => {
    const [accommodationLogs, setAccommodationLogs] = useState([{}]);
    const [primaryTraveler, setPrimaryTraveler] = useState('');
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [properties, setProperties] = useState([]);
    const [countries, setCountries] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [bookingChannels, setBookingChannels] = useState([]);
    const [agencies, setAgencies] = useState([]);

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose();
            },
        };
        if (!isOpen) return;

        var elems = document.querySelectorAll('.modal');
        M.Modal.init(elems, options);

        if (isOpen) {
            let instance = M.Modal.getInstance(document.getElementById('add-log-modal'));
            instance.open();
        }
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

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Ensure each log includes the primary traveler's name and the selected consultant when submitting
        const logsToSubmit = accommodationLogs.map(log => ({
            ...log,
            primary_traveler: primaryTraveler,
            consultant_id: selectedConsultantId, // Apply the selected consultant's ID to each log
        }));
        // Submit logsToSubmit to your backend
        console.log(logsToSubmit);
        // Add submission logic here
        // Here, implement the logic to submit the form data
        // Convert accommodationLogs to the expected payload format
        // POST the payload to `${process.env.REACT_APP_API}/v1/accommodation_logs`
    };

    // Function to handle changes to the consultant selection
    const handleConsultantChange = selectedOption => {
        setSelectedConsultantId(selectedOption ? selectedOption.value : '');
    };

    const handleLogChange = (index, field, value) => {
        const updatedLogs = [...accommodationLogs];
        if (!updatedLogs[index]) updatedLogs[index] = {};
        updatedLogs[index][field] = value;
        const log = updatedLogs[index];

        // Check if dates and num_pax are provided to calculate bed nights
        // If a date is cleared, set bed nights to 0 explicitly
        if (field === 'date_in' || field === 'date_out') {
            // Clear bed nights if one of the dates is cleared
            if (!log.date_in || !log.date_out) {
                updatedLogs[index].bed_nights = 0;
            }
        }

        if (log.date_in && log.date_out && log.num_pax) {
            const startDate = moment(log.date_in);
            const endDate = moment(log.date_out);
            const numPax = parseInt(log.num_pax, 10) || 1;

            const diffDays = endDate.diff(startDate, 'days');
            const bedNights = !isNaN(diffDays) && diffDays >= 0 ? diffDays * numPax : 0; // Ensure diffDays is non-negative

            updatedLogs[index].bed_nights = bedNights;
        } else if (field === 'num_pax' && !log.date_in || !log.date_out) {
            // If num_pax is updated but one of the dates is missing, ensure bed nights is recalculated or set to 0
            updatedLogs[index].bed_nights = 0;
        }

        setAccommodationLogs(updatedLogs);
    };


    const handleRemoveClick = (index) => {
        const updatedLogs = [...accommodationLogs];
        updatedLogs.splice(index, 1);
        setAccommodationLogs(updatedLogs);
    };


    return (
        <div id="add-log-modal" className="modal add-log-modal">
            <div className="modal-content">
                <h4>New Accommodation Log</h4>
                <div style={{ textAlign: 'left', marginTop: '50px' }}>
                    <form onSubmit={handleFormSubmit}>
                        {/* Trip Information Section */}
                        {/* <div className="teal-text text-lighten-3">Trip Details</div> */}
                        <div className="row">
                            {/* Primary Traveler Name Field */}
                            <div className="col s6">
                                <input
                                    type="text"
                                    value={primaryTraveler}
                                    onChange={(e) => setPrimaryTraveler(e.target.value)}
                                    placeholder="Name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                />
                                <label htmlFor="primary_traveler">
                                    <span class="material-symbols-outlined">
                                        hiking
                                    </span>
                                    Primary Traveler Name (Last/First)

                                </label>
                                {/* <span className="helper-text" data-error="wrong" data-success="right">Enter the full name of the primary traveler</span> */}
                            </div>


                            {/* Consultant Name Selection */}
                            <div className="col s6">
                                <Select
                                    placeholder="Select Consultant"
                                    value={consultants.find(cons => cons.value === selectedConsultantId)}
                                    onChange={handleConsultantChange}
                                    options={consultants}
                                    isClearable
                                    style={{ flexGrow: '1' }}
                                />
                                <label htmlFor="consultant_name">
                                    <span class="material-symbols-outlined">
                                        badge
                                    </span>
                                    Consultant Name
                                </label>
                            </div>
                        </div>

                        {accommodationLogs.map((log, index) => (
                            <div key={index} style={{ marginTop: '60px' }}>
                                <div className="row">
                                    <div className="col s11">
                                        <div className="chip teal accent-4 text-bold">{index + 1}</div>

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
                                                <span class="material-symbols-outlined">
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
                                                <span class="material-symbols-outlined">
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
                                                <span class="material-symbols-outlined">
                                                    explore
                                                </span>
                                            </div>
                                        }
                                        {(!log.property_id && !(log.new_property_name && log.new_property_country_id && log.new_property_portfolio_name)) && (
                                            <div>
                                                <em className="grey-text text-lighten-1">
                                                    Please select an&nbsp;
                                                    <a
                                                        className="text-bold new-existing-prop teal-text text-lighten-2"
                                                        onClick={() => {
                                                            handleLogChange(index, 'is_new_property', false);
                                                            handleLogChange(index, 'new_property_country_id', '');
                                                            handleLogChange(index, 'new_property_core_destination_name', '');
                                                            handleLogChange(index, 'new_property_name', '');
                                                            handleLogChange(index, 'new_property_portfolio_name', '');
                                                            handleLogChange(index, 'new_property_country_name', '');
                                                        }}
                                                    >
                                                        <span class="material-symbols-outlined">
                                                            manage_search
                                                        </span>
                                                        Existing Property
                                                    </a>
                                                    &nbsp;or&nbsp;

                                                    <a
                                                        className="text-bold new-existing-prop green-text text-lighten-2"
                                                        onClick={() => handleLogChange(index, 'is_new_property', true)}>
                                                        <span class="material-symbols-outlined">
                                                            add_circle
                                                        </span>
                                                        New Property
                                                    </a>
                                                </em>
                                            </div>
                                        )
                                        }
                                    </div>
                                    <div className="col s1" style={{ textAlign: 'right' }}>
                                        <a
                                            className="btn-floating btn-small waves-effect waves-light red lighten-2"
                                            onClick={() => handleRemoveClick(index)}>
                                            <i className="material-icons">remove</i>
                                        </a>
                                    </div>
                                </div>

                                {/* Property Name Autocomplete */}
                                <div className="row">
                                    {!log.is_new_property ? (
                                        <div className="col s10">
                                            <Select
                                                placeholder="Search for a property"
                                                value={properties.find(prop => prop.value === log.property_id)}
                                                onChange={(selectedOption) => {
                                                    // Call handleLogChange for property_id
                                                    handleLogChange(index, 'property_id', selectedOption ? selectedOption.value : '');
                                                    // Call handleLogChange for property_name
                                                    handleLogChange(index, 'property_name', selectedOption ? selectedOption.label : '');
                                                    // Call handleLogChange for portfolio_name
                                                    console.log(selectedOption);
                                                    handleLogChange(index, 'portfolio_name', selectedOption ? selectedOption.portfolio : '');
                                                    handleLogChange(index, 'country_name', selectedOption ? selectedOption.country_name : '');
                                                    handleLogChange(index, 'core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                                }}
                                                options={properties}
                                                isClearable
                                            />
                                            <label htmlFor="primary_traveler">
                                                <span class="material-symbols-outlined">
                                                    hotel
                                                </span>
                                                Property Name
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="col s10">
                                            <div className="card new-property-card cyan lighten-5">
                                                <div className="card-content">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <em className="grey-text">
                                                            Creating a new property...&nbsp;
                                                        </em>
                                                        <a
                                                            className="text-bold new-existing-prop red-text text-lighten-3"
                                                            // style={{ textAlign: 'right' }}
                                                            onClick={() => {
                                                                handleLogChange(index, 'is_new_property', false);
                                                                handleLogChange(index, 'new_property_country_id', '');
                                                                handleLogChange(index, 'new_property_core_destination_name', '');
                                                                handleLogChange(index, 'new_property_name', '');
                                                                handleLogChange(index, 'new_property_portfolio_name', '');
                                                                handleLogChange(index, 'new_property_country_name', '');
                                                            }}
                                                        >
                                                            Cancel
                                                            <span class="material-symbols-outlined">
                                                                close
                                                            </span>
                                                        </a>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col s6">
                                                            <input
                                                                type="text"
                                                                value={log.new_property_name || ''}
                                                                onChange={(e) => handleLogChange(index, 'new_property_name', e.target.value)}
                                                                placeholder="Property Name"
                                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                                            />
                                                            <label htmlFor="primary_traveler">
                                                                <span class="material-symbols-outlined">
                                                                    hotel
                                                                </span>
                                                                Property Name
                                                            </label>
                                                        </div>
                                                        <div className="col s6">
                                                            <input
                                                                type="text"
                                                                value={log.new_property_portfolio_name || ''}
                                                                onChange={(e) => handleLogChange(index, 'new_property_portfolio_name', e.target.value)}
                                                                placeholder="Portfolio Name"
                                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                                            />
                                                            <label htmlFor="primary_traveler">
                                                                <span class="material-symbols-outlined">
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
                                                                value={countries.find(prop => prop.value === log.new_property_country_id)}
                                                                onChange={(selectedOption) => {
                                                                    // Call handleLogChange for property_id
                                                                    handleLogChange(index, 'new_property_country_id', selectedOption ? selectedOption.value : '');
                                                                    // Call handleLogChange for property_name
                                                                    handleLogChange(index, 'new_property_core_destination_name', selectedOption ? selectedOption.core_destination_name : '');
                                                                    // Call handleLogChange for portfolio_name
                                                                    console.log(selectedOption);
                                                                    handleLogChange(index, 'new_property_country_name', selectedOption ? selectedOption.label : '');
                                                                }}
                                                                options={countries}
                                                                isClearable
                                                                style={{ flexGrow: '1' }}
                                                            />
                                                            <label htmlFor="consultant_name">
                                                                <span class="material-symbols-outlined">
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
                                                                    <span class="material-symbols-outlined">
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
                                    <div className="col s2" style={{ textAlign: 'center' }}>
                                        {/* Number of Pax Numeric Selection */}
                                        < input
                                            type="number"
                                            value={log.num_pax || ''}
                                            onChange={(e) => handleLogChange(index, 'num_pax', parseInt(e.target.value))}
                                            placeholder="#"
                                            min="1"
                                            style={{ marginBottom: '10px', textAlign: 'center' }}
                                        />
                                        <label htmlFor="primary_traveler">
                                            <span class="material-symbols-outlined">
                                                airplane_ticket
                                            </span>
                                            Pax
                                        </label>
                                    </div>
                                </div>

                                <div className="row">
                                    {/* Primary Traveler Name Field */}
                                    <div className="col s6">

                                        {/* Date In Selector */}
                                        <input
                                            type="date"
                                            value={log.date_in || ''} // Ensure this is a string in 'YYYY-MM-DD' format; use '' as fallback
                                            onChange={(e) => handleLogChange(index, 'date_in', e.target.value)} // Correctly extract value from event
                                            placeholder="Select date in"
                                            className="date-input"
                                        />
                                        <label htmlFor="date_in">
                                            <span class="material-symbols-outlined">
                                                flight_land
                                            </span>
                                            Check-In Date
                                        </label>
                                        <button
                                            className="btn btn-small grey lighten-1"
                                            onClick={() => handleLogChange(index, 'date_in', '')}
                                            style={{ marginLeft: '5px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div className="col s6">

                                        {/* Date Out Selector */}
                                        <input
                                            type="date"
                                            value={log.date_out || ''} // Ensure this is a string in 'YYYY-MM-DD' format; use '' as fallback
                                            onChange={(e) => handleLogChange(index, 'date_out', e.target.value)} // Correctly extract value from event
                                            placeholder="Select date out"
                                            className="date-input"
                                        />
                                        <label htmlFor="date_out">
                                            <span class="material-symbols-outlined">
                                                flight_takeoff
                                            </span>
                                            Check-Out Date
                                        </label>
                                        <button
                                            className="btn btn-small grey lighten-1"
                                            onClick={() => handleLogChange(index, 'date_out', '')}
                                            style={{ marginLeft: '5px' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col s6">
                                        {(!log.agency_id && !(log.new_agency_name)) && (
                                            <div>
                                                <em className="grey-text text-lighten-1">
                                                    Select an&nbsp;
                                                    <a
                                                        className="text-bold new-existing-prop teal-text text-lighten-2"
                                                        onClick={() => {
                                                            handleLogChange(index, 'is_new_agency', false);
                                                            handleLogChange(index, 'new_agency_name', '');
                                                        }}
                                                    >
                                                        <span class="material-symbols-outlined">
                                                            manage_search
                                                        </span>
                                                        Existing Agency
                                                    </a>
                                                    &nbsp;or&nbsp;

                                                    <a
                                                        className="text-bold new-existing-prop green-text text-lighten-2"
                                                        onClick={() => handleLogChange(index, 'is_new_agency', true)}>
                                                        <span class="material-symbols-outlined">
                                                            add_circle
                                                        </span>
                                                        New Agency
                                                    </a>
                                                </em>
                                            </div>
                                        )
                                        }
                                        {!log.is_new_agency ? (
                                            <Select
                                                placeholder="Search for an agency"
                                                value={agencies.find(prop => prop.value === log.new_property_country_id)}
                                                onChange={(selectedOption) => {
                                                    handleLogChange(index, 'agency_id', selectedOption ? selectedOption.value : '');
                                                }}
                                                options={agencies}
                                                isClearable
                                                style={{ flexGrow: '1' }}
                                            />

                                        ) : (
                                            <input
                                                type="text"
                                                value={log.new_agency_name || ''}
                                                onChange={(e) => handleLogChange(index, 'new_agency_name', e.target.value)}
                                                placeholder="Agency Name"
                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                            />
                                        )}
                                        <label htmlFor="consultant_name">
                                            <span class="material-symbols-outlined">
                                                contact_mail
                                            </span>
                                            Agency Name
                                        </label>
                                    </div>
                                    <div className="col s6">
                                        {(!log.booking_channel_id && !(log.new_booking_channel_name)) && (
                                            <div>
                                                <em className="grey-text text-lighten-1">
                                                    Select an&nbsp;
                                                    <a
                                                        className="text-bold new-existing-prop teal-text text-lighten-2"
                                                        onClick={() => {
                                                            handleLogChange(index, 'is_new_booking_channel', false);
                                                            handleLogChange(index, 'new_booking_channel_name', '');
                                                        }}
                                                    >
                                                        <span class="material-symbols-outlined">
                                                            manage_search
                                                        </span>
                                                        Existing Channel
                                                    </a>
                                                    &nbsp;or&nbsp;

                                                    <a
                                                        className="text-bold new-existing-prop green-text text-lighten-2"
                                                        onClick={() => handleLogChange(index, 'is_new_booking_channel', true)}>
                                                        <span class="material-symbols-outlined">
                                                            add_circle
                                                        </span>
                                                        New Channel
                                                    </a>
                                                </em>
                                            </div>
                                        )
                                        }
                                        {!log.is_new_booking_channel ? (
                                            <Select
                                                placeholder="Search for a booking channel"
                                                value={agencies.find(prop => prop.value === log.agency)}
                                                onChange={(selectedOption) => {
                                                    handleLogChange(index, 'booking_channel_id', selectedOption ? selectedOption.value : '');
                                                }}
                                                options={agencies}
                                                isClearable
                                                style={{ flexGrow: '1' }}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={log.new_booking_channel_name || ''}
                                                onChange={(e) => handleLogChange(index, 'new_booking_channel_name', e.target.value)}
                                                placeholder="Booking Channel Name"
                                                style={{ marginRight: '10px', flexGrow: '1' }}
                                            />
                                        )}
                                        <label htmlFor="consultant_name">
                                            <span class="material-symbols-outlined">
                                                alt_route
                                            </span>
                                            Booking Channel
                                        </label>
                                    </div>

                                </div>


                            </div>
                        ))}
                        <button type="button" className="btn" onClick={addLogEntry}>Add More</button>
                    </form>
                </div>
                {
                    accommodationLogs.length >= 1 &&
                    accommodationLogs.some(log => log.bed_nights && log.property_name) && (
                        <div className="summary-row" style={{ textAlign: 'left', marginTop: '40px' }}>
                            <h5>Totals</h5>
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
                                <span class="material-symbols-outlined">
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
                                <span class="material-symbols-outlined">
                                    flight_takeoff
                                </span>
                            </div>
                            <div><span className="text-bold">Properties: </span>{
                                accommodationLogs.map((log, index) => log.property_name || 'Unnamed Property').join(', ')
                            }</div>
                        </div>
                    )}
            </div >
            <div className="modal-footer">
                <a href="#!" className="modal-close waves-effect waves-green btn-flat" onClick={onClose}>Close</a>
                <button type="submit" className="waves-effect waves-green btn-flat">Save</button>
            </div>
        </div >
    );
};

export default AddLogModal;

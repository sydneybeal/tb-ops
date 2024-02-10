import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import M from 'materialize-css';

const AddLogModal = ({ isOpen, onClose }) => {
    const [accommodationLogs, setAccommodationLogs] = useState([{}]);
    const [primaryTraveler, setPrimaryTraveler] = useState('');
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [properties, setProperties] = useState([]);
    const [countries, setCountries] = useState([]);
    const [consultants, setConsultants] = useState([]);

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

        // // Fetch countries
        // fetch(`${process.env.REACT_APP_API}/v1/countries`)
        //     .then((res) => res.json())
        //     .then((data) => {
        //         const formattedCountries = data.map((country) => ({
        //             value: country.id,
        //             label: country.name
        //         }));
        //         setCountries(formattedCountries);
        //     })
        //     .catch((err) => console.error(err));

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
                <div style={{ textAlign: 'left' }}>
                    <form onSubmit={handleFormSubmit}>
                        {/* Trip Information Section */}
                        <div className="chip teal lighten-3">TRIP</div>
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
                                <label htmlFor="primary_traveler">Primary Traveler Name</label>
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
                                <label htmlFor="primary_traveler">Consultant Name</label>
                            </div>
                        </div>

                        {accommodationLogs.map((log, index) => (
                            <div key={index} style={{ marginTop: '60px' }}>
                                <div className="row">
                                    <div className="col s11">
                                        <div className="chip teal accent-4 text-bold">{index + 1}</div>
                                        {!log.property_id && (
                                            <em className="grey-text text-lighten-1">Please select a property</em>
                                        )
                                        }
                                        {log.country_name &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Portfolio:&nbsp;
                                                </span>
                                                {log.portfolio_name}
                                            </div>
                                        }
                                        {log.country_name &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Country:&nbsp;
                                                </span>
                                                {log.country_name}
                                            </div>
                                        }
                                        {log.core_destination_name &&
                                            <div className="chip">
                                                <span className="text-bold">
                                                    Core Destination:&nbsp;
                                                </span>
                                                {log.core_destination_name}
                                            </div>
                                        }
                                    </div>
                                    <div className="col s1" style={{ textAlign: 'right' }}>
                                        <a
                                            className="btn-floating btn-small waves-effect waves-light red"
                                            onClick={() => handleRemoveClick(index)}>
                                            <i className="material-icons">remove</i>
                                        </a>
                                    </div>
                                </div>

                                {/* Property Name Autocomplete */}
                                <div className="row">
                                    <div className="col s11">
                                        <Select
                                            placeholder="Select Property"
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
                                        <label htmlFor="primary_traveler">Property Name</label>
                                    </div>
                                    <div className="col s1" style={{ textAlign: 'center' }}>
                                        {/* Number of Pax Numeric Selection */}
                                        < input
                                            type="number"
                                            value={log.num_pax || ''}
                                            onChange={(e) => handleLogChange(index, 'num_pax', parseInt(e.target.value))}
                                            placeholder="#"
                                            min="1"
                                            style={{ marginBottom: '10px', textAlign: 'center' }}
                                        />
                                        <label htmlFor="primary_traveler"># Pax</label>
                                    </div>
                                </div>


                                <div className="row">
                                    {/* Primary Traveler Name Field */}
                                    <div className="col s6">

                                        {/* Date In Selector */}
                                        <input
                                            type="date"
                                            selected={log.date_in}
                                            onChange={(date) => handleLogChange(index, 'date_in', date)}
                                            // dateFormat="MMMM d, yyyy"
                                            placeholder="Select date in"
                                            className="date-input"
                                        />
                                        <label htmlFor="primary_traveler">Check-In Date</label>
                                    </div>
                                    <div className="col s6">

                                        {/* Date Out Selector */}
                                        <input
                                            type="date"
                                            selected={log.date_out}
                                            onChange={(date) => handleLogChange(index, 'date_out', date)}
                                            // dateFormat="MMMM d, yyyy"
                                            placeholder="Select date out"
                                            className="date-input"
                                        />
                                        <label htmlFor="primary_traveler">Check-Out Date</label>
                                    </div>
                                </div>


                            </div>
                        ))}
                        <button type="button" className="btn" onClick={addLogEntry}>Add More</button>
                    </form>
                </div>
            </div >
            <div className="modal-footer">
                <a href="#!" className="modal-close waves-effect waves-green btn-flat" onClick={onClose}>Close</a>
                <button type="submit" className="waves-effect waves-green btn-flat">Save</button>
            </div>
        </div >
    );
};

export default AddLogModal;

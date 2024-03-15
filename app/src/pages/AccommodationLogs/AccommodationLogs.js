import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../components/AuthContext';
import CircularPreloader from '../../components/CircularPreloader';
import AddLogModal from './AddLogModal';
import BedNightTable from './BedNightTable';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const Overview = () => {
    const [apiData, setApiData] = useState([]);
    const [refreshData, setRefreshData] = useState(false);
    const { userDetails, logout } = useAuth();
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditLog, setCurrentEditLog] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        core_dest: [],
        country: [],
        consultant: [],
        property: [],
        start_date: '',
        end_date: '',
    });
    const [filters, setFilters] = useState({
        core_dest: '',
        country: '',
        consultant: '',
        property: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`, {
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
                        classes: 'red lighten-2',
                    });
                    logout();
                    return;
                }
                if (!Array.isArray(data)) {
                    console.error("Expected an array but got:", data);
                    data = []; // Set data to an empty array if it's not an array
                }

                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [refreshData, logout, userDetails.token]);

    const openEditModal = (logData) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditLog(logData); // Set the data for the log to be edited
            setIsEditMode(true);       // Indicate that we're in edit mode
            setIsModalOpen(true);      // Open the modal
        }
    };

    useEffect(() => {
        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems);
        return () => {
            instances.forEach(instance => instance.destroy());
        };
    }, [filters, filterOptions]);

    useEffect(() => {
        // const coreDestOptions = [...new Set(apiData.map((item) => item.core_destination_name))].sort();
        const coreDestMap = apiData.reduce((acc, item) => {
            if (!acc[item.core_destination_id]) {
                acc[item.core_destination_id] = {
                    value: item.core_destination_id || '',
                    label: item.core_destination_name || ''
                };
            }
            return acc;
        }, {});
        // const countryOptions = [...new Set(apiData.map((item) => item.country_name))].sort();
        const countryMap = apiData.reduce((acc, item) => {
            // Define default values for null or undefined country_id and country_name
            const countryId = item.country_id || 'no-country'; // Use a placeholder value for missing country_id
            const countryName = item.country_name || 'No country'; // A readable placeholder for missing country_name

            if (!acc[countryId]) {
                acc[countryId] = {
                    value: countryId,
                    label: countryName
                };
            }
            return acc;
        }, {});
        const propertyMap = apiData.reduce((acc, item) => {
            if (!acc[item.property_id]) {
                acc[item.property_id] = {
                    value: item.property_id || '',
                    label: item.property_name || ''
                };
            }
            return acc;
        }, {});
        const coreDestOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));
        const uniqueConsultants = apiData.reduce((acc, item) => {
            if (!acc[item.consultant_id]) {
                acc[item.consultant_id] = {
                    consultant_id: item.consultant_id,
                    consultant_display_name: item.consultant_display_name,
                    consultant_is_active: item.consultant_is_active
                };
            }
            return acc;
        }, {});
        const distinctConsultants = Object.values(uniqueConsultants);
        const consultantOptions = distinctConsultants
            .map(item => ({
                value: item.consultant_id || '',
                label: item.consultant_display_name || '',
                consultant_is_active: item.consultant_is_active
            }))
            .sort((a, b) => {
                // Sort by is_active, true before false
                if (a.consultant_is_active && !b.consultant_is_active) return -1;
                if (!a.consultant_is_active && b.consultant_is_active) return 1;

                // Then sort alphabetically by label
                return a.label.localeCompare(b.label);
            })
            .map(item => ({
                value: item.value,
                label: `${item.label} ${item.consultant_is_active ? '' : '(inactive)'}`, // Append (inactive) if not active
                apiLabel: item.label
            }));

        setFilterOptions({
            core_dest: coreDestOptions,
            country: countryOptions,
            consultant: consultantOptions,
            property: propertyOptions,
        });
    }, [apiData,]);

    useEffect(() => {
        M.AutoInit();
    }, []);

    useEffect(() => {
        let newFilteredData = apiData;

        if (searchQuery) {
            newFilteredData = newFilteredData.filter((item) =>
                (item.primary_traveler ? item.primary_traveler.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.property_name ? item.property_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.consultant_display_name ? item.consultant_display_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.agency_name ? item.agency_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.booking_channel_name ? item.booking_channel_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.country_name ? item.country_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.core_destination_name ? item.core_destination_name.toLowerCase() : '').includes(searchQuery.toLowerCase()),
            );
        }

        if (filters.core_dest) {
            newFilteredData = newFilteredData.filter((item) => item.core_destination_name === filters.core_dest);
        }

        if (filters.country) {
            if (filters.country === 'No country') {
                // Filter for records where country_name is null or undefined
                newFilteredData = newFilteredData.filter(item => !item.country_name);
            } else {
                // Filter for records matching the selected country name
                newFilteredData = newFilteredData.filter(item => item.country_name === filters.country);
            }
        }

        if (filters.consultant) {
            newFilteredData = newFilteredData.filter((item) => item.consultant_display_name === filters.consultant);
        }

        if (filters.property) {
            newFilteredData = newFilteredData.filter((item) => item.property_name === filters.property);
        }

        // Filter by date range
        if (filters.start_date || filters.end_date) {
            const startDate = filters.start_date ? new Date(filters.start_date) : new Date('1900-01-01'); // A default early date if start_date is not set
            const endDate = filters.end_date ? new Date(filters.end_date) : new Date('2100-12-31'); // A default late date if end_date is not set

            newFilteredData = newFilteredData.filter((item) => {
                const itemDateIn = new Date(item.date_in);
                const itemDateOut = new Date(item.date_out);
                // Adjust logic to handle cases where only one of the dates is provided
                return (!filters.start_date || itemDateIn >= startDate) && (!filters.end_date || itemDateOut <= endDate);
            });
        }

        setFilteredData(newFilteredData);

        // Update filter options based on newFilteredData
        const coreDestOptions = [...new Set(newFilteredData.map(item => item.core_destination_name))].sort().map(name => ({ value: name, label: name }));
        const countryOptions = [...new Set(newFilteredData.map(item => item.country_name))].sort().map(name => ({ value: name, label: name }));
        const uniqueConsultants = apiData.reduce((acc, item) => {
            if (!acc[item.consultant_id]) {
                acc[item.consultant_id] = {
                    consultant_id: item.consultant_id,
                    consultant_display_name: item.consultant_display_name,
                    consultant_is_active: item.consultant_is_active
                };
            }
            return acc;
        }, {});
        const distinctConsultants = Object.values(uniqueConsultants);
        const consultantOptions = distinctConsultants
            .map(item => ({
                value: item.consultant_id || '',
                label: item.consultant_display_name || '',
                consultant_is_active: item.consultant_is_active
            }))
            .sort((a, b) => {
                // Sort by is_active, true before false
                if (a.consultant_is_active && !b.consultant_is_active) return -1;
                if (!a.consultant_is_active && b.consultant_is_active) return 1;

                // Then sort alphabetically by label
                return a.label.localeCompare(b.label);
            })
            .map(item => ({
                value: item.value,
                label: `${item.label} ${item.consultant_is_active ? '' : '(inactive)'}`, // Append (inactive) if not active
                apiLabel: item.label
            }));
        const propertyOptions = [...new Set(newFilteredData.map(item => item.property_name))].sort().map(name => ({ value: name, label: name }));

        setFilterOptions({
            core_dest: coreDestOptions,
            country: countryOptions,
            consultant: consultantOptions,
            property: propertyOptions,
        });

    }, [apiData, filters, searchQuery]);

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please enter your name above before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        }
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentEditLog(null);
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };


    return (
        <>
            <header>
                <Navbar title="Service Providers" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
                    <AddLogModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        onRefresh={triggerRefresh}
                        editLogData={currentEditLog}
                        isEditMode={isEditMode}
                    />


                    {loaded ? (
                        <>

                            <div className="row center">
                                <div className="col s12 m2 offset-m10">
                                    <button className="btn-float btn-large waves-effect waves-light tb-teal darken-4" onClick={openModal}>
                                        <span className="material-symbols-outlined">
                                            add
                                        </span>
                                        Add New
                                    </button>
                                </div>
                            </div>
                            <div className="row center">
                                <div>
                                    <div className="col s12 l4">
                                        <Select
                                            placeholder="Search by Core Destination"
                                            value={filterOptions.core_dest.find(core_dest => core_dest.label === filters.core_dest) ? { value: filters.core_dest, label: filters.core_dest } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, core_dest: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.core_dest}
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    '&:hover': {
                                                        borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    },
                                                    boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none',
                                                }),
                                                option: (provided, state) => ({
                                                    ...provided,
                                                    fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                                    backgroundColor: state.isSelected
                                                        ? '#0e9bac'
                                                        : state.isFocused
                                                            ? '#e8e5e1'
                                                            : '#ffffff',
                                                    ':active': {
                                                        backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac',
                                                    },
                                                }),
                                                menuPortal: base => ({ ...base, zIndex: 9999 })
                                            }}
                                            menuPortalTarget={document.body}
                                            isClearable
                                        />
                                        <span className="material-symbols-outlined grey-text text-darken-1">
                                            explore
                                        </span>
                                    </div>
                                    <div className="col s12 l4">
                                        <Select
                                            placeholder="Search by Country"
                                            value={filterOptions.country.find(country => country.label === filters.country) ? { value: filters.country, label: filters.country } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, country: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.country}
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    '&:hover': {
                                                        borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    },
                                                    boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none',
                                                }),
                                                option: (provided, state) => ({
                                                    ...provided,
                                                    fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                                    backgroundColor: state.isSelected
                                                        ? '#0e9bac'
                                                        : state.isFocused
                                                            ? '#e8e5e1'
                                                            : '#ffffff',
                                                    ':active': {
                                                        backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac',
                                                    },
                                                }),
                                                menuPortal: base => ({ ...base, zIndex: 9999 })
                                            }}
                                            menuPortalTarget={document.body}
                                            isClearable
                                        />
                                        <span className="material-symbols-outlined grey-text text-darken-1">
                                            globe
                                        </span>
                                    </div>
                                    <div className="col s12 l4">
                                        <Select
                                            placeholder="Search by Consultant"
                                            value={
                                                filterOptions.consultant.find(consultant => consultant.value === filters.consultant)
                                                    ? filterOptions.consultant.find(consultant => consultant.value === filters.consultant)
                                                    : null
                                            }
                                            onChange={(selectedOption) => setFilters({ ...filters, consultant: selectedOption ? selectedOption.apiLabel : '' })}
                                            options={filterOptions.consultant}
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    '&:hover': {
                                                        borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                    },
                                                    boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none',
                                                }),
                                                option: (provided, state) => ({
                                                    ...provided,
                                                    fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                                    backgroundColor: state.isSelected
                                                        ? '#0e9bac'
                                                        : state.isFocused
                                                            ? '#e8e5e1'
                                                            : '#ffffff',
                                                    ':active': {
                                                        backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac',
                                                    },
                                                }),
                                                menuPortal: base => ({ ...base, zIndex: 9999 })
                                            }}
                                            menuPortalTarget={document.body}
                                            isClearable
                                        />
                                        <span className="material-symbols-outlined grey-text text-darken-1">
                                            badge
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="row center">

                                <div className="col s12 l4">
                                    <Select
                                        placeholder="Search by Property"
                                        value={filterOptions.property.find(prop => prop.label === filters.property) ? { value: filters.property, label: filters.property } : null}
                                        onChange={(selectedOption) => setFilters({ ...filters, property: selectedOption ? selectedOption.label : '' })}
                                        options={filterOptions.property}
                                        styles={{
                                            control: (provided, state) => ({
                                                ...provided,
                                                borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                '&:hover': {
                                                    borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                                },
                                                boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none',
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                                backgroundColor: state.isSelected
                                                    ? '#0e9bac'
                                                    : state.isFocused
                                                        ? '#e8e5e1'
                                                        : '#ffffff',
                                                ':active': {
                                                    backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac',
                                                },
                                            }),
                                            menuPortal: base => ({ ...base, zIndex: 9999 })
                                        }}
                                        menuPortalTarget={document.body}
                                        isClearable
                                    />
                                    <span className="material-symbols-outlined grey-text text-darken-1">
                                        hotel
                                    </span>
                                </div>
                                <div className="col s12 l3">

                                    <input
                                        type="text"
                                        id="search-query"
                                        placeholder="Search by text..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input" // Apply any styling as needed
                                    />
                                    <span className="material-symbols-outlined grey-text text-darken-1">
                                        search
                                    </span>
                                </div>
                                <div className="col s12 l5">
                                    <div className="row">
                                        <div className="col s6">
                                            <div>
                                                <ReactDatePicker
                                                    id="date-in"
                                                    selected={filters.start_date ? moment(filters.start_date).toDate() : null}
                                                    onChange={(date) =>
                                                        setFilters({ ...filters, start_date: date ? moment(date).format('YYYY-MM-DD') : '' })
                                                    }
                                                    isClearable
                                                    placeholderText="mm/dd/yyyy"
                                                    className="date-input"
                                                    dateFormat="MM/dd/yyyy"
                                                    minDate={new Date('2000-01-01')}
                                                    maxDate={new Date('2100-12-31')}
                                                />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }} className="grey-text text-darken-1">
                                                <span className="material-symbols-outlined">
                                                    today
                                                </span>
                                                Start Date
                                            </span>
                                        </div>
                                        <div className="col s6">
                                            <div>
                                                <ReactDatePicker
                                                    id="date-out"
                                                    selected={filters.end_date ? moment(filters.end_date).toDate() : null}
                                                    onChange={(date) =>
                                                        setFilters({ ...filters, end_date: date ? moment(date).format('YYYY-MM-DD') : '' })
                                                    }
                                                    isClearable
                                                    placeholderText="mm/dd/yyyy"
                                                    className="date-input"
                                                    dateFormat="MM/dd/yyyy"
                                                    minDate={new Date('2000-01-01')}
                                                    maxDate={new Date('2100-12-31')}
                                                />
                                            </div>
                                            <span style={{ fontSize: '0.8rem' }} className="grey-text text-darken-1">
                                                <span className="material-symbols-outlined">
                                                    event
                                                </span>
                                                End Date
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row center">
                                <div>
                                    <button className="btn tb-grey lighten-2" onClick={() => {
                                        setFilters(
                                            { core_dest: '', country: '', consultant: '' }
                                        );
                                        setSearchQuery('');
                                    }}>
                                        Reset Filters
                                        <span className="material-symbols-outlined">
                                            refresh
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <BedNightTable
                                filteredData={filteredData}
                                openEditModal={openEditModal}
                                isEditable={true}
                            />
                        </>
                    ) : (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    )}
                </div >
            </main >
        </>
    );
};

export default Overview;
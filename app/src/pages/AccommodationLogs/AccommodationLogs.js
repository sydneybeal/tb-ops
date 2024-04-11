import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../components/AuthContext';
import CircularPreloader from '../../components/CircularPreloader';
import AddLogModal from './AddLogModal';
import BulkEditModal from './BulkEditModal';
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
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkSelectedEntries, setBulkSelectedEntries] = useState(new Map());
    const [bulkAction, setBulkAction] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        core_destination_name: [],
        country_name: [],
        consultant_name: [],
        property_name: [],
        property_portfolio: [],
        booking_channel: [],
        agency: [],
        start_date: '',
        end_date: '',
    });
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        core_destination_name: '',
        country_name: '',
        consultant_name: '',
        // property_name: '',
        property_names: [],
        property_portfolio: '',
        booking_channel: '',
        agency: '',
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
                        classes: 'error-red',
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
                classes: 'error-red',
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
    }, [filters, filterOptions, bulkSelectedEntries]);

    useEffect(() => {
        const coreDestMap = apiData.reduce((acc, item) => {
            if (!acc[item.core_destination_id]) {
                acc[item.core_destination_id] = {
                    value: item.core_destination_id || '',
                    label: item.core_destination_name || ''
                };
            }
            return acc;
        }, {});
        const countryMap = apiData.reduce((acc, item) => {
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
        const portfolioMap = apiData.reduce((acc, item) => {
            if (!acc[item.property_portfolio_id]) {
                acc[item.property_portfolio_id] = {
                    value: item.property_portfolio_id || '',
                    label: item.property_portfolio || ''
                };
            }
            return acc;
        }, {});
        const bookingChannelMap = apiData.reduce((acc, item) => {
            const bookingChannelId = item.booking_channel_id || 'no-booking-channel';
            const bookingChannelName = item.booking_channel_name || 'No booking channel';

            if (!acc[bookingChannelId]) {
                acc[bookingChannelId] = {
                    value: bookingChannelId || '',
                    label: bookingChannelName || ''
                };
            }
            return acc;
        }, {});
        const agencyMap = apiData.reduce((acc, item) => {
            const agencyId = item.agency_id || 'no-agency';
            const agencyName = item.booking_channel_name || 'No agency';

            if (!acc[agencyId]) {
                acc[agencyId] = {
                    value: agencyId || '',
                    label: agencyName || ''
                };
            }
            return acc;
        }, {});
        const coreDestOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));
        const portfolioOptions = Object.values(portfolioMap).sort((a, b) => a.label.localeCompare(b.label));
        const bookingChannelOptions = Object.values(bookingChannelMap).sort((a, b) => a.label.localeCompare(b.label));
        const agencyOptions = Object.values(agencyMap).sort((a, b) => a.label.localeCompare(b.label));
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
            core_destination_name: coreDestOptions,
            country_name: countryOptions,
            consultant_name: consultantOptions,
            property_name: propertyOptions,
            property_portfolio: portfolioOptions,
            booking_channel: bookingChannelOptions,
            agency: agencyOptions,
        });
    }, [apiData,]);

    useEffect(() => {
        M.AutoInit();
    }, []);

    const handleSelectionChange = (entry, isChecked) => {
        setBulkSelectedEntries((prevSelected) => {
            const newSelected = new Map(prevSelected); // Clone the previous Map
            if (isChecked) {
                // Add the pipeline object with id as the key
                const entryCopy = { ...entry };
                newSelected.set(entry.id, entryCopy);
            } else {
                newSelected.delete(entry.id);
            }
            return newSelected;
        });
    };

    const handleOpenBulkEditModal = (action) => {
        if (action === 'delete') {
            setBulkAction('delete');
            setIsBulkEditModalOpen(true);
        } else {
            setBulkAction('duplicate');
            const entriesArray = Array.from(bulkSelectedEntries.values());

            // Check if there's at least one entry selected
            if (entriesArray.length === 0) {
                M.toast({
                    html: 'Please select at least one entry.',
                    displayLength: 2000,
                    classes: 'error-red',
                });
                return;
            }

            // Extract the values for comparison
            const primaryTraveler = entriesArray[0].primary_traveler;
            const consultantId = entriesArray[0].consultant_id;
            const agencyId = entriesArray[0].agency_id;

            // Check if all entries have the same primary_traveler, consultant_id, and agency_id
            const allMatch = entriesArray.every(entry =>
                entry.primary_traveler === primaryTraveler &&
                entry.consultant_id === consultantId &&
                entry.agency_id === agencyId
            );

            if (allMatch) {
                setIsBulkEditModalOpen(true);
            } else {
                M.toast({
                    html: 'All selected entries must have the same primary traveler, consultant, and agency.',
                    displayLength: 4000,
                    classes: 'error-red',
                });
            }
        }
    };

    const closeBulkEditModal = () => {
        setIsBulkEditModalOpen(false);
        setBulkSelectedEntries(new Map());
        document.body.style.overflow = '';
    };

    const normalizeString = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    useEffect(() => {
        // Step 1: Filter apiData based on all filters except property_names
        let contextFilteredData = apiData.filter(item => {
            // Assume all conditions return true (include the item) by default
            let includeItem = true;

            if (filters.core_destination_name && item.core_destination_name !== filters.core_destination_name) {
                includeItem = false;
            }

            if (filters.country_name) {
                if (filters.country_name === 'No country' && item.country_name) {
                    includeItem = false;
                } else if (item.country_name !== filters.country_name) {
                    includeItem = false;
                }
            }

            if (filters.consultant_name && item.consultant_display_name !== filters.consultant_name) {
                includeItem = false;
            }

            // Additional conditions for other filters as necessary, excluding property_names

            if (filters.property_portfolio && item.property_portfolio !== filters.property_portfolio) {
                includeItem = false;
            }

            if (filters.booking_channel) {
                if (filters.booking_channel === 'No booking channel' && item.booking_channel_name) {
                    includeItem = false;
                } else if (item.booking_channel_name !== filters.booking_channel) {
                    includeItem = false;
                }
            }

            if (filters.agency) {
                if (filters.agency === 'No agency' && item.agency_name) {
                    includeItem = false;
                } else if (item.agency_name !== filters.agency) {
                    includeItem = false;
                }
            }

            if (includeItem && (filters.start_date || filters.end_date)) {
                const startDate = filters.start_date ? new Date(filters.start_date) : new Date('1900-01-01');
                const endDate = filters.end_date ? new Date(filters.end_date) : new Date('2100-12-31');

                const itemDateIn = new Date(item.date_in);
                const itemDateOut = item.date_out ? new Date(item.date_out) : itemDateIn;

                // Adjust logic to exclude items outside the specified date range
                if (filters.start_date && itemDateIn < startDate) {
                    includeItem = false;
                }
                if (filters.end_date && itemDateOut > endDate) {
                    includeItem = false;
                }
            }

            return includeItem;
        });

        const propertyOptions = [...new Set(contextFilteredData.map(item => item.property_name))]
            .sort()
            .map(name => ({ value: name, label: name }));

        // Step 2: Now filter newFilteredData including property_names
        let newFilteredData = contextFilteredData;

        if (filters.property_names && filters.property_names.length > 0) {
            newFilteredData = newFilteredData.filter(item =>
                filters.property_names.includes(item.property_name)
            );
        }

        if (searchQuery) {
            const normalizedSearchQuery = normalizeString(searchQuery);
            newFilteredData = newFilteredData.filter((item) =>
                (item.primary_traveler ? normalizeString(item.primary_traveler) : '').includes(normalizedSearchQuery) ||
                (item.property_name ? normalizeString(item.property_name) : '').includes(normalizedSearchQuery) ||
                (item.property_portfolio ? normalizeString(item.property_portfolio) : '').includes(normalizedSearchQuery) ||
                (item.consultant_display_name ? normalizeString(item.consultant_display_name) : '').includes(normalizedSearchQuery) ||
                (item.agency_name ? normalizeString(item.agency_name) : '').includes(normalizedSearchQuery) ||
                (item.booking_channel_name ? normalizeString(item.booking_channel_name) : '').includes(normalizedSearchQuery) ||
                (item.country_name ? normalizeString(item.country_name) : '').includes(normalizedSearchQuery) ||
                (item.core_destination_name ? normalizeString(item.core_destination_name) : '').includes(normalizedSearchQuery),
            );
        }

        setFilteredData(newFilteredData);

        // Update filter options based on newFilteredData
        const coreDestOptions = [...new Set(newFilteredData.map(item => item.core_destination_name))].sort().map(name => ({ value: name, label: name }));
        const countryMap = newFilteredData.reduce((acc, item) => {
            const countryId = item.country_id || 'no-country';
            const countryName = item.country_name || 'No country';
            if (!acc[countryId]) {
                acc[countryId] = {
                    value: countryId,
                    label: countryName
                };
            }
            return acc;
        }, {});

        // Convert the map into an array of options
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));

        const portfolioOptions = [...new Set(newFilteredData.map(item => item.property_portfolio))].sort().map(name => ({ value: name, label: name }));
        const bookingChannelMap = newFilteredData.reduce((acc, item) => {
            const bookingChannelId = item.booking_channel_id || 'no-booking-channel';
            const bookingChannelName = item.booking_channel_name || 'No booking channel';
            if (!acc[bookingChannelId]) {
                acc[bookingChannelId] = {
                    value: bookingChannelId,
                    label: bookingChannelName
                };
            }
            return acc;
        }, {});
        const bookingChannelOptions = Object.values(bookingChannelMap).sort((a, b) => a.label.localeCompare(b.label));
        const agencyMap = newFilteredData.reduce((acc, item) => {
            const agencyId = item.agency_id || 'no-agency';
            const agencyName = item.agency_name || 'No agency';
            if (!acc[agencyId]) {
                acc[agencyId] = {
                    value: agencyId,
                    label: agencyName
                };
            }
            return acc;
        }, {});
        const agencyOptions = Object.values(agencyMap).sort((a, b) => a.label.localeCompare(b.label));
        const uniqueConsultants = newFilteredData.reduce((acc, item) => {
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
            core_destination_name: coreDestOptions,
            country_name: countryOptions,
            consultant_name: consultantOptions,
            property_name: propertyOptions,
            property_portfolio: portfolioOptions,
            booking_channel: bookingChannelOptions,
            agency: agencyOptions,
        });

    }, [apiData, filters, searchQuery]);

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please enter your name above before adding bed nights.',
                displayLength: 2000,
                classes: 'error-red',
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

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center accommodation-logs" style={{ width: '90%', paddingBottom: '100px' }}>
                    <AddLogModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        onRefresh={triggerRefresh}
                        editLogData={currentEditLog}
                        isEditMode={isEditMode}
                    />
                    <BulkEditModal
                        isOpen={isBulkEditModalOpen}
                        onClose={closeBulkEditModal}
                        entries={bulkSelectedEntries}
                        bulkAction={bulkAction}
                        onRefresh={triggerRefresh}
                    />


                    {loaded ? (
                        <>
                            <div className="row center">
                                <div className="input-field col s12 l8 offset-l2">
                                    <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        id="search-query"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input" // Apply any styling as needed
                                    />

                                </div>
                                <div className="col s12 l2">
                                    <button className="btn-float btn-large waves-effect waves-light tb-teal darken-4" onClick={openModal}>
                                        <span className="material-symbols-outlined">
                                            add
                                        </span>
                                        Add New
                                    </button>
                                </div>
                            </div>
                            <div className="row center" style={{ marginBottom: '0px', marginTop: '0px' }}>
                                <div>
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Core Destination"
                                            value={filterOptions.core_destination_name.find(core_dest => core_dest.label === filters.core_destination_name) ? { value: filters.core_destination_name, label: filters.core_destination_name } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, core_destination_name: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.core_destination_name}
                                            className={`select-sm-placeholder ${filters.core_destination_name ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Country"
                                            value={filterOptions.country_name.find(country => country.label === filters.country_name) ? { value: filters.country_name, label: filters.country_name } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, country_name: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.country_name}
                                            className={`select ${filters.country_name ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Portfolio"
                                            value={filterOptions.property_portfolio.find(option => option.label === filters.property_portfolio) ? { value: filters.property_portfolio, label: filters.property_portfolio } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, property_portfolio: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.property_portfolio}
                                            className={`select ${filters.property_portfolio ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                                            store
                                        </span>
                                    </div>
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Agency"
                                            value={filterOptions.agency.find(option => option.label === filters.agency) ? { value: filters.agency, label: filters.agency } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, agency: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.agency}
                                            className={`select ${filters.agency ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                                            contact_mail
                                        </span>
                                    </div>
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Booking Channel"
                                            value={filterOptions.booking_channel.find(option => option.label === filters.booking_channel) ? { value: filters.booking_channel, label: filters.booking_channel } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, booking_channel: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.booking_channel}
                                            className={`select select-sm-placeholder ${filters.booking_channel ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                                            alt_route
                                        </span>
                                    </div>
                                    <div className="col s12 l2">
                                        <Select
                                            placeholder="Consultant"
                                            value={
                                                filterOptions.consultant_name.find(consultant => consultant.apiLabel === filters.consultant_name)
                                                    ? filterOptions.consultant_name.find(consultant => consultant.apiLabel === filters.consultant_name)
                                                    : null
                                            }
                                            onChange={(selectedOption) => setFilters({ ...filters, consultant_name: selectedOption ? selectedOption.apiLabel : '' })}
                                            options={filterOptions.consultant_name}
                                            className={`select ${filters.consultant_name ? 'select--has-value' : ''}`}
                                            classNamePrefix="select"
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
                            <div className="row center" style={{ marginBottom: '0px', marginTop: '0px' }}>
                                <div className="col s12 l6">
                                    <Select
                                        placeholder="Properties"
                                        // value={filterOptions.property_name.find(prop => prop.label === filters.property_name) ? { value: filters.property_name, label: filters.property_name } : null}
                                        // onChange={(selectedOption) => setFilters({ ...filters, property_name: selectedOption ? selectedOption.label : '' })}
                                        options={filterOptions.property_name}
                                        className={`select ${filters.property_names?.length > 0 ? 'select--has-value' : ''}`}
                                        classNamePrefix="select"
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
                                        isMulti
                                        value={filterOptions.property_name.filter(option => filters.property_names.includes(option.label))}
                                        onChange={(selectedOptions) => setFilters({
                                            ...filters,
                                            property_names: selectedOptions ? selectedOptions.map(option => option.label) : []
                                        })}
                                    />
                                    <span className="material-symbols-outlined grey-text text-darken-1">
                                        hotel
                                    </span>
                                    {/*  */}
                                </div>
                                <div className="col s6 l3">
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
                                            autoComplete="off"
                                            openToDate={filters.end_date ? moment(filters.end_date).subtract(1, 'days').toDate() : new Date()}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }} className="grey-text text-darken-1">
                                        <span className="material-symbols-outlined">
                                            today
                                        </span>
                                        Start Date
                                    </span>
                                </div>
                                <div className="col s6 l3">
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
                                            autoComplete="off"
                                            openToDate={filters.start_date ? moment(filters.start_date).add(1, 'days').toDate() : new Date()}
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
                            <div className="row center" style={{ marginBottom: '0px', marginTop: '0px' }}>

                            </div>
                            <div className="row center">
                                <div>
                                    <button className="btn tb-grey lighten-2" onClick={() => {
                                        setFilters(
                                            {
                                                start_date: '',
                                                end_date: '',
                                                core_destination_name: '',
                                                country_name: '',
                                                consultant_name: '',
                                                property_names: [],
                                                property_portfolio: '',
                                                booking_channel: '',
                                                agency: '',
                                            }
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
                            {bulkSelectedEntries.size > 0 && (
                                <div className="row center">
                                    <div>
                                        <span className="code">Entries selected:</span>
                                        <span className="chip warning-yellow" style={{ marginLeft: '5px' }}>
                                            {bulkSelectedEntries.size}
                                        </span>
                                    </div>
                                    <div>
                                        <button
                                            className="btn btn-large warning-yellow grey-text text-darken-4"
                                            style={{ marginRight: '10px' }}
                                            onClick={() => handleOpenBulkEditModal('duplicate')}
                                        >
                                            Duplicate Entries
                                            &nbsp;
                                            <span className="material-symbols-outlined">
                                                difference
                                            </span>
                                        </button>
                                        {userDetails.role === 'admin' &&
                                            <button
                                                className="btn btn-large error-red-light grey-text text-darken-4"
                                                style={{ marginRight: '10px' }}
                                                onClick={() => handleOpenBulkEditModal('delete')}
                                            >
                                                Delete Entries
                                                &nbsp;
                                                <span className="material-symbols-outlined">
                                                    delete_forever
                                                </span>
                                            </button>
                                        }
                                    </div>
                                </div>
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <em className="tb-grey-text">
                                    <span className="text-bold tb-teal-text">{filteredData?.length?.toLocaleString()}</span> entries
                                </em>
                            </div>
                            <BedNightTable
                                filteredData={filteredData}
                                openEditModal={openEditModal}
                                handleSelectionChange={handleSelectionChange}
                                bulkSelectedEntries={bulkSelectedEntries}
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
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import ReportDashboard from './ReportDashboard';
import BedNightTable from '../AccommodationLogs/BedNightTable';
import moment from 'moment';

export const BedNightReports = () => {
    const [reportData, setReportData] = useState({});
    const [accommodationLogData, setAccommodationLogData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const minDate = '2000-01-01';
    const maxDate = '2099-12-31';
    const [temporaryStartDate, setTemporaryStartDate] = useState('');
    const [temporaryEndDate, setTemporaryEndDate] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [filterOptions, setFilterOptions] = useState({
        core_destination_name: [],
        country_name: [],
        consultant_name: [],
        property_name: [],
        portfolio_name: [],
        booking_channel: [],
        agency: [],
    });
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        core_destination_name: '',
        country_name: '',
        consultant_name: '',
        property_name: '',
        portfolio_name: '',
        booking_channel: '',
        agency: '',
    });

    // Function to construct query string from filters
    const getQueryString = (params) => {
        return Object.keys(params)
            .filter(key => params[key] !== '' && params[key] != null) // Filter out empty values
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
    };

    // Function to parse query string into filters object
    const parseQueryString = (queryString) => {
        const params = new URLSearchParams(queryString);
        const filters = {};
        for (let param of params) {
            filters[param[0]] = param[1];
        }
        return filters;
    };

    useEffect(() => {
        const currentQueryString = new URLSearchParams(window.location.search).toString();
        const newQueryString = getQueryString(filters);

        if (newQueryString !== currentQueryString) {
            const currentFilters = parseQueryString(currentQueryString);
            const filtersChanged = Object.keys(filters).some(key => filters[key] !== currentFilters[key]);

            if (filtersChanged) {
                navigate(`/bed_night_reports?${newQueryString}`, { replace: true });
            }
        }
    }, [filters, navigate]);

    useEffect(() => {
        if (location.search) {
            const filtersFromUrl = parseQueryString(location.search);

            const validatedStartDate = validateDateRange(filtersFromUrl.start_date);
            const validatedEndDate = validateDateRange(filtersFromUrl.end_date);

            setFilters(prevFilters => ({
                ...prevFilters,
                // Set each filter conditionally based on whether it exists in filtersFromUrl
                start_date: validatedStartDate || prevFilters.start_date,
                end_date: validatedEndDate || prevFilters.end_date,
            }));
        }
    }, [location.search]);

    const validateDateRange = (date) => {
        if (!date) return '';

        if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
            M.toast({
                html: 'An invalid date was passed in the URL and has been reset.',
                classes: 'warning-yellow-light tb-grey-text text-darken-4',
                displayLength: 1500,
            });
            return '';
        }

        const momentDate = moment(date);
        const momentMin = moment(minDate);
        const momentMax = moment(maxDate);

        // Check if the date is before minDate or after maxDate and adjust accordingly
        if (momentDate.isBefore(momentMin)) {
            M.toast({
                html: `Date out of range, resetting to ${momentMin.format('MM/DD/yyyy')}.`,
                classes: 'warning-yellow-light tb-grey-text text-darken-4',
                displayLength: 1500,
            });
            return momentMin.format('YYYY-MM-DD');
        } else if (momentDate.isAfter(momentMax)) {
            M.toast({
                html: `Date out of range, resetting to ${momentMax.format('MM/DD/yyyy')}.`,
                classes: 'warning-yellow-light tb-grey-text text-darken-4',
                displayLength: 1500,
            });
            return momentMax.format('YYYY-MM-DD');
        } else {
            return momentDate.format('YYYY-MM-DD');
        }
    };

    const confirmStartDateSelection = () => {
        if (temporaryStartDate && (temporaryStartDate !== filters.start_date)) {
            setFilters(prevFilters => ({
                ...prevFilters,
                start_date: temporaryStartDate,
            }));
        }
    };

    const confirmEndDateSelection = () => {

        if (temporaryEndDate && (temporaryEndDate !== filters.end_date)) {
            setFilters(prevFilters => ({
                ...prevFilters,
                end_date: temporaryEndDate,
            }));
        }
    };

    useEffect(() => {
        M.AutoInit();

        const queryString = getQueryString(filters);
        const apiUrl = `${process.env.REACT_APP_API}/v1/bed_night_report?${queryString}`;
        setLoaded(false);
        fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setReportData(data);
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
                                classes: 'error-red-light',
                            });
                            logout();
                            return;
                        }
                        if (!Array.isArray(data)) {
                            console.error("Expected an array but got:", data);
                            data = []; // Set data to an empty array if it's not an array
                        }
                        setAccommodationLogData(data);
                        setLoaded(true);
                    })
                    .catch((err) => {
                        setLoaded(true);
                        console.error(err);
                    });
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [filters, logout, userDetails.token]);

    useEffect(() => {
        M.AutoInit();
    }, [filters, filterOptions, accommodationLogData, reportData]);

    useEffect(() => {
        if (accommodationLogData.length > 0) {
            const elems = document.querySelectorAll('select');
            M.FormSelect.init(elems);
        }
    }, [accommodationLogData]);

    useEffect(() => {
        // Initialize or dynamically update filter options based on `accommodationLogData` and current `filters`
        const filteredData = accommodationLogData.filter(item => {
            // Check for "No agency" filter and match against null or "n/a"
            const agencyCondition = filters.agency === "No agency"
                ? (!item.agency_name || item.agency_name === 'n/a')
                : item.agency_name === filters.agency;

            const bookingChannelCondition = filters.booking_channel === "Direct"
                ? (!item.booking_channel_name)
                : item.booking_channel_name === filters.booking_channel;

            return (!filters.core_destination_name || item.core_destination_name === filters.core_destination_name)
                && (!filters.consultant_name || item.consultant_display_name === filters.consultant_name)
                && (!filters.country_name || item.country_name === filters.country_name)
                && (!filters.property_name || item.property_name === filters.property_name)
                && (!filters.portfolio_name || item.property_portfolio === filters.portfolio_name)
                && (!filters.agency || agencyCondition)
                && (!filters.booking_channel || bookingChannelCondition);
        });


        // Maps for creating filter options from filtered data
        const coreDestMap = {}, countryMap = {}, consultantMap = {}, propertyMap = {}, portfolioMap = {}, agencyMap = {}, bookingChannelMap = {};

        // Populate maps with options from filteredData
        filteredData.forEach(item => {
            coreDestMap[item.core_destination_id] = { value: item.core_destination_id || '', label: item.core_destination_name || 'No core destination' };
            countryMap[item.country_id] = { value: item.country_id || 'no-country', label: item.country_name || 'No country' };
            consultantMap[item.consultant_id] = { value: item.consultant_id || '', label: item.consultant_display_name || 'No consultant' };
            propertyMap[item.property_id] = { value: item.property_id || '', label: item.property_name || 'No property' };
            portfolioMap[item.property_portfolio] = { value: item.property_portfolio || 'No portfolio', label: item.property_portfolio || 'No portfolio' };
            const agencyLabel = item.agency_name ? (item.agency_name === 'n/a' ? 'No agency' : item.agency_name) : 'No agency';
            agencyMap[agencyLabel] = { value: agencyLabel, label: agencyLabel };
            bookingChannelMap[item.booking_channel_name] = { value: item.booking_channel_name || 'Direct', label: item.booking_channel_name || 'Direct' };
        });

        // Convert maps to arrays and sort for filter options
        const coreDestOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const consultantOptions = Object.values(consultantMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));
        const portfolioOptions = Object.values(portfolioMap).sort((a, b) => a.label.localeCompare(b.label));
        // No agency first for agency
        const noAgencyOption = Object.values(agencyMap).find(option => option.label === 'No agency');
        const sortedAgencyOptions = Object.values(agencyMap)
            .filter(option => option.label !== 'No agency')
            .sort((a, b) => a.label.localeCompare(b.label));
        const agencyOptions = noAgencyOption ? [noAgencyOption, ...sortedAgencyOptions] : sortedAgencyOptions;
        // Direct first for booking channel
        const noBookingChannelOption = Object.values(bookingChannelMap).find(option => option.label === 'Direct');
        const sortedBookingChannelOptions = Object.values(bookingChannelMap)
            .filter(option => option.label !== 'Direct')
            .sort((a, b) => a.label.localeCompare(b.label));
        const bookingChannelOptions = noBookingChannelOption ? [noBookingChannelOption, ...sortedBookingChannelOptions] : sortedBookingChannelOptions;

        setFilteredData(filteredData);
        // Update filter options state
        setFilterOptions({
            core_destination_name: coreDestOptions,
            country_name: countryOptions,
            consultant_name: consultantOptions,
            property_name: propertyOptions,
            portfolio_name: portfolioOptions,
            agency: agencyOptions,
            booking_channel: bookingChannelOptions,
        });
    }, [accommodationLogData, filters]); // Depends on both the dataset and current filter selections



    return (
        <>
            <header>
                <Navbar title="Reports" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
                    <div className="row center">
                        <div>
                            <div className="col s12 l3">
                                <Select
                                    placeholder="Search by Core Destination"
                                    value={filterOptions.core_destination_name.find(option => option.label === filters.core_destination_name) ? { value: filters.core_destination_name, label: filters.core_destination_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, core_destination_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.core_destination_name}
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
                                    }}
                                    isClearable
                                />
                            </div>
                            <div className="col s12 l3">
                                <Select
                                    placeholder="Search by Country"
                                    value={filterOptions.country_name.find(option => option.label === filters.country_name) ? { value: filters.country_name, label: filters.country_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, country_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.country_name}
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
                                    }}
                                    isClearable
                                />
                            </div>
                            <div className="col s12 l3">
                                <Select
                                    placeholder="Search by Portfolio"
                                    value={filterOptions.portfolio_name.find(option => option.label === filters.portfolio_name) ? { value: filters.portfolio_name, label: filters.portfolio_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, portfolio_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.portfolio_name}
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
                                    }}
                                    isClearable
                                />
                            </div>
                            <div className="col s12 l3">
                                <Select
                                    placeholder="Search by Property"
                                    value={filterOptions.property_name.find(option => option.label === filters.property_name) ? { value: filters.property_name, label: filters.property_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, property_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.property_name}
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
                                    }}
                                    isClearable
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row center">
                        <div className="col s12 l4">
                            <Select
                                placeholder="Search by Agency"
                                value={filterOptions.agency.find(option => option.label === filters.agency) ? { value: filters.agency, label: filters.agency } : null}
                                onChange={(selectedOption) => setFilters({ ...filters, agency: selectedOption ? selectedOption.label : '' })}
                                options={filterOptions.agency}
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
                                }}
                                isClearable
                            />
                        </div>
                        <div className="col s12 l4">
                            <Select
                                placeholder="Search by Booking Channel"
                                value={filterOptions.booking_channel.find(option => option.label === filters.booking_channel) ? { value: filters.booking_channel, label: filters.booking_channel } : null}
                                onChange={(selectedOption) => setFilters({ ...filters, booking_channel: selectedOption ? selectedOption.label : '' })}
                                options={filterOptions.booking_channel}
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
                                }}
                                isClearable
                            />
                        </div>
                        <div className="col s12 l4">
                            <Select
                                placeholder="Search by Consultant"
                                value={filterOptions.consultant_name.find(option => option.label === filters.consultant_name) ? { value: filters.consultant_name, label: filters.consultant_name } : null}
                                onChange={(selectedOption) => setFilters({ ...filters, consultant_name: selectedOption ? selectedOption.label : '' })}
                                options={filterOptions.consultant_name}
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
                                }}
                                isClearable
                            />
                        </div>
                    </div>
                    <div className="row center" style={{ marginBottom: '0px' }}>
                        <div className="col s12 l6 offset-l3">
                            <div className="row">
                                <div className="col s6">
                                    <div>
                                        <ReactDatePicker
                                            selected={filters.start_date ? moment(filters.start_date).toDate() : ''}
                                            onChange={(date) => {
                                                if (date === null) {
                                                    // Directly update filters if date is cleared
                                                    setTemporaryStartDate('');
                                                    if (filters.start_date !== '') {
                                                        setFilters(prevFilters => ({
                                                            ...prevFilters,
                                                            start_date: '',
                                                        }));
                                                    }
                                                } else {
                                                    const formattedDate = moment(date).format('YYYY-MM-DD');
                                                    const isBeforeMinDate = moment(formattedDate).isBefore(moment(minDate));
                                                    const isAfterMaxDate = moment(formattedDate).isAfter(moment(maxDate));

                                                    // Handling dates outside the valid range
                                                    if (isBeforeMinDate || isAfterMaxDate) {
                                                        const validDate = isBeforeMinDate ? minDate : maxDate;
                                                        setTemporaryStartDate(validDate);
                                                        setFilters(prevFilters => ({
                                                            ...prevFilters,
                                                            start_date: validDate
                                                        }));
                                                        M.toast({
                                                            html: `Date out of range, resetting to ${moment(validDate).format('MM/DD/yyyy')}.`,
                                                            classes: 'warning-yellow-light tb-grey-text text-darken-4',
                                                            displayLength: 1500,
                                                        });
                                                    } else {
                                                        setTemporaryStartDate(formattedDate);
                                                    }
                                                }

                                            }}
                                            onBlur={confirmStartDateSelection}
                                            onCalendarClose={confirmStartDateSelection}
                                            isClearable
                                            placeholderText="mm/dd/yyyy"
                                            className="date-input"
                                            dateFormat="MM/dd/yyyy"
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }} className="tb-grey-text text-darken-1">
                                        <span className="material-symbols-outlined">
                                            today
                                        </span>
                                        Start Date
                                    </span>
                                </div>
                                <div className="col s6">
                                    <div>
                                        <ReactDatePicker
                                            selected={filters.end_date ? moment(filters.end_date).toDate() : ''}
                                            onChange={(date) => {
                                                if (date === null) {
                                                    // Directly update filters if date is cleared
                                                    setTemporaryEndDate('');
                                                    if (filters.end_date !== '') {
                                                        setFilters(prevFilters => ({
                                                            ...prevFilters,
                                                            end_date: ''
                                                        }));
                                                    }

                                                } else {
                                                    const formattedDate = moment(date).format('YYYY-MM-DD');
                                                    const isBeforeMinDate = moment(formattedDate).isBefore(moment(minDate));
                                                    const isAfterMaxDate = moment(formattedDate).isAfter(moment(maxDate));

                                                    // Handling dates outside the valid range
                                                    if (isBeforeMinDate || isAfterMaxDate) {
                                                        const validDate = isBeforeMinDate ? minDate : maxDate;
                                                        setTemporaryEndDate(validDate);
                                                        setFilters(prevFilters => ({
                                                            ...prevFilters,
                                                            end_date: validDate
                                                        }));
                                                        M.toast({
                                                            html: `Date out of range, resetting to ${moment(validDate).format('MM/DD/yyyy')}.`,
                                                            classes: 'warning-yellow-light tb-grey-text text-darken-4',
                                                            displayLength: 1500,
                                                        });
                                                    } else {
                                                        setTemporaryEndDate(formattedDate);
                                                    }
                                                }
                                            }}
                                            onBlur={confirmEndDateSelection}
                                            onCalendarClose={confirmEndDateSelection}
                                            isClearable
                                            placeholderText="mm/dd/yyyy"
                                            className="date-input"
                                            dateFormat="MM/dd/yyyy"
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }} className="tb-grey-text text-darken-1">
                                        <span className="material-symbols-outlined">
                                            event
                                        </span>
                                        End Date
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row center" style={{ marginBottom: '0px' }}>
                        <div>
                            <button className="btn tb-grey lighten-2" onClick={() => setFilters(
                                { core_destination_name: '', portfolio_name: '', country_name: '', consultant_name: '', start_date: '', end_date: '' })}>
                                Reset Filters
                                <span className="material-symbols-outlined">
                                    refresh
                                </span>
                            </button>
                        </div>
                    </div>
                    {loaded ? (
                        <>
                            <br />
                            <ReportDashboard reportData={reportData} />
                            <br />
                            <h5>Matching Bed Nights</h5>
                            <BedNightTable
                                filteredData={filteredData}
                                isEditable={false}
                                pageSize={10}
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

export default BedNightReports;
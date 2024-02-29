import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import ReportDashboard from './ReportDashboard';
import moment from 'moment';

export const BedNightReports = () => {
    const [reportData, setReportData] = useState({});
    const [accommodationLogData, setAccommodationLogData] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
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

    useEffect(() => {
        M.AutoInit();
        // Function to construct query string from filters
        const getQueryString = (params) => {
            return Object.keys(params)
                .filter(key => params[key] !== '') // Filter out empty values
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
        };

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
                console.log(data);
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
                                classes: 'red lighten-2',
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
            // Example filtering logic here; adjust according to your actual filters
            return (!filters.core_destination_name || item.core_destination_name === filters.core_destination_name)
                && (!filters.country_name || item.country_name === filters.country_name)
                && (!filters.property_name || item.property_name === filters.property_name)
                && (!filters.portfolio_name || item.property_portfolio === filters.portfolio_name)
                && (!filters.agency || item.agency_name === filters.agency)
                && (!filters.booking_channel || item.booking_channel_name === filters.booking_channel);
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
            agencyMap[item.agency_name] = { value: item.agency_name || 'No agency', label: item.agency_name || 'No agency' };
            bookingChannelMap[item.booking_channel_name] = { value: item.booking_channel_name || 'No booking channel', label: item.booking_channel_name || 'No booking channel' };
        });

        // Convert maps to arrays and sort for filter options
        const coreDestOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const consultantOptions = Object.values(consultantMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));
        const portfolioOptions = Object.values(portfolioMap).sort((a, b) => a.label.localeCompare(b.label));
        const agencyOptions = Object.values(agencyMap).sort((a, b) => a.label.localeCompare(b.label));
        const bookingChannelOptions = Object.values(bookingChannelMap).sort((a, b) => a.label.localeCompare(b.label));

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

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    <div className="row center">
                        <div>
                            <div className="col s3">
                                <Select
                                    placeholder="Search by Core Destination"
                                    value={filterOptions.core_destination_name.find(option => option.label === filters.core_destination_name) ? { value: filters.core_destination_name, label: filters.core_destination_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, core_destination_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.core_destination_name}
                                    isClearable
                                />
                            </div>
                            <div className="col s3">
                                <Select
                                    placeholder="Search by Country"
                                    value={filterOptions.country_name.find(option => option.label === filters.country_name) ? { value: filters.country_name, label: filters.country_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, country_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.country_name}
                                    isClearable
                                />
                            </div>
                            <div className="col s3">
                                <Select
                                    placeholder="Search by Portfolio"
                                    value={filterOptions.portfolio_name.find(option => option.label === filters.portfolio_name) ? { value: filters.portfolio_name, label: filters.portfolio_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, portfolio_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.portfolio_name}
                                    isClearable
                                />
                            </div>
                            <div className="col s3">
                                <Select
                                    placeholder="Search by Property"
                                    value={filterOptions.property_name.find(option => option.label === filters.property_name) ? { value: filters.property_name, label: filters.property_name } : null}
                                    onChange={(selectedOption) => setFilters({ ...filters, property_name: selectedOption ? selectedOption.label : '' })}
                                    options={filterOptions.property_name}
                                    isClearable
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row center">
                        <div className="col s3">
                            <Select
                                placeholder="Search by Agency"
                                value={filterOptions.agency.find(option => option.label === filters.agency) ? { value: filters.agency, label: filters.agency } : null}
                                onChange={(selectedOption) => setFilters({ ...filters, agency: selectedOption ? selectedOption.label : '' })}
                                options={filterOptions.agency}
                                isClearable
                            />
                        </div>
                        <div className="col s3">
                            <Select
                                placeholder="Search by Booking Channel"
                                value={filterOptions.booking_channel.find(option => option.label === filters.booking_channel) ? { value: filters.booking_channel, label: filters.booking_channel } : null}
                                onChange={(selectedOption) => setFilters({ ...filters, booking_channel: selectedOption ? selectedOption.label : '' })}
                                options={filterOptions.booking_channel}
                                isClearable
                            />
                        </div>
                        <div className="col s6">
                            <div className="row">
                                <div className="col s6">
                                    <div>
                                        <ReactDatePicker
                                            selected={filters.start_date ? moment(filters.start_date).toDate() : null}
                                            onChange={(date) =>
                                                setFilters({ ...filters, start_date: date ? moment(date).format('YYYY-MM-DD') : '' })
                                            }
                                            isClearable
                                            placeholderText="mm/dd/yyyy"
                                            className="date-input"
                                            dateFormat="MM/dd/yyyy"
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }}>
                                        <span className="material-symbols-outlined">
                                            today
                                        </span>
                                        Start Date
                                    </span>
                                </div>
                                <div className="col s6">
                                    <div>
                                        <ReactDatePicker
                                            selected={filters.end_date ? moment(filters.end_date).toDate() : null}
                                            onChange={(date) =>
                                                setFilters({ ...filters, end_date: date ? moment(date).format('YYYY-MM-DD') : '' })
                                            }
                                            isClearable
                                            placeholderText="mm/dd/yyyy"
                                            className="date-input"
                                            dateFormat="MM/dd/yyyy"
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.8rem' }}>
                                        <span className="material-symbols-outlined">
                                            event
                                        </span>
                                        End Date
                                    </span>
                                </div>

                                {/* <input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={
                                        (e) => setFilters({ ...filters, start_date: e.target.value })}
                                    className="date-input"
                                    placeholder="Start Date"
                                />
                                <button
                                    className="btn btn-small deep-orange lighten-2"
                                    onClick={
                                        (e) => setFilters({ ...filters, start_date: '' })}
                                >x</button>
                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={
                                        (e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="date-input"
                                    placeholder="End Date"
                                />
                                <button
                                    className="btn btn-small deep-orange lighten-2"
                                    onClick={
                                        (e) => setFilters({ ...filters, end_date: '' })}
                                >x</button> */}
                            </div>
                        </div>
                    </div>

                    <div className="row center">
                        <div>
                            <button className="btn grey" onClick={() => setFilters(
                                { core_destination_name: '', portfolio_name: '', country_name: '', consultant_name: '', start_date: '', end_date: '' })}>
                                Reset Filters
                            </button>
                        </div>
                    </div>
                    {loaded ? (
                        <>
                            <br />
                            <ReportDashboard reportData={reportData} />
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
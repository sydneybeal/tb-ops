import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import ReportDashboard from './ReportDashboard';
// import moment from 'moment';

export const BedNightReports = () => {
    const [reportData, setReportData] = useState([]);
    const [accommodationLogData, setAccommodationLogData] = useState([]);
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

        fetch(apiUrl)
            .then((res) => res.json())
            .then((data) => {
                setReportData(data);
                console.log(data);
                fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`)
                    .then((res) => res.json())
                    .then((data) => {
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
    }, [filters]);

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
        // const coreDestOptions = [...new Set(accommodationLogData.map((item) => item.core_destination_name))].sort();
        // const countryOptions = [...new Set(accommodationLogData.map((item) => item.country_name))].sort();
        // const consultantOptions = [...new Set(accommodationLogData.map((item) => item.consultant_display_name))].sort();
        // const portfolioOptions = [...new Set(accommodationLogData.map((item) => item.property_portfolio))].sort();
        // const propertyOptions = [...new Set(accommodationLogData.map((item) => item.property_name))].sort();
        const portfolioMap = accommodationLogData.reduce((acc, item) => {
            const portfolioName = item.property_portfolio || 'No portfolio';
            if (!acc[portfolioName]) {
                acc[portfolioName] = {
                    value: portfolioName,
                    label: portfolioName,
                };
            }
            return acc;
        }, {});
        const agencyMap = accommodationLogData.reduce((acc, item) => {
            const agencyName = item.agency_name || 'No agency';
            if (!acc[agencyName]) {
                acc[agencyName] = {
                    value: agencyName,
                    label: agencyName,
                };
            }
            return acc;
        }, {});
        const bookingChannelMap = accommodationLogData.reduce((acc, item) => {
            const bookingChannelName = item.booking_channel_name || 'No booking channel';
            if (!acc[bookingChannelName]) {
                acc[bookingChannelName] = {
                    value: bookingChannelName,
                    label: bookingChannelName,
                };
            }
            return acc;
        }, {});
        const coreDestMap = accommodationLogData.reduce((acc, item) => {
            if (!acc[item.core_destination_id]) {
                acc[item.core_destination_id] = {
                    value: item.core_destination_id || '',
                    label: item.core_destination_name || ''
                };
            }
            return acc;
        }, {});
        // const countryOptions = [...new Set(apiData.map((item) => item.country_name))].sort();
        const countryMap = accommodationLogData.reduce((acc, item) => {
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
        // const consultantOptions = [...new Set(apiData.map((item) => item.consultant_display_name))].sort();
        const consultantMap = accommodationLogData.reduce((acc, item) => {
            if (!acc[item.consultant_id]) {
                acc[item.consultant_id] = {
                    value: item.consultant_id || '',
                    label: item.consultant_display_name || ''
                };
            }
            return acc;
        }, {});
        const propertyMap = accommodationLogData.reduce((acc, item) => {
            if (!acc[item.property_id]) {
                acc[item.property_id] = {
                    value: item.property_id || '',
                    label: item.property_name || ''
                };
            }
            return acc;
        }, {});
        const portfolioOptions = Object.values(portfolioMap).sort((a, b) => a.label.localeCompare(b.label));
        const agencyOptions = Object.values(agencyMap).sort((a, b) => a.label.localeCompare(b.label));
        const bookingChannelOptions = Object.values(bookingChannelMap).sort((a, b) => a.label.localeCompare(b.label)); const coreDestOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const consultantOptions = Object.values(consultantMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));


        // setFilterOptions({
        //     core_dest: coreDestOptions,
        //     country: countryOptions,
        //     consultant: consultantOptions,
        //     property: propertyOptions,
        // });
        setFilterOptions({
            core_destination_name: coreDestOptions,
            country_name: countryOptions,
            consultant_name: consultantOptions,
            portfolio_name: portfolioOptions,
            property_name: propertyOptions,
            agency: agencyOptions,
            booking_channel: bookingChannelOptions,
        });
    }, [accommodationLogData]);

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
                            <div className="date-selectors">
                                <input
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
                                >x</button>
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
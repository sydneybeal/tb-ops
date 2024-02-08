import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import ReportDashboard from './ReportDashboard';
import moment from 'moment';

export const BedNightReports = () => {
    const [reportData, setReportData] = useState([]);
    const [accommodationLogData, setAccommodationLogData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        core_destination_name: [],
        country_name: [],
        consultant_name: [],
        portfolio_name: [],
    });
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        core_destination_name: '',
        country_name: '',
        consultant_name: '',
        portfolio_name: '',
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
        const coreDestOptions = [...new Set(accommodationLogData.map((item) => item.core_destination_name))].sort();
        const countryOptions = [...new Set(accommodationLogData.map((item) => item.country_name))].sort();
        const consultantOptions = [...new Set(accommodationLogData.map((item) => item.consultant_display_name))].sort();
        const portfolioOptions = [...new Set(accommodationLogData.map((item) => item.property_portfolio))].sort();
        setFilterOptions({
            core_destination_name: coreDestOptions,
            country_name: countryOptions,
            consultant_name: consultantOptions,
            portfolio_name: portfolioOptions,
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
                                <select value={filters.core_destination_name} onChange={
                                    (e) => setFilters({ ...filters, core_destination_name: e.target.value })}>
                                    <option value="">Core Destination</option>
                                    {filterOptions.core_destination_name.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col s3">
                                <select value={filters.country_name} onChange={
                                    (e) => setFilters({ ...filters, country_name: e.target.value })}>
                                    <option value="">Country</option>
                                    {filterOptions.country_name.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col s3">
                                <select value={filters.consultant_name} onChange={
                                    (e) => setFilters({ ...filters, consultant_name: e.target.value })}>
                                    <option value="">Consultant</option>
                                    {filterOptions.consultant_name.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col s3">
                                <select value={filters.portfolio_name} onChange={
                                    (e) => setFilters({ ...filters, portfolio_name: e.target.value })}>
                                    <option value="">Portfolio</option>
                                    {filterOptions.portfolio_name.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="date-selectors">
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={
                                (e) => setFilters({ ...filters, start_date: e.target.value })}
                            className="date-input"
                            placeholder="Start Date"
                        />
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={
                                (e) => setFilters({ ...filters, end_date: e.target.value })}
                            className="date-input"
                            placeholder="End Date"
                        />
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
import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const Overview = () => {
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        core_dest: [],
        country: [],
        consultant: [],
    });
    const [filters, setFilters] = useState({
        core_dest: '',
        country: '',
        consultant: '',
    });

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`)
            .then((res) => res.json())
            .then((data) => {
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setError(true);
                console.error(err);
            });
    }, []);

    useEffect(() => {
        var elems = document.querySelectorAll('select');
        M.FormSelect.init(elems);
    }, [filters, filterOptions]);

    useEffect(() => {
        const coreDestOptions = [...new Set(displayData.map((item) => item.core_destination_name))].sort();
        const countryOptions = [...new Set(displayData.map((item) => item.country_name))].sort();
        const consultantOptions = [...new Set(displayData.map((item) => item.consultant_display_name))].sort();

        setFilterOptions({
            core_dest: coreDestOptions,
            country: countryOptions,
            consultant: consultantOptions,
        });
    }, [displayData]);

    useEffect(() => {
        let filteredData = apiData;

        if (filters.core_dest) {
            filteredData = filteredData.filter((item) => item.core_destination_name === filters.core_dest);
        }

        if (filters.country) {
            filteredData = filteredData.filter((item) => item.country_name === filters.country);
        }

        if (filters.consultant) {
            filteredData = filteredData.filter((item) => item.consultant_display_name === filters.consultant);
        }

        setDisplayData(filteredData);
    }, [apiData, filters]);

    return (
        <>
            <header>
                <Navbar title="Accommodation Logs" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '100%' }}>
                    {loaded ? (
                        <>
                            <div className="row center">
                                <div>
                                    <div className="col s4">
                                        <select value={filters.core_dest} onChange={
                                            (e) => setFilters({ ...filters, core_dest: e.target.value })}>
                                            <option value="">Core Destination</option>
                                            {filterOptions.core_dest.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col s4">
                                        <select value={filters.country} onChange={
                                            (e) => setFilters({ ...filters, country: e.target.value })}>
                                            <option value="">Country</option>
                                            {filterOptions.country.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col s4">
                                        <select value={filters.consultant} onChange={
                                            (e) => setFilters({ ...filters, consultant: e.target.value })}>
                                            <option value="">Consultant</option>
                                            {filterOptions.consultant.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="row center">
                                <div>
                                    <button className="btn grey" onClick={() => setFilters(
                                        { core_dest: '', country: '', consultant: '' })}>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Traveler</th>
                                        <th>Pax</th>
                                        <th>Date In</th>
                                        <th>Date Out</th>
                                        <th>Nights</th>
                                        <th>Consultant</th>
                                        <th className="center">Country</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(displayData) && displayData.length > 0 ? (
                                        displayData.map((item, index) => (
                                            <React.Fragment key={item.id}>
                                                <tr>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <p className="text-bold">{item.property_name}</p>
                                                        <div style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'left', marginTop: '8px' }}>
                                                            {item.property_portfolio}
                                                        </div>
                                                    </td>
                                                    <td>{item.primary_traveler}</td>
                                                    <td>{item.num_pax}</td>
                                                    <td>{moment(item.date_in).format("MMM D, YYYY")}</td>
                                                    <td>{moment(item.date_out).format("MMM D, YYYY")}</td>

                                                    <td><span className="chip grey lighten-1">{item.bed_nights}</span></td>
                                                    <td>
                                                        <div>
                                                            {item.consultant_display_name}
                                                            <div style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'left', marginTop: '8px' }}>
                                                                {moment(item.updated_at).fromNow()}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="center" style={{ verticalAlign: 'top' }}>
                                                        <p>{item.country_name}</p>
                                                        <span className="chip red lighten-3">{item.core_destination_name}</span>
                                                    </td>

                                                </tr>
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="100%" style={{ textAlign: 'center' }}>No results</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
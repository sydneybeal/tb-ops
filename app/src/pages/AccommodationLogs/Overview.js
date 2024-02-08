import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const Overview = () => {
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 100;
    const [totalPages, setTotalPages] = useState(0);
    const [sortedData, setSortedData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'date_in', ascending: false });
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

    /**
  * Sets sorting criteria.
  * @param {string} key - Field name to sort by.
  * @param {boolean} ascending - Sort order: true (ascending), false (descending).
  */
    function applySorting(key) {
        setSorting((prevSorting) => ({
            field: key,
            ascending: prevSorting.field === key ? !prevSorting.ascending : true,
        }));
    };

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`)
            .then((res) => res.json())
            .then((data) => {
                const numberOfPages = Math.ceil(data.length / itemsPerPage);
                setApiData(data);
                setTotalPages(numberOfPages);
                console.log(numberOfPages);
                setLoaded(true);
                setCurrentPage(0);
                setDisplayData(data.slice(0, itemsPerPage));
            })
            .catch((err) => {
                setError(true);
                console.error(err);
            });
    }, []);

    const changePage = (newPage) => {
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
        setCurrentPage(newPage);
    };

    useEffect(() => {
        var elems = document.querySelectorAll('select');
        M.FormSelect.init(elems);
    }, [filters, filterOptions]);

    useEffect(() => {
        const coreDestOptions = [...new Set(filteredData.map((item) => item.core_destination_name))].sort();
        const countryOptions = [...new Set(filteredData.map((item) => item.country_name))].sort();
        const consultantOptions = [...new Set(filteredData.map((item) => item.consultant_display_name))].sort();

        setFilterOptions({
            core_dest: coreDestOptions,
            country: countryOptions,
            consultant: consultantOptions,
        });
    }, [filteredData,]);

    useEffect(() => {
        M.AutoInit();
    }, [displayData]);

    useEffect(() => {
        let newFilteredData = apiData;

        if (filters.core_dest) {
            newFilteredData = newFilteredData.filter((item) => item.core_destination_name === filters.core_dest);
        }

        if (filters.country) {
            newFilteredData = newFilteredData.filter((item) => item.country_name === filters.country);
        }

        if (filters.consultant) {
            newFilteredData = newFilteredData.filter((item) => item.consultant_display_name === filters.consultant);
        }

        setFilteredData(newFilteredData);

    }, [apiData, filters]);

    useEffect(() => {
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
    }, [currentPage, sortedData, sorting]);

    useEffect(() => {
        // Perform sorting on filteredData
        let sortedAndFilteredData = [...filteredData].sort((a, b) => {
            let aValue = a[sorting.field] !== undefined && a[sorting.field] !== null ? a[sorting.field] : '';
            let bValue = b[sorting.field] !== undefined && b[sorting.field] !== null ? b[sorting.field] : '';

            // If both values are numbers, compare them as numbers.
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sorting.ascending ? aValue - bValue : bValue - aValue;
            }

            // If either value is not a number, convert both to strings and compare.
            // This handles null, undefined, and other non-number types safely.
            aValue = String(aValue);
            bValue = String(bValue);
            return sorting.ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });

        setSortedData(sortedAndFilteredData); // Update sortedData with sorted and filtered results

        const newTotalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);
        setTotalPages(newTotalPages);

        // Pagination logic
        if (currentPage >= newTotalPages) {
            setCurrentPage(0);
        }
        const displayStartIndex = currentPage * itemsPerPage;
        const displayEndIndex = displayStartIndex + itemsPerPage;
        setDisplayData(sortedAndFilteredData.slice(displayStartIndex, displayEndIndex));

    }, [filteredData, sorting, currentPage, itemsPerPage]);

    return (
        <>
            <header>
                <Navbar title="Accommodation Logs" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    {loaded ? (
                        <>
                            <div className="row center">
                                <div className="col s12">
                                    <ul className="pagination">
                                        <li className={currentPage === 0 ? 'disabled' : ''}>
                                            <a onClick={() => currentPage > 0 && changePage(currentPage - 1)} href="#!">
                                                <i className="material-icons">chevron_left</i>
                                            </a>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, idx) => (
                                            <li
                                                className={
                                                    `waves-effect waves-light ${currentPage === idx ? 'active red lighten-2' : ''
                                                    }`
                                                }
                                                key={idx}
                                                onClick={() => changePage(idx)}
                                            >
                                                <a className="teal-text text-lighten-4" href="#!">{idx + 1}</a>
                                            </li>
                                        ))}
                                        <li className={currentPage + 1 === totalPages ? 'disabled' : ''}>
                                            <a
                                                onClick={
                                                    () => currentPage + 1 < totalPages && changePage(currentPage + 1)}
                                                href="#!"
                                            >
                                                <i className="material-icons">chevron_right</i>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
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
                                        <th
                                            onClick={() =>
                                                applySorting('property_name')
                                            }
                                        >
                                            Property
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('primary_traveler')
                                            }
                                        >
                                            Traveler
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('num_pax')
                                            }
                                        >
                                            Pax
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('date_in')
                                            }
                                        >
                                            Date In
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('date_out')
                                            }
                                        >
                                            Date Out
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('bed_nights')
                                            }
                                        >
                                            Bed Nights
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('consultant_display_name')
                                            }
                                        >
                                            Consultant
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('country_name')
                                            }
                                        >
                                            Country
                                            <span className="material-symbols-outlined">
                                                swap_vert
                                            </span>
                                        </th>
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

                                                        </div>
                                                    </td>
                                                    <td className="center" style={{ verticalAlign: 'top' }}>
                                                        <p>{item.country_name}</p>
                                                        <span className="chip red lighten-3">{item.core_destination_name}</span>
                                                        <div style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'right', marginTop: '8px' }}>
                                                            {moment(item.updated_at).fromNow()}
                                                        </div>
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
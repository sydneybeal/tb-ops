import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import CircularPreloader from '../../components/CircularPreloader';
import AddLogModal from './AddLogModal';
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sorting, setSorting] = useState({ field: 'date_in', ascending: false });
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
                setLoaded(true);
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
        // const consultantOptions = [...new Set(apiData.map((item) => item.consultant_display_name))].sort();
        const consultantMap = apiData.reduce((acc, item) => {
            if (!acc[item.consultant_id]) {
                acc[item.consultant_id] = {
                    value: item.consultant_id || '',
                    label: item.consultant_display_name || ''
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
        // console.log("Core dest options: " + Object.values(coreDestOptions));
        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const consultantOptions = Object.values(consultantMap).sort((a, b) => a.label.localeCompare(b.label));
        const propertyOptions = Object.values(propertyMap).sort((a, b) => a.label.localeCompare(b.label));


        setFilterOptions({
            core_dest: coreDestOptions,
            country: countryOptions,
            consultant: consultantOptions,
            property: propertyOptions,
        });
    }, [apiData,]);

    useEffect(() => {
        M.AutoInit();
    }, [displayData]);

    useEffect(() => {
        let newFilteredData = apiData;

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

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            <header>
                <Navbar title="Accommodation Logs" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    <AddLogModal isOpen={isModalOpen} onClose={closeModal} />

                    {/* <button className="btn" onClick={openModal}>New</button> */}
                    <div className="row" style={{ textAlign: 'right' }}>
                        <a className="btn-float btn-large waves-effect waves-light green lighten-2" onClick={openModal}>
                            <span class="material-symbols-outlined">
                                add
                            </span>
                            Add New
                        </a>
                    </div>
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
                                                <a className="teal-text text-lighten-2" href="#!">{idx + 1}</a>
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
                                        {/* <select value={filters.core_dest} onChange={
                                            (e) => setFilters({ ...filters, core_dest: e.target.value })}>
                                            <option value="">Core Destination</option>
                                            {filterOptions.core_dest.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select> */}
                                        <Select
                                            placeholder="Search by Core Destination"
                                            value={filterOptions.core_dest.find(core_dest => core_dest.label === filters.core_dest) ? { value: filters.core_dest, label: filters.core_dest } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, core_dest: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.core_dest}
                                            isClearable
                                        />
                                        <span class="material-symbols-outlined">
                                            explore
                                        </span>
                                    </div>
                                    <div className="col s4">
                                        {/* <select value={filters.country} onChange={
                                            (e) => setFilters({ ...filters, country: e.target.value })}>
                                            <option value="">Country</option>
                                            {filterOptions.country.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select> */}
                                        <Select
                                            placeholder="Search by Country"
                                            value={filterOptions.country.find(country => country.label === filters.country) ? { value: filters.country, label: filters.country } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, country: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.country}
                                            isClearable
                                        />
                                        <span class="material-symbols-outlined">
                                            globe
                                        </span>
                                    </div>
                                    <div className="col s4">
                                        {/* <select value={filters.consultant} onChange={
                                            (e) => setFilters({ ...filters, consultant: e.target.value })}>
                                            <option value="">Consultant</option>
                                            {filterOptions.consultant.map((option, index) => (
                                                <option key={index} value={option}>{option}</option>
                                            ))}
                                        </select> */}
                                        <Select
                                            placeholder="Search by Consultant"
                                            value={filterOptions.consultant.find(consultant => consultant.label === filters.consultant) ? { value: filters.consultant, label: filters.consultant } : null}
                                            onChange={(selectedOption) => setFilters({ ...filters, consultant: selectedOption ? selectedOption.label : '' })}
                                            options={filterOptions.consultant}
                                            isClearable
                                        />
                                        <span class="material-symbols-outlined">
                                            badge
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="row center">
                                <div className="col s6">
                                    {/* <select value={filters.property} onChange={
                                        (e) => setFilters({ ...filters, property: e.target.value })}>
                                        <option value="">Property</option>
                                        {filterOptions.property.map((option, index) => (
                                            <option key={index} value={option}>{option}</option>
                                        ))}
                                    </select> */}
                                    <Select
                                        placeholder="Search by Property"
                                        value={filterOptions.property.find(prop => prop.label === filters.property) ? { value: filters.property, label: filters.property } : null}
                                        onChange={(selectedOption) => setFilters({ ...filters, property: selectedOption ? selectedOption.label : '' })}
                                        options={filterOptions.property}
                                        isClearable
                                    />
                                    <span class="material-symbols-outlined">
                                        hotel
                                    </span>
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
                                        { core_dest: '', country: '', consultant: '' })}>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                            <table className="accommodation-logs-table">
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
                                            <td colSpan="100%" style={{ textAlign: 'center' }}>No results.</td>
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
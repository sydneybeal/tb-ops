import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import Select from 'react-select';
import moment from 'moment';

export const Clients = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [showReservations, setShowReservations] = useState({});
    const [displayData, setDisplayData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortedData, setSortedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 100;
    const [totalPages, setTotalPages] = useState(0);
    const [sorting, setSorting] = useState({ field: 'display_name', ascending: true });
    const [loaded, setLoaded] = useState(false);
    const [filters, setFilters] = useState({
        state: '',
    });
    const [filterOptions, setFilterOptions] = useState({
        state: [],
    });

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/clients`, {
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
                console.log(JSON.stringify(data[0], null, 2));
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, logout]);

    useEffect(() => {
        const stateMap = Array.isArray(apiData) ? apiData.reduce((acc, item) => {
            if (item.address_state && !acc[item.address_state]) {
                acc[item.address_state] = {
                    value: item.address_state || 'no-state',
                    label: item.address_state || 'None'
                };
            }
            return acc;
        }, {}) : [];

        const stateOptions = Object.values(stateMap).sort((a, b) => a.label.localeCompare(b.label));


        setFilterOptions({
            state: stateOptions,
        });
    }, [apiData]);

    useEffect(() => {
        // Perform sorting on filteredData
        let sortedAndFilteredData = Array.isArray(apiData) ? [...filteredData].sort((a, b) => {
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
        }) : [];
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

    }, [sorting, apiData, currentPage, filteredData]);

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

    const changePage = (newPage) => {
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
        setCurrentPage(newPage);
    };

    function generatePageRange(current, total) {
        const sidePages = 10; // Pages to show on each side of the current page
        let start = Math.max(1, current - sidePages + 1);
        let end = Math.min(total, current + sidePages + 1);

        // Determine when to add ellipses
        const addEllipsisStart = start > 2;
        const addEllipsisEnd = end < total - 1;

        // Adjust the start and end if ellipses are being added
        if (addEllipsisStart) {
            start++;
        }
        if (addEllipsisEnd) {
            end--;
        }

        const range = [];

        // Construct the range of page numbers
        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        // Correctly add '1' and ellipses at the start of the range
        if (addEllipsisStart) {
            range.unshift(1, '...');
        } else if (start === 2) {
            range.unshift(1);
        }

        // Correctly add ellipses and the last page at the end of the range
        if (addEllipsisEnd) {
            range.push('...');
        }
        if (end <= total - 1) {
            range.push(total);
        }

        return range;
    }

    const normalizeString = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    useEffect(() => {
        let contextFilteredData = apiData;
        if (filters.state) {
            contextFilteredData = contextFilteredData.filter(item => item.address_state === filters.state);
        }
        let newFilteredData = contextFilteredData;
        if (searchQuery) {
            const normalizedSearchQuery = normalizeString(searchQuery);

            newFilteredData = newFilteredData.filter((item) =>
                (item.display_name ? normalizeString(item.display_name) : '').includes(normalizedSearchQuery) ||
                (item.referred_by_display_name ? normalizeString(item.referred_by_display_name) : '').includes(normalizedSearchQuery),
            );
        }

        setFilteredData(newFilteredData);

    }, [apiData, searchQuery, filters]);

    // Toggle the display of reservations for a given client
    const toggleReservations = (clientId) => {
        setShowReservations(prev => ({
            ...prev,
            [clientId]: !prev[clientId]
        }));
    };

    function formatAmount(amount) {
        if (amount === null || amount === undefined) return "0.00";
    
        // Convert the number to a float and format it with two decimal places and commas
        const formatted = parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
        });
    
        // Use a regular expression to remove unnecessary trailing zeroes but leave two if they are at the decimal point
        return formatted.replace(/(\.\d*?[1-9])0+$|\.00+$/, '$1');
    }

    return (
        <>
            <header>
                <Navbar title="Clients" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <div className="row center">
                                        <div className="col s12">
                                            <ul className="pagination">
                                                <li className={currentPage === 0 ? 'disabled' : ''}>
                                                    <a
                                                        onClick={(e) => { e.preventDefault(); currentPage > 0 && changePage(currentPage - 1); }}
                                                        href="#!"
                                                    >
                                                        <i className="material-icons">chevron_left</i>
                                                    </a>
                                                </li>
                                                {generatePageRange(currentPage, totalPages).map((page, index) => (
                                                    <li key={index} className={`waves-effect waves-light ${currentPage === page - 1 ? 'active tb-teal lighten-3' : ''}`}>
                                                        {page === '...' ? (
                                                            <span>...</span>
                                                        ) : (
                                                            <a className="tb-grey-text text-darken-1" onClick={(e) => { e.preventDefault(); changePage(page - 1); }} href="#!">{page}</a>
                                                        )}
                                                    </li>
                                                ))}
                                                <li className={currentPage + 1 === totalPages ? 'disabled' : ''}>
                                                    <a
                                                        onClick={(e) => { e.preventDefault(); currentPage + 1 < totalPages && changePage(currentPage + 1); }}
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
                                            <div className="col s12 l4">
                                                <Select
                                                    placeholder="State"
                                                    value={filterOptions.state.find(state => state.label === filters.state) ? { value: filters.state, label: filters.state } : null}
                                                    onChange={(selectedOption) => setFilters({ ...filters, state: selectedOption ? selectedOption.label : '' })}
                                                    options={filterOptions.state}
                                                    className={`select ${filters.state ? 'select--has-value' : ''}`}
                                                    classNamePrefix="select"
                                                    styles={{
                                                        control: (provided, state) => ({
                                                            ...provided,
                                                            borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Change 'pink' to your preferred border color
                                                            '&:hover': {
                                                                borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Adjust hover state as well
                                                            },
                                                            boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none', // Optional: Add a boxShadow for focus
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
                                                <span className="material-symbols-outlined tb-grey-text text-darken-1">
                                                    globe
                                                </span>
                                            </div>
                                            <div className="col s12 l4">
                                                <Select
                                                    placeholder="Referred By"
                                                    value={null}
                                                    // onChange={}
                                                    // options={}
                                                    // className={`select ${filters.core_destination ? 'select--has-value' : ''}`}
                                                    classNamePrefix="select"
                                                    styles={{
                                                        control: (provided, state) => ({
                                                            ...provided,
                                                            borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Change 'pink' to your preferred border color
                                                            '&:hover': {
                                                                borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Adjust hover state as well
                                                            },
                                                            boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none', // Optional: Add a boxShadow for focus
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
                                                <span className="material-symbols-outlined tb-grey-text text-darken-1">
                                                    group
                                                </span>
                                            </div>
                                            <div className="col s12 l4">
                                                <Select
                                                    placeholder="Core Destination"
                                                    value={null}
                                                    // onChange={}
                                                    // options={}
                                                    // className={`select ${filters.core_destination ? 'select--has-value' : ''}`}
                                                    classNamePrefix="select"
                                                    styles={{
                                                        control: (provided, state) => ({
                                                            ...provided,
                                                            borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Change 'pink' to your preferred border color
                                                            '&:hover': {
                                                                borderColor: state.isFocused ? '#0e9bac' : provided.borderColor, // Adjust hover state as well
                                                            },
                                                            boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none', // Optional: Add a boxShadow for focus
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
                                                <span className="material-symbols-outlined tb-grey-text text-darken-1">
                                                    travel_explore
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row center">
                                        <div className="input-field col s12 l6 offset-l3">
                                            <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                                search
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="search-input" // Apply any styling as needed
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <em className="tb-grey-text">
                                            <span className="text-bold tb-teal-text">{displayData?.length?.toLocaleString()}</span> clients
                                        </em>
                                    </div>
                                    <div className="container center" style={{ width: '100%' }}>
                                        <table className="accommodation-logs-table">
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th
                                                        onClick={() =>
                                                            applySorting('display_name')
                                                        }
                                                    >
                                                        Name
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('birth_date')
                                                        }
                                                    >
                                                        Age
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'birth_date' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('lifetime_spend')
                                                        }
                                                    >
                                                        Lifetime Spend
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'lifetime_spend' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('referred_by_display_name')
                                                        }
                                                    >
                                                        Referred By
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'referred_by_display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('reservations_count')
                                                        }
                                                    >
                                                        # Trips
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'reservations_count' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('referrals_count')
                                                        }
                                                    >
                                                        # Referrals
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'referrals_count' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('trips_plus_referrals')
                                                        }
                                                    >
                                                        Trips + Referrals
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'trips_plus_referrals' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('subjective_score')
                                                        }
                                                    >
                                                        Subjective Score
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'subjective_score' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(displayData) && displayData.length > 0 ? (
                                                    displayData.map((client, index) => (
                                                        <React.Fragment key={client.id}>
                                                            <tr>
                                                                <td>
                                                                    <p className="text-bold">{client.display_name}</p>
                                                                    <span className="chip tb-grey lighten-2">
                                                                        {client.address_city}, {client.address_state}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {client.birth_date ? moment().diff(moment(client.birth_date), 'years') : (
                                                                        <span className="chip tb-grey lighten-3 text-bold">?</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    ${formatAmount(client.lifetime_spend)}
                                                                </td>
                                                                <td>
                                                                    {client.referred_by_display_name}
                                                                </td>
                                                                <td>
                                                                    <span className="chip tb-teal lighten-2" onClick={() => toggleReservations(client.id)}>
                                                                        {client.reservations.length}
                                                                        <span className="material-symbols-outlined text-bold">expand_more</span>
                                                                    </span>
                                                                    {showReservations[client.id] && Array.isArray(client.reservations) && client.reservations.length > 0 && (
                                                                        <>
                                                                            <br />
                                                                            {client.reservations.sort((a, b) => {
                                                                                return moment(b.start_date).diff(moment(a.start_date));
                                                                            }).map((trip, index) => (
                                                                                <React.Fragment key={trip.id}>
                                                                                    <p>
                                                                                        <span className="text-bold">{moment(trip.start_date).format("MMM 'YY")}</span>
                                                                                        <span>- {trip.trip_name}</span>
                                                                                    </p>
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {client.referrals_count}
                                                                </td>
                                                                <td>
                                                                    {client.trips_plus_referrals}
                                                                </td>
                                                                <td>
                                                                    {client.subjective_score} / 100
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>No results.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <CircularPreloader show={true} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    )
}

export default Clients;
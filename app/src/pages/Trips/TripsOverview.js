import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const TripsOverview = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(100);
    const [refreshData, setRefreshData] = useState(false);
    const [sortedData, setSortedData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'updated_at', ascending: false });

    useEffect(() => {
        setLoaded(false);
        fetch(`${process.env.REACT_APP_API}/v1/trips`, {
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
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, refreshData, logout]);

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
        // Initialize tooltips
        const tooltipElems = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltipElems, {
            exitDelay: 50,
            enterDelay: 5,
            html: false,
            margin: 0,
            inDuration: 100,
            outDuration: 100,
            position: 'bottom',
            transitionMovement: 10
        });

        setTimeout(() => {
            document.querySelectorAll('.material-tooltip').forEach(tooltipElem => {
                const relatedTrigger = tooltipElems[Array.from(document.querySelectorAll('.tooltipped')).findIndex(elem => elem.getAttribute('data-tooltip-id') === tooltipElem.getAttribute('id'))];
                if (relatedTrigger) {
                    const customClass = relatedTrigger.getAttribute('data-tooltip-class');
                    if (customClass) {
                        tooltipElem.classList.add(customClass);
                    }
                }
            });
        }, 10);

        // Clean up function to destroy initialized tooltips to prevent memory leaks
        return () => {
            M.Tooltip.getInstance(tooltipElems)?.destroy();
        };
    }, [displayData]);

    const normalizeString = (str) => {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };
    
    useEffect(() => {
        let contextFilteredData = apiData;
        // Step 2: Now filter newFilteredData including property_names
        let newFilteredData = contextFilteredData;


        if (searchQuery) {
            const normalizedSearchQuery = normalizeString(searchQuery);

            newFilteredData = newFilteredData.filter((item) =>
                (item.trip_name ? normalizeString(item.trip_name) : '').includes(normalizedSearchQuery)
            );
        }

        setFilteredData(newFilteredData);

    }, [apiData, searchQuery]);

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

    }, [filteredData, sorting, currentPage, itemsPerPage, apiData]);

    useEffect(() => {
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
    }, [currentPage, sortedData, sorting, itemsPerPage]);

    function generatePageRange(current, total) {
        const sidePages = 5; // Pages to show on each side of the current page
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
    };

    const changePage = (newPage) => {
        if (newPage === currentPage) {
            return; // Do nothing if the page hasn't changed
        }
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
        setCurrentPage(newPage);
    };

    console.log(displayData[0]);
    
    return (
        <>
        <header>
            <Navbar title="Trips" />
        </header>
        <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
            <div className="container center">
                <h4>All Trips</h4>
                {loaded ? (
                    <>
                        <div className="row center">
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
                        {/* <div className="container center" style={{ width: '85%' }}> */}
                            <table className="accommodation-logs-table">
                                <thead>
                                    <tr className="tb-md-black-text text-bold">
                                        <th
                                            onClick={() =>
                                                applySorting('trip_name')
                                            }
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="Name of trip (Traveler x Pax, Destination, Month Year)"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Trip Name
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'trip_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('consultant_display_name')
                                            }
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="Travel Beyond consultant"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Consultant
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'consultant_display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('inquiry_date')
                                            }
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="First date of inquiry by client"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Inquiry Date
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'inquiry_date' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('start_date')
                                            }
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="First date of accommodation"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Start Date
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'start_date' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('core_destination')
                                            }
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="Core destination"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Core Destination
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'core_destination' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('updated_at')
                                            }
                                            style={{ width: '120px', textAlign: 'right' }}
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="Last updated"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                Updated
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'updated_at' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                </span>
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
                                                        <p
                                                            className="text-bold"
                                                            onClick={() => window.open(`/trip/${item.id}`, '_blank')} style={{ cursor: 'pointer' }}
                                                        >
                                                            {item.trip_name}
                                                        </p>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <p>{item.consultant_display_name}</p>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <p>
                                                            {moment(item.inquiry_date).isValid() ?
                                                                moment(item.inquiry_date).format('MMMM D, YYYY')
                                                                :
                                                                null
                                                            }
                                                        </p>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <p>{moment(item.start_date).format('MMMM D, YYYY')}</p>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <p>{item.core_destination}</p>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <div style={{ textAlign: 'right', padding: '0px', marginRight: '1px', marginLeft: '1px' }}>
                                                            <span
                                                                className={`tooltipped`}
                                                                data-position="left"
                                                                data-tooltip={`Updated ${moment.utc(item.updated_at).local().fromNow()} by ${item.updated_by === 'Initialization script' ? 'platform' : item.updated_by}`}
                                                                data-tooltip-class="tooltip-updated-by"
                                                            >
                                                                <button
                                                                    className="btn-floating btn-small waves-effect waves-light tb-teal darken-2"
                                                                    onClick={() => window.open(`/trip/${item.id}`, '_blank')} style={{ cursor: 'pointer' }}
                                                                >
                                                                    <span className="material-symbols-outlined tb-grey-text text-lighten-5" style={{ fontSize: '1.3rem', marginBottom: '0px', marginRight: '0px' }}>
                                                                    open_in_new
                                                                    </span>
                                                                </button>
                                                                <br />
                                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '0.75rem' }}>
                                                                    <span className="material-symbols-outlined">
                                                                        update
                                                                    </span>
                                                                    {moment.utc(item.updated_at).local().fromNow()}
                                                                </em>
                                                            </span>
                                                        </div>
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
                            {/* </div> */}
                    </>
                ) : (
                    <div>
                        <CircularPreloader show={true} />
                    </div>
                )}
            </div>
        </main>
        </>
    );
};

export default TripsOverview;
import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import EditReferralModal from './EditReferralModal';
import Select from 'react-select';
import moment from 'moment';

export const MatchReferrals = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sorting, setSorting] = useState({ field: 'display_name', ascending: true });
    const itemsPerPage = 100;
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        consultant: '',
    });
    const [filterOptions, setFilterOptions] = useState({
        consultant: [],
    });
    const [refreshData, setRefreshData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditClient, setCurrentEditClient] = useState(null);

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
                data.forEach(item => {
                    if (item.cb_primary_agent_name) {
                        item.cb_primary_agent_name = normalizeConsultantName(item.cb_primary_agent_name);
                    }
                });
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, logout]);

    useEffect(() => {
        const consultantMap = Array.isArray(apiData) ? apiData.reduce((acc, item) => {
            if (item.cb_primary_agent_name && !acc[item.cb_primary_agent_name]) {
                acc[item.cb_primary_agent_name] = {
                    value: item.cb_primary_agent_name || 'no-consultant',
                    label: item.cb_primary_agent_name || 'None'
                };
            }
            return acc;
        }, {}) : [];

        const consultantOptions = Object.values(consultantMap).sort((a, b) => a.label.localeCompare(b.label));


        setFilterOptions({
            consultant: consultantOptions,
        });
    }, [apiData]);

    const normalizeString = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const normalizeConsultantName = (str) => {
        return str
        .split(/[\s/]+/) // Split by space or slash
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()) // Convert each part to title case
        .join('/'); 
    };

    useEffect(() => {
        let contextFilteredData = apiData;
        if (filters.consultant) {
            contextFilteredData = contextFilteredData.filter(item => item.cb_primary_agent_name === filters.consultant);
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

    useEffect(() => {
        // Perform sorting on filteredData
        let sortedAndFilteredData = Array.isArray(filteredData) ? [...filteredData].sort((a, b) => {
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

        const newTotalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);
        setTotalPages(newTotalPages);

        // Pagination logic
        if (currentPage >= newTotalPages) {
            setCurrentPage(0);
        }
        const displayStartIndex = currentPage * itemsPerPage;
        const displayEndIndex = displayStartIndex + itemsPerPage;
        setDisplayData(sortedAndFilteredData.slice(displayStartIndex, displayEndIndex));

    }, [apiData, currentPage, filteredData]);

    const changePage = (newPage) => {
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(apiData.slice(start, end));
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

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentEditClient(null);
        document.body.style.overflow = '';
    };

    const openEditModal = (client) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding referrals.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditClient(client);
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <header>
                <Navbar title="Referral Matching" />
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
                                    <EditReferralModal
                                        isOpen={isModalOpen}
                                        onClose={closeModal}
                                        onRefresh={triggerRefresh}
                                        editClientData={currentEditClient}
                                    />
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
                                    <div className="row">
                                        <div className="input-field col s12 l4 offset-l2">
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
                                        <div className="col s12 l4">
                                            <Select
                                                placeholder="ClientBase Primary Agent"
                                                value={filterOptions.consultant.find(consultant => consultant.label === filters.consultant) ? { value: filters.consultant, label: filters.consultant } : null}
                                                onChange={(selectedOption) => setFilters({ ...filters, consultant: selectedOption ? selectedOption.label : '' })}
                                                options={filterOptions.consultant}
                                                className={`select ${filters.consultant ? 'select--has-value' : ''}`}
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
                                                    menuPortal: base => ({ ...base, zIndex: 9999 })
                                                }}
                                                menuPortalTarget={document.body}
                                                isClearable
                                            />
                                            <span className="material-symbols-outlined tb-grey-text text-darken-1">
                                                badge
                                            </span>
                                        </div>
                                    </div>
                                    <div className="container center" style={{ width: '70%' }}>
                                        {Array.isArray(displayData) && displayData.length > 0 ? (
                                            displayData.map((client, index) => (
                                                <>
                                                    <div className="card referral-match-card">
                                                        <div className="card-content">
                                                            <div className="row" style={{ marginBottom: '0px'}}>
                                                                <div className="col s6">
                                                                    <p><b>{client.cb_name}</b></p>
                                                                    <p>
                                                                    <span className="chip tb-grey lighten-2">
                                                                        {client.address_city}, {client.address_state}
                                                                    </span>
                                                                    </p>
                                                                    <p>Age: {client.birth_date ? moment().diff(moment(client.birth_date), 'years') : (
                                                                        <span className="chip tb-grey lighten-3 text-bold">?</span>
                                                                    )}</p>
                                                                    <p>Customer for: {client.cb_created_date ? moment().diff(moment(client.cb_created_date), 'years') : (
                                                                        <span className="chip tb-grey lighten-3 text-bold">?</span>
                                                                    )} years</p>
                                                                    <p>Total Trip Count: {client.reservations_count}</p>
                                                                    <p>ClientBase Agent: {client.cb_primary_agent_name}</p>
                                                                </div>
                                                                <div className="col s5">
                                                                    <div>
                                                                    {client.referred_by_id ?
                                                                        <>
                                                                        <p>Referred by: </p>
                                                                        <span className="tb-teal-text text-bold">
                                                                            {client.referred_by_last_name}/{client.referred_by_first_name}
                                                                        </span>
                                                                        </>
                                                                        :
                                                                        <>
                                                                            <span className="">
                                                                                <span className="material-symbols-outlined">
                                                                                    live_help
                                                                                </span>
                                                                            </span>
                                                                        </>
                                                                    }
                                                                    </div>
                                                                </div>
                                                                <div className="col s1">
                                                                    <button
                                                                        className="btn btn-small btn-floating tb-grey"
                                                                        onClick={() => openEditModal(client)}
                                                                    >
                                                                        <span className="material-symbols-outlined">
                                                                            edit
                                                                        </span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ))
                                        ) : (
                                            <p>No results.</p>
                                        )}
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

export default MatchReferrals;

import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditPortfolioModal from './AddEditModal';
import moment from 'moment';

export const Portfolios = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const { userDetails } = useAuth();
    const [displayData, setDisplayData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'name', ascending: true });
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const itemsPerPage = 50;
    const [totalPages, setTotalPages] = useState(0);
    const [refreshData, setRefreshData] = useState(false);
    const [sortedData, setSortedData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditPortfolio, setCurrentEditPortfolio] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1400);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1400);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/portfolios`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const numberOfPages = Math.ceil(data.length / itemsPerPage);
                setApiData(data);
                setTotalPages(numberOfPages);
                setLoaded(true);
                setCurrentPage(0);
                setDisplayData(data.slice(0, itemsPerPage));
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, refreshData]);

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

    useEffect(() => {
        let newFilteredData = apiData;

        if (searchQuery) {
            newFilteredData = newFilteredData.filter((item) =>
                (item.name ? item.name.toLowerCase() : '').includes(searchQuery.toLowerCase())
            );
        }

        setFilteredData(newFilteredData);

    }, [apiData, searchQuery]);

    useEffect(() => {
        // Initialize tooltips
        const tooltipElems = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltipElems, {
            exitDelay: 100,
            enterDelay: 10,
            html: false,
            margin: 0,
            inDuration: 300,
            outDuration: 250,
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
    }, [displayData, refreshData]);

    const openEditModal = (portfolio) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding portfolios.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditPortfolio(portfolio);
            setIsEditMode(true);
            setIsModalOpen(true);
        }
    };

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in above before adding portfolios.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentEditPortfolio(null);
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    return (
        <>
            <header>
                <Navbar title="Portfolio Management" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <AddEditPortfolioModal
                                        isOpen={isModalOpen}
                                        onClose={closeModal}
                                        onRefresh={triggerRefresh}
                                        editPortfolioData={currentEditPortfolio}
                                        isEditMode={isEditMode}
                                    />

                                    <div className="row center">
                                        <div className="col s10">
                                            <ul className="pagination">
                                                <li className={currentPage === 0 ? 'disabled' : ''}>
                                                    <a
                                                        onClick={(e) => { e.preventDefault(); currentPage > 0 && changePage(currentPage - 1); }}
                                                        href="#!"
                                                    >
                                                        <i className="material-icons">chevron_left</i>
                                                    </a>
                                                </li>
                                                {Array.from({ length: totalPages }, (_, idx) => (
                                                    <li
                                                        className={
                                                            `waves-effect waves-light ${currentPage === idx ? 'active tb-teal lighten-3' : ''
                                                            }`
                                                        }
                                                        key={idx}
                                                        onClick={() => changePage(idx)}
                                                    >
                                                        <a onClick={(e) => e.preventDefault()} className="tb-grey-text text-darken-1" href="#!">{idx + 1}</a>
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
                                        <div className="col s2">
                                            <button
                                                href=""
                                                className="btn-float btn-large waves-effect waves-light tb-teal darken-4"
                                                onClick={openModal}
                                            >
                                                <span className="material-symbols-outlined">
                                                    add
                                                </span>
                                                Add New
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row center">
                                        <div className="col s12 m6 offset-m3">
                                            <input
                                                type="text"
                                                placeholder="Search by text..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="search-input" // Apply any styling as needed
                                            />
                                            <span className="material-symbols-outlined tb-grey-text text-darken-1">
                                                search
                                            </span>
                                        </div>
                                    </div>
                                    <div className="row center">
                                        <div>
                                            <button className="btn tb-grey lighten-2" onClick={() => {
                                                setSearchQuery('');
                                            }}>
                                                Reset Filters
                                                <span className="material-symbols-outlined">
                                                    refresh
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="container center">
                                        <table className="accommodation-logs-table center">
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th
                                                        onClick={() =>
                                                            applySorting('name')
                                                        }
                                                    >
                                                        Name
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('num_related_properties')
                                                        }
                                                    >
                                                        {/* Dates */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Number of Related Properties"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                tag
                                                            </span>
                                                            <span className="material-symbols-outlined">
                                                                hotel
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'num_related_properties' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                            </span>
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('num_related')
                                                        }
                                                    >
                                                        {/* Dates */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Number of Related Entries"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                tag
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'num_related' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                            </span>
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('updated_at')
                                                        }
                                                        style={{ width: '200px', textAlign: 'right' }}
                                                    >
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Last updated"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined tb-md-black-text text-bold">
                                                                update
                                                            </span>
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
                                                                    <p className="text-bold">{item.name}</p>
                                                                </td>
                                                                <td><span className="chip tb-grey lighten-2">{item.num_related_properties}</span></td>
                                                                <td><span className="chip tb-teal lighten-3">{item.num_related}</span></td>
                                                                <td style={{ width: '200px' }}>
                                                                    <div style={{ textAlign: 'right', padding: '0px' }}>
                                                                        <span
                                                                            className={`tooltipped`}
                                                                            data-position="left"
                                                                            data-tooltip={`Updated ${moment.utc(item.updated_at).local().fromNow()} by ${item.updated_by === 'Initialization script' ? 'platform' : item.updated_by}`}
                                                                            data-tooltip-class="tooltip-updated-by"
                                                                        >
                                                                            <button
                                                                                className="btn-floating btn-small waves-effect waves-light warning-yellow-light"
                                                                                onClick={() => openEditModal(item)}
                                                                            >
                                                                                <span className="material-symbols-outlined grey-text text-darken-3" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                                                                    edit_note
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
                                                        <td colSpan="4" style={{ textAlign: 'center' }}>No results.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        {isMobileView && (
                                            <div className="mobile-friendly-table">
                                                {Array.isArray(displayData) && displayData.length > 0 && displayData.map((item) => (
                                                    <div key={item.id} className="card tb-grey lighten-6" style={{ borderRadius: '6px' }}>
                                                        <div className="card-content">
                                                            <div className="row" style={{ textAlign: 'left', marginBottom: '0px' }}>
                                                                <div className="col s10">
                                                                    <div><i className="material-symbols-outlined tb-teal-text text-bold">contact_mail</i><span className="text-bold">{item.name}</span></div>
                                                                </div>
                                                                <div className="col s2">
                                                                    <button onClick={() => openEditModal(item)} className="btn-floating btn-small waves-effect waves-light warning-yellow-light right">
                                                                        <i className="material-icons grey-text text-darken-3">edit_note</i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="card-footer">
                                                            <div className="row">
                                                                <div className="col s12" style={{ textAlign: 'right' }}>
                                                                    <i className="material-symbols-outlined tb-teal-text text-bold">update</i>
                                                                    <em className="tb-grey-text text-lighten-2"> Last Updated: {moment.utc(item.updated_at).local().fromNow()}</em>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div >
                                                ))}
                                            </div >
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

export default Portfolios;
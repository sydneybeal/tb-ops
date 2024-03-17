import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditPropertyModal from './AddEditModal';
import moment from 'moment';

export const Properties = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [refreshData, setRefreshData] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 100;
    const [totalPages, setTotalPages] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditProperty, setCurrentEditProperty] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [sortedData, setSortedData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'name', ascending: true });
    const [filterOptions, setFilterOptions] = useState({
        core_dest: [],
        country: [],
        portfolio: [],
    });
    const [filters, setFilters] = useState({
        core_dest: '',
        country: '',
        portfolio: '',
    });

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
        fetch(`${process.env.REACT_APP_API}/v1/properties`, {
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

    useEffect(() => {
        M.AutoInit();
    }, [displayData]);

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

    const openEditModal = (property) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditProperty(property); // Set the data for the log to be edited
            setIsEditMode(true);       // Indicate that we're in edit mode
            setIsModalOpen(true);      // Open the modal
        }
    };

    useEffect(() => {
        var elems = document.querySelectorAll('select');
        M.FormSelect.init(elems);
    }, [filters, filterOptions]);

    useEffect(() => {
        const countryMap = apiData.reduce((acc, item) => {
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
        const coreDestMap = apiData.reduce((acc, item) => {
            if (!acc[item.core_destination_id]) {
                acc[item.core_destination_id] = {
                    value: item.core_destination_id || '',
                    label: item.core_destination_name || ''
                };
            }
            return acc;
        }, {});
        const portfolioMap = apiData.reduce((acc, item) => {
            if (!acc[item.portfolio_name]) {
                acc[item.portfolio_name] = {
                    value: item.portfolio_name || '',
                    label: item.portfolio_name || ''
                };
            }
            return acc;
        }, {});

        const countryOptions = Object.values(countryMap).sort((a, b) => a.label.localeCompare(b.label));
        const coreDestinationOptions = Object.values(coreDestMap).sort((a, b) => a.label.localeCompare(b.label));
        const portfolioOptions = Object.values(portfolioMap).sort((a, b) => a.label.localeCompare(b.label));


        setFilterOptions({
            country: countryOptions,
            core_destination: coreDestinationOptions,
            portfolio: portfolioOptions,
        });
    }, [apiData,]);

    useEffect(() => {
        let newFilteredData = apiData;

        if (searchQuery) {
            newFilteredData = newFilteredData.filter((item) =>
                (item.name ? item.name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.portfolio_name ? item.portfolio_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.country_name ? item.country_name.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
                (item.core_destination_name ? item.core_destination_name.toLowerCase() : '').includes(searchQuery.toLowerCase()),
            );
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

        if (filters.core_destination) {
            newFilteredData = newFilteredData.filter((item) => item.core_destination_name === filters.core_destination);
        }

        if (filters.portfolio) {
            newFilteredData = newFilteredData.filter((item) => item.portfolio_name === filters.portfolio);
        }

        setFilteredData(newFilteredData);

    }, [apiData, filters, searchQuery]);

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

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please enter your name above before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        }
        setIsModalOpen(true);
    };

    useEffect(() => {
        // Initialize tooltips
        const tooltipElems = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltipElems, {
            exitDelay: 100,
            enterDelay: 100,
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
    }, [displayData]);

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentEditProperty(null);
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    return (
        <>
            <header>
                <Navbar title="Property Management" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            <AddEditPropertyModal
                                isOpen={isModalOpen}
                                onClose={closeModal}
                                onRefresh={triggerRefresh}
                                editPropertyData={currentEditProperty}
                                isEditMode={isEditMode}
                            />
                            {loaded ? (
                                <>
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
                                        <div>
                                            <div className="col s12 l4">
                                                <Select
                                                    placeholder="Search by Core Destination"
                                                    value={filterOptions.core_destination.find(core_dest => core_dest.label === filters.core_destination) ? { value: filters.core_destination, label: filters.core_destination } : null}
                                                    onChange={(selectedOption) => setFilters({ ...filters, core_destination: selectedOption ? selectedOption.label : '' })}
                                                    options={filterOptions.core_destination}
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
                                                    explore
                                                </span>
                                            </div>
                                            {/* TODO: change filters to drill down on other selections*/}
                                            <div className="col s12 l4">
                                                <Select
                                                    placeholder="Search by Country"
                                                    value={filterOptions.country.find(country => country.label === filters.country) ? { value: filters.country, label: filters.country } : null}
                                                    onChange={(selectedOption) => setFilters({ ...filters, country: selectedOption ? selectedOption.label : '' })}
                                                    options={filterOptions.country}
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
                                                    placeholder="Search by Portfolio"
                                                    value={filterOptions.portfolio.find(portfolio => portfolio.label === filters.portfolio) ? { value: filters.portfolio, label: filters.portfolio } : null}
                                                    onChange={(selectedOption) => setFilters({ ...filters, portfolio: selectedOption ? selectedOption.label : '' })}
                                                    options={filterOptions.portfolio}
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
                                                    store
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row center">
                                        <div className="col s12 l6 offset-l3">
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
                                                setFilters({ core_destination: '', country: '', portfolio: '' });
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
                                        <table className="accommodation-logs-table">
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th
                                                        onClick={() =>
                                                            applySorting('name')
                                                        }
                                                    >
                                                        {/* Property */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Property"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                hotel
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                            </span>
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('portfolio_name')
                                                        }
                                                    >
                                                        {/* Portfolio */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Portfolio Name"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                store
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'portfolio_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                            </span>
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('country_name')
                                                        }
                                                    >
                                                        {/* Country */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Country Name"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                globe
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'country_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                            </span>
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('core_destination_name')
                                                        }
                                                    >
                                                        {/* Dates */}
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Core Destination"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                explore
                                                            </span>
                                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                                {sorting.field === 'core_destination_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
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
                                                        style={{ width: '150px', textAlign: 'right' }}
                                                    >
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Last updated"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined">
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
                                                                <td>{item.portfolio_name}</td>
                                                                <td>{item.country_name}</td>
                                                                <td>{item.core_destination_name}</td>
                                                                <td><span className="chip tb-teal lighten-3">{item.num_related}</span></td>
                                                                <td style={{ width: '150px' }}>
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
                                                        <td colSpan="5" style={{ textAlign: 'center' }}>No results.</td>
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
                                                                    <div><i className="material-symbols-outlined tb-teal-text text-bold">hotel</i>
                                                                        <span className="text-bold">{item.name}</span>
                                                                    </div>
                                                                    <div><i className="material-symbols-outlined tb-teal-text text-bold">store</i>
                                                                        <span>{item.portfolio_name}</span>
                                                                    </div>
                                                                    <div><i className="material-symbols-outlined tb-teal-text text-bold">globe</i><span>{item.country_name && item.country_name.trim().toLowerCase() !== "n/a"
                                                                        ? item.country_name
                                                                        : <span>n/a</span>}</span></div>
                                                                    <div><span className="chip tb-teal lighten-2 text-bold">{item.core_destination_name}</span></div>
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

export default Properties;
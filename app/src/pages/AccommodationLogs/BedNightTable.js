import React, { useEffect, useState } from 'react';
import M from 'materialize-css';
import moment from 'moment';

const BedNightTable = ({ id = "bedNightTable", filteredData, openEditModal, handleSelectionChange, bulkSelectedEntries, isEditable, pageSize = 100, forReport = false }) => {
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'updated_at', ascending: false });
    const [sortedData, setSortedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = pageSize;

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1100);

    useEffect(() => {
        M.AutoInit();
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setDisplayData(filteredData.slice(0, itemsPerPage));
        const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
        setTotalPages(numberOfPages);
        setCurrentPage(0);
    }, [filteredData, itemsPerPage]);

    useEffect(() => {
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
    }, [currentPage, sortedData, sorting, itemsPerPage]);

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
    }, [displayData, displayData]);

    const changePage = (newPage) => {
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(sortedData.slice(start, end));
        setCurrentPage(newPage);
    };

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

    return (
        <>
            {!forReport &&
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
            }

            <table className="accommodation-logs-table" id={id}>
                <thead>
                    <tr>
                        <th
                            onClick={() =>
                                applySorting('property_name')
                            }
                            style={{ maxWidth: '120px' }}
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Property & Portfolio"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    hotel
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'property_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('primary_traveler')
                            }
                        >
                            {/* Traveler */}
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Primary Traveler & Number of Passengers"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    person
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'primary_traveler' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('date_in')
                            }
                            style={{ width: '100px' }}
                            className="center"
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Date Range"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    date_range
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'date_in' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('bed_nights')
                            }
                            style={{ width: '40px' }}
                            className="center"
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Bed Nights"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    dark_mode
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'bed_nights' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('consultant_display_name')
                            }
                            className="center"
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Travel Beyond Consultant"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    badge
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'consultant_display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('booking_channel_name')
                            }
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Booking Channel"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    alt_route
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'booking_channel_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('agency_name')
                            }
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Agency"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    contact_mail
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'agency_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('country_name')
                            }
                            className="center"
                        >
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Country/Core Destination"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    explore
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'country_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        {!forReport &&
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
                                    <span className="material-symbols-outlined tb-md-black-text text-bold">
                                        update
                                    </span>
                                    <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                        {sorting.field === 'updated_at' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                    </span>
                                </span>
                            </th>
                        }
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(displayData) && displayData.length > 0 ? (
                        displayData.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <tr>
                                    <td style={{ verticalAlign: 'top', maxWidth: '120px' }}>
                                        <p className="text-bold">{item.property_name}</p>
                                        <div style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'left', marginTop: '8px' }}>
                                            {item.property_portfolio}
                                        </div>
                                    </td>
                                    <td>
                                        <p>{item.primary_traveler}</p>
                                        <span className="chip tb-teal lighten-3" style={{ maxWidth: '100%', whiteSpace: 'nowrap', display: 'inline-block', overflow: 'hidden' }}>
                                            <span
                                                className="material-symbols-outlined tb-md-black-text"
                                                style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}
                                            >
                                                airline_seat_recline_extra
                                            </span>
                                            {item.num_pax}
                                        </span>
                                    </td>
                                    {/* <td style={{ width: '60px' }}>{item.num_pax}</td> */}
                                    <td style={{ width: '100px' }}>
                                        <span className="chip tb-grey lighten-2 text-bold">
                                            {moment(item.date_in).format("M/D/YY")}
                                        </span>
                                        <span className="chip tb-grey lighten-2 text-bold">
                                            {moment(item.date_out).format("M/D/YY")}
                                        </span>
                                    </td>
                                    <td
                                        className="center"
                                        style={{ width: '40px' }}
                                    >
                                        {item.bed_nights}
                                    </td>
                                    <td
                                        style={{ padding: '10px 0px 10px 0px', maxWidth: '100%', whiteSpace: 'nowrap', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        <div>
                                            {item.consultant_display_name}
                                        </div>
                                    </td>
                                    {/* <td style={{ margin: '10px 0px 10px 0px', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'top' }}> */}
                                    <td style={{ verticalAlign: 'top' }}>
                                        <p>
                                            {!item.booking_channel_name
                                                ? <span className="chip tb-grey lighten-2 text-bold">
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                </span>
                                                : item.booking_channel_name}
                                        </p>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <p>
                                            {!item.agency_name
                                                ? <span className="chip tb-grey lighten-2 text-bold">
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                </span>
                                                : item.agency_name}
                                        </p>
                                    </td>
                                    <td className="center" style={{ verticalAlign: 'top' }}>
                                        <p>{item.country_name}</p>
                                        <span className="chip tb-teal lighten-3 text-bold" style={{
                                            padding: '0px 6px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            minWidth: '60px',
                                        }}>
                                            {item.core_destination_name}
                                        </span>
                                        <br />
                                    </td>
                                    {!forReport &&
                                        <td style={{ width: '90px', marginRight: '1px', marginLeft: '1px' }}>
                                            <div style={{ textAlign: 'right', padding: '0px', marginRight: '1px', marginLeft: '1px' }}>
                                                <span
                                                    className={`tooltipped`}
                                                    data-position="left"
                                                    data-tooltip={`Updated ${moment.utc(item.updated_at).local().fromNow()} by ${item.updated_by === 'Initialization script' ? 'platform' : item.updated_by}`}
                                                    data-tooltip-class="tooltip-updated-by"
                                                >
                                                    {isEditable && (
                                                        <>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
                                                                <button
                                                                    className="btn-floating btn-small waves-effect waves-light tb-grey lighten-2"
                                                                    onClick={() => openEditModal(item)}
                                                                >
                                                                    <span className="material-symbols-outlined grey-text text-darken-4" style={{ fontSize: '1.3rem', marginBottom: '0px', marginRight: '0px' }}>
                                                                        edit
                                                                    </span>
                                                                </button>
                                                                <label className="tb-checkbox-label" style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="tb-checkbox"
                                                                        checked={!!bulkSelectedEntries?.has(item.id)}
                                                                        onChange={(e) => handleSelectionChange(
                                                                            item, e.target.checked)}
                                                                    />
                                                                    <span></span>
                                                                </label>
                                                            </div>
                                                            <br />
                                                        </>
                                                    )}
                                                    <em className="tb-grey-text text-darken-1" style={{ fontSize: '0.75rem' }}>
                                                        <span className="material-symbols-outlined">
                                                            update
                                                        </span>
                                                        {moment.utc(item.updated_at).local().fromNow()}
                                                    </em>
                                                </span>
                                            </div>
                                        </td>
                                    }
                                </tr>

                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: 'center' }}>No results.</td>
                        </tr>
                    )}
                </tbody>
            </table >
            {isMobileView && (
                <div className="mobile-friendly-table">
                    {Array.isArray(displayData) && displayData.length > 0 && displayData.map((item) => (
                        <div key={item.id} className="card tb-grey lighten-6" style={{ borderRadius: '6px' }}>
                            <div className="card-content">

                                {isEditable && (
                                    <div className="row" style={{ margin: '0px' }}>
                                        <div className="col s12">
                                            <button onClick={() => openEditModal(item)} className="btn-floating btn-small waves-effect waves-light warning-yellow-light right">
                                                <i className="material-icons grey-text text-darken-3">edit_note</i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="row" style={{ textAlign: 'left', marginBottom: '0px' }}>
                                    <div className="col s7">
                                        <div>
                                            <i className="material-symbols-outlined tb-teal-text text-bold">person</i>
                                            <span className="text-bold">{item.primary_traveler} </span>
                                            <span className="chip tb-teal lighten-3 text-bold">
                                                <span
                                                    className="material-symbols-outlined tb-md-black-text"
                                                    style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}
                                                >
                                                    airline_seat_recline_extra
                                                </span>
                                                {item.num_pax}
                                            </span>
                                        </div>
                                        {/* <div><i className="material-symbols-outlined tb-teal-text text-bold">airline_seat_recline_extra</i>{item.num_pax}</div> */}
                                        <div>
                                            <span className="material-symbols-outlined tb-teal-text text-bold">
                                                date_range
                                            </span>
                                            <span className="chip tb-grey lighten-2 text-bold">{moment(item.date_in).format("M/D/YY")}</span>
                                            <span>to </span>
                                            <span className="chip tb-grey lighten-2 text-bold">{moment(item.date_out).format("M/D/YY")} </span>
                                            <span className="chip tb-teal lighten-3 text-bold">
                                                <span
                                                    className="material-symbols-outlined tb-md-black-text text-bold"
                                                    style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}
                                                >
                                                    dark_mode
                                                </span>
                                                {item.bed_nights}
                                            </span>
                                        </div>
                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">hotel</i><span>{item.property_name}</span></div>
                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">store</i><span>{item.property_portfolio}</span></div>

                                    </div>

                                    <div className="col s5">

                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">globe</i><span>{item.country_name && item.country_name.trim().toLowerCase() !== "n/a"
                                            ? <span>{item.country_name} </span>
                                            : <span>n/a </span>}</span>
                                            <span className="chip tb-teal lighten-2 text-bold">{item.core_destination_name}</span></div>
                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">badge</i>&nbsp;Consultant:&nbsp;
                                            <span
                                                className="chip tb-grey lighten-2 text-bold"
                                                style={{
                                                    padding: '0px 12px',
                                                    whiteSpace: 'nowrap',
                                                    // overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minWidth: '60px',
                                                }}
                                            >
                                                {item.consultant_display_name}
                                            </span>
                                        </div>
                                        <div>
                                            <i
                                                className="material-symbols-outlined tb-teal-text text-bold"
                                            >alt_route
                                            </i>
                                            &nbsp;Booking Channel:&nbsp;
                                            <span
                                                className="chip tb-grey lighten-2 text-bold"
                                                style={{
                                                    padding: '0px 6px',
                                                    whiteSpace: 'nowrap',
                                                    // overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    // minWidth: '60px',
                                                }}
                                            >
                                                {!item.booking_channel_name
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : item.booking_channel_name}
                                            </span>
                                        </div>
                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">contact_mail</i>&nbsp;Agency:&nbsp;
                                            <span
                                                className="chip tb-grey lighten-2 text-bold"
                                                style={{
                                                    padding: '0px 6px',
                                                    whiteSpace: 'nowrap',
                                                    // overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    // minWidth: '60px',
                                                }}
                                            >
                                                {!item.agency_name
                                                    ?
                                                    <span className="material-symbols-outlined">
                                                        live_help
                                                    </span>
                                                    : item.agency_name}
                                            </span>

                                        </div>
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
            )
            }
        </>
    );
};

export default BedNightTable;


import React, { useEffect, useState } from 'react';
import M from 'materialize-css';
import moment from 'moment';

const BedNightTable = ({ filteredData, openEditModal, isEditable, pageSize = 100 }) => {
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'updated_at', ascending: false });
    const [sortedData, setSortedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const itemsPerPage = pageSize;

    useEffect(() => {
        setDisplayData(filteredData.slice(0, itemsPerPage));
        const numberOfPages = Math.ceil(filteredData.length / itemsPerPage);
        setTotalPages(numberOfPages);
        setCurrentPage(0);
    }, [filteredData]);

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
    }, [displayData]);

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

                {/* {Array.from({ length: totalPages }, (_, idx) => (
                        <li
                            className={
                                `waves-effect waves-light ${currentPage === idx ? 'active tb-teal lighten-3' : ''
                                }`
                            }
                            key={idx}
                            onClick={() => changePage(idx)}
                        >
                            <a className="tb-grey-text text-darken-1" onClick={(e) => e.preventDefault()} href="#!">{idx + 1}</a>
                        </li>
                    ))} */}
            </div>

            <table className="accommodation-logs-table">
                <thead>
                    <tr>
                        <th
                            onClick={() =>
                                applySorting('property_name')
                            }
                            style={{ width: '140px' }}
                        >
                            {/* <span className="material-symbols-outlined">
                                                hotel
                                            </span> */}
                            {/* Property */}
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
                                data-tooltip="Primary Traveler Name"
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
                                applySorting('num_pax')
                            }
                            style={{ width: '60px' }}
                        >
                            {/* Pax */}
                            <span
                                className={`tooltipped`}
                                data-position="bottom"
                                data-tooltip="Number of Passengers"
                                data-tooltip-class="tooltip-light"
                            >
                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                    airline_seat_recline_extra
                                </span>
                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                    {sorting.field === 'num_pax' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                </span>
                            </span>
                        </th>
                        <th
                            onClick={() =>
                                applySorting('date_in')
                            }
                            style={{ width: '100px' }}
                            className="center"
                        // style={{ width: '200px' }}
                        >
                            {/* Dates */}
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
                            style={{ width: '60px' }}
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
                        >
                            {/* Consultant */}
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
                            {/* Booking Channel */}
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
                            {/* Agency Name */}
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
                            {/* Country */}
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
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(displayData) && displayData.length > 0 ? (
                        displayData.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <tr>
                                    <td style={{ verticalAlign: 'top', width: '140px' }}>
                                        <p className="text-bold">{item.property_name}</p>
                                        <div style={{ fontStyle: 'italic', color: 'grey', fontSize: 'smaller', textAlign: 'left', marginTop: '8px' }}>
                                            {item.property_portfolio}
                                        </div>
                                    </td>
                                    <td>{item.primary_traveler}</td>
                                    <td style={{ width: '60px' }}>{item.num_pax}</td>
                                    <td style={{ width: '100px' }}>
                                        <span className="chip tb-grey lighten-3 text-bold">
                                            {moment(item.date_in).format("M/D/YY")}
                                        </span>
                                        <span className="chip tb-grey lighten-3 text-bold">
                                            {moment(item.date_out).format("M/D/YY")}
                                        </span>
                                    </td>
                                    <td className="center" style={{ width: '60px' }}>
                                        {/* <span className="chip blue lighten-3"> */}
                                        {item.bed_nights}
                                        {/* </span> */}
                                    </td>
                                    <td>
                                        <div>
                                            {item.consultant_display_name}
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <p>
                                            {item.booking_channel_name && item.booking_channel_name.trim().toLowerCase() !== "n/a"
                                                ? item.booking_channel_name
                                                : <span className="chip tb-grey lighten-3">n/a</span>}
                                        </p>
                                    </td>
                                    <td style={{ verticalAlign: 'top' }}>
                                        <p>
                                            {item.agency_name && item.agency_name.trim().toLowerCase() !== "n/a"
                                                ? item.agency_name
                                                : <span className="chip tb-grey lighten-3">n/a</span>}
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
                                    <td>
                                        <div style={{ width: '100px', textAlign: 'right', padding: '0px' }}>
                                            <span
                                                className={`tooltipped`}
                                                data-position="left"
                                                data-tooltip={`Updated ${moment.utc(item.updated_at).local().fromNow()} by ${item.updated_by === 'Initialization script' ? 'platform' : item.updated_by}`}
                                                data-tooltip-class="tooltip-updated-by"
                                            >
                                                {isEditable && (
                                                    <>
                                                        <button
                                                            className="btn-floating btn-small waves-effect waves-light warning-yellow-light"
                                                            onClick={() => openEditModal(item)}
                                                        >
                                                            <span className="material-symbols-outlined grey-text text-darken-3" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                                                edit_note
                                                            </span>
                                                        </button>
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
                                </tr>

                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" style={{ textAlign: 'center' }}>No results.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
};

export default BedNightTable;


import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
// import Navbar from '../../components/Navbar';
// import moment from 'moment';

export const Trips = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(10);
    const [refreshData, setRefreshData] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    // const [activeTripId, setActiveTripId] = useState(null);
    const { userDetails } = useAuth();
    // const [displayData, setDisplayData] = useState([]);

    useEffect(() => {
        // Calculate the number of pages with the new data
        const numberOfPages = Math.ceil(apiData.length / itemsPerPage);
        setTotalPages(numberOfPages);
    
        // If the current page index is out of range after new data arrives, reset it to the last available page
        if (currentPage >= numberOfPages) {
            setCurrentPage(Math.max(0, numberOfPages - 1));
        }
    
        // Update displayData for the currentPage only if it's still within the new range
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(apiData.slice(start, end));
    }, [apiData, itemsPerPage, currentPage]);

    useEffect(() => {
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(apiData.slice(start, end));
    }, [currentPage, itemsPerPage, apiData]);

    useEffect(() => {
        // M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/trips`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, refreshData]);

    const handleRemoveTrip = (tripId) => {
        const confirmRemove = window.confirm("Are you sure you want to ungroup this trip?");
        if (confirmRemove) {
            fetch(`${process.env.REACT_APP_API}/v1/trips/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('API error');
                }
                return response.json();
            })
            .then(data => {
                console.log('Trip successfully removed:', data);
                M.toast({ html: 'Trip successfully deleted', classes: 'success-green' });
                setRefreshData(!refreshData);
            })
            .catch(error => {
                console.error('Error:', error);
                M.toast({
                    html: 'Trip deletion unsuccessful: ' + error,
                    displayLength: 4000,
                    classes: 'error-red',
                });
            });
        }
    };

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
        const start = newPage * itemsPerPage;
        const end = start + itemsPerPage;
        setDisplayData(displayData.slice(start, end));
        setCurrentPage(newPage);
    };

    

    return (
        <>
            {(userDetails.role !== 'admin') ? (
                <div>
                    You do not have permission to view this page.
                </div>
            ) : (
                <>
                    {loaded ? (
                        <>
                            <h4>All Trips</h4>
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
                            {/* <div className="container"> */}
                            {apiData.length ? (
                                    apiData.map(trip => (
                                        <div key={trip.id} className="card potential-trip-card">
                                            <div className="card-content">
                                                <span className="card-title">{trip.trip_name || "Unnamed Trip"}</span>
                                                <span className="chip green lighten-4">
                                                    <span className="material-symbols-outlined">
                                                        check_circle
                                                    </span>
                                                    validated
                                                </span>
                                                <button className="btn btn-floating btn-small error-red" onClick={() => handleRemoveTrip(trip.id)}>
                                                    x
                                                </button>
                                                <ul>
                                                    {trip.accommodation_logs.map(log => (
                                                        <li key={log.id}>
                                                            <SingleLogDisplay log={log} />
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No trips available.</p>
                                )}
                            {/* </div> */}
                        </>
                    ) : (
                        <div>
                            <CircularPreloader show={true} />
                        </div>
                    )}
                </>
            )}
        </>
    )
}

export default Trips;
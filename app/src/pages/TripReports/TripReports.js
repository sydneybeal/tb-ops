import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
// import Select from 'react-select';
// import ReactDatePicker from 'react-datepicker';
import { Link } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';
// import moment from 'moment';

export const TripReports = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(10);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const elems = document.querySelectorAll('.sidenav, .sidenav-overlay');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
        var overlay = document.querySelector('.sidenav-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }, []);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/trip_reports`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userDetails.token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const numberOfPages = Math.ceil(data.length / itemsPerPage);
                    setApiData(data);
                    setTotalPages(numberOfPages);
                    setCurrentPage(0);
                    setDisplayData(data.slice(0, itemsPerPage));
                } else {
                    console.error('Received data is not an array:', data);
                    setApiData([]);
                    setTotalPages(0);
                    setDisplayData([]);
                }
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, itemsPerPage]);

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
        setDisplayData(displayData.slice(start, end));
        setCurrentPage(newPage);
    };

    return (
        <>
            <header>
                <Navbar title="Trip Reports" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                    <div className="container center">
                        <div className="row center">
                            <div className="col s2 offset-s10">
                                <button
                                    href=""
                                    className="btn-float btn-large waves-effect waves-light tb-teal darken-4"
                                    onClick={() => window.open(`/trip_reports/new`, '_blank')} style={{ cursor: 'pointer' }}
                                >
                                    <span className="material-symbols-outlined">
                                        add
                                    </span>
                                    Add New
                                </button>
                            </div>
                        </div>
                    </div>
                    {loaded ? (
                        <>
                            <div className="row center">
                                <ul className="pagination">
                                    <li className={currentPage === 0 ? 'disabled' : ''} key='left-arrow'>
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
                                    <li className={currentPage + 1 === totalPages ? 'disabled' : ''} key='right-arrow'>
                                        <a
                                            onClick={(e) => { e.preventDefault(); currentPage + 1 < totalPages && changePage(currentPage + 1); }}
                                            href="#!"
                                        >
                                            <i className="material-icons">chevron_right</i>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="container" style={{ width: '80%'}}>
                                {displayData.length ? (
                                    displayData.map(report => (
                                        <div key={report.id} className="card potential-trip-card">
                                            <div className="card-content">
                                                <div className="row">
                                                    {report.review_status === 'final' ? (
                                                        <div className="chip success-green tb-off-white-text text-bold">
                                                            PUBLISHED
                                                        </div>
                                                    ) : (
                                                        <div className="chip warning-yellow tb-md-grey-text text-bold">
                                                            DRAFT
                                                        </div>
                                                    )
                                                    }
                                                    <Link to={`/trip_reports/edit/${report.id}`} className="btn btn-floating waves-effect waves-light warning-yellow tb-md-black-text">
                                                        <span class="material-symbols-outlined">
                                                            edit
                                                        </span>
                                                    </Link>
                                                </div>
                                                <span className="text-bold">Travelers: </span>
                                                {report.travelers.map(traveler => (
                                                    <span style={{ paddingLeft: '12px' }} key={traveler.id} className="chip tb-teal darken-3 tb-off-white-text">
                                                        <span style={{ fontSize: '1.1rem'}} >{traveler.email.split('@')[0]} </span>
                                                    </span>
                                                ))}
                                                {report.properties.map((segment, index) => (
                                                    <p key={`segment-${report.id}-${index}`}>{segment.property_details.name}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                    ) : (
                                        <p>No trips available for grouping.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: '20px' }}>
                            <CircularPreloader show={true} />
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default TripReports;
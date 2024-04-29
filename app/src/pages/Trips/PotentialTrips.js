import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
// import moment from 'moment';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
import ConfirmTripModal from './ConfirmTripModal';
import FlagTripModal from './FlagTripModal';

export const PotentialTrips = () => {
    const [apiData, setApiData] = useState([]);
    const [refreshData, setRefreshData] = useState(false);
    const [sortOption, setSortOption] = useState('latestTripsFirst');
    const [loaded, setLoaded] = useState(false);
    // const [activeTripId, setActiveTripId] = useState(null);
    const { userDetails, logout } = useAuth();
    const [progress, setProgress] = useState(null);
    const [displayData, setDisplayData] = useState([]);
    // const [currentPotentialTrip, setCurrentPotentialTrip] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

    const [selectedTrips, setSelectedTrips] = useState(new Set());

    // const handleToggleTrip = (tripId) => {
    //     const newSelection = new Set(selectedTrips);
    //     if (newSelection.has(tripId)) {
    //         newSelection.delete(tripId);
    //     } else {
    //         newSelection.add(tripId);
    //     }
    //     setSelectedTrips(newSelection);
    // };
    const handleToggleTrip = (trip) => {
        const newSelection = new Set(selectedTrips);
        const existingTrip = [...newSelection].find(t => t.id === trip.id);
        if (existingTrip) {
            newSelection.delete(existingTrip);
        } else {
            newSelection.add(trip);
        }
        setSelectedTrips(newSelection);
    };
    
    const addTripToSelection = (trip) => {
        const newSelection = new Set(selectedTrips);
        const existingTrip = [...newSelection].find(t => t.id === trip.id);
        if (!existingTrip) {
            newSelection.add(trip);
            setSelectedTrips(newSelection);
        }
    };

    useEffect(() => {
        let sortedData = [...apiData]; // Create a shallow copy to sort
        sortedData.forEach(trip => {
            // Count the total number of flags in each trip
            trip.totalFlags = trip.accommodation_logs.reduce((acc, log) => {
                return acc + (log.consultant_flag ? 1 : 0) + (log.num_pax_flag ? 1 : 0) +
                    (log.date_out_flag ? 1 : 0) + (log.date_in_flag ? 1 : 0) + (log.core_destination_flag ? 1 : 0);
            }, 0);
        });

        switch (sortOption) {
            case 'qualityIssuesFirst':
                sortedData.sort((a, b) => b.totalFlags - a.totalFlags);
                break;
            case 'latestTripsFirst':
                sortedData.sort((a, b) => new Date(b.accommodation_logs[0].date_in) - new Date(a.accommodation_logs[0].date_in));
                break;
            case 'oldestTripsFirst':
                sortedData.sort((a, b) => new Date(a.accommodation_logs[0].date_in) - new Date(b.accommodation_logs[0].date_in));
                break;
            case 'shortestTrips':
                sortedData.sort((a, b) => {
                    const aDuration = new Date(a.accommodation_logs[a.accommodation_logs.length - 1].date_out) - new Date(a.accommodation_logs[0].date_in);
                    const bDuration = new Date(b.accommodation_logs[b.accommodation_logs.length - 1].date_out) - new Date(b.accommodation_logs[0].date_in);
                    return aDuration - bDuration;
                });
                break;
            case 'longestTrips':
                sortedData.sort((a, b) => {
                    const aDuration = new Date(a.accommodation_logs[a.accommodation_logs.length - 1].date_out) - new Date(a.accommodation_logs[0].date_in);
                    const bDuration = new Date(b.accommodation_logs[b.accommodation_logs.length - 1].date_out) - new Date(b.accommodation_logs[0].date_in);
                    return bDuration - aDuration;
                });
                break;
            case 'flaggedTrips':
                // TODO change this to trips with flag_for_help true
                sortedData.sort((a, b) => b.totalFlags - a.totalFlags);
                break;
            default:
                break;
        }

        setDisplayData(sortedData);
    }, [sortOption, apiData]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/potential_trips`, {
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
                const validatedData = validateData(data);
                setApiData(validatedData);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
        
        fetch(`${process.env.REACT_APP_API}/v1/progress`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setProgress(data);
            })
    }, [refreshData, userDetails.token, logout]);

    function validateData(trips) {
        return trips.map(trip => {
            const logs = trip.accommodation_logs;
            const consultantCounts = {};
            const coreDestinationCounts = {};
            const numPaxCounts = {};

            // Count occurrences of each value
            logs.forEach(log => {
                consultantCounts[log.consultant_display_name] = (consultantCounts[log.consultant_display_name] || 0) + 1;
                coreDestinationCounts[log.core_destination_name] = (coreDestinationCounts[log.core_destination_name] || 0) + 1;
                numPaxCounts[log.num_pax] = (numPaxCounts[log.num_pax] || 0) + 1;
            });

            // Determine most common values
            const mostCommonConsultant = Object.keys(consultantCounts).reduce((a, b) => consultantCounts[a] > consultantCounts[b] ? a : b);
            const mostCommonDestination = Object.keys(coreDestinationCounts).reduce((a, b) => coreDestinationCounts[a] > coreDestinationCounts[b] ? a : b);
            const mostCommonNumPax = Object.keys(numPaxCounts).reduce((a, b) => numPaxCounts[a] > numPaxCounts[b] ? a : b);

            // Validate each log
            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];

                // Check for date overlap issues
                if (i < logs.length - 1) {
                    const nextLog = logs[i + 1];
                    if (new Date(log.date_out) > new Date(nextLog.date_in)) {
                        log.date_out_flag = true;
                        nextLog.date_in_flag = true;
                    }
                }

                // Check for mismatch in consultant, destination, and num_pax
                if (log.consultant_display_name !== mostCommonConsultant) {
                    log.consultant_flag = true;
                }
                if (log.core_destination_name !== mostCommonDestination) {
                    log.core_destination_flag = true;
                }
                const logNumPax = parseInt(log.num_pax, 10);  // Ensure it's an integer
                const commonNumPax = parseInt(mostCommonNumPax, 10);  // Ensure it's an integer
                if (logNumPax !== commonNumPax) {
                    log.num_pax_flag = true;
                }
            }

            return trip;
        });
    };

    // const openConfirmTripModal = (potentialTripData) => {
    //     if (!userDetails.email) {
    //         M.toast({
    //             html: 'Please log in before confirming trips.',
    //             displayLength: 2000,
    //             classes: 'error-red',
    //         });
    //         return;
    //     } else {
    //         setCurrentPotentialTrip(potentialTripData);
    //         setIsConfirmModalOpen(true);
    //     }
    // };

    const openConfirmTripModal = (trip) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before confirming trips.',
                displayLength: 2000,
                classes: 'error-red',
            });
            return;
        } else {
            addTripToSelection(trip); // Ensure this adds the trip object
            setIsConfirmModalOpen(true);
        }
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        // setCurrentPotentialTrip(null);
        setSelectedTrips(new Set());
        document.body.style.overflow = '';
    };

    
    // const openFlagTripModal = (potentialTripData) => {
    //     if (!userDetails.email) {
    //         M.toast({
    //             html: 'Please log in before confirming trips.',
    //             displayLength: 2000,
    //             classes: 'error-red',
    //         });
    //         return;
    //     } else {
    //         setCurrentPotentialTrip(potentialTripData);
    //         setIsFlagModalOpen(true);
    //     }
    // };

    const openFlagTripModal = (trip) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before confirming trips.',
                displayLength: 2000,
                classes: 'error-red',
            });
            return;
        } else {
            addTripToSelection(trip); // Ensure this adds the trip object
            // setCurrentPotentialTrip(trip);
            setIsFlagModalOpen(true);
        }
    };

    const closeFlagModal = () => {
        setIsFlagModalOpen(false);
        // setCurrentPotentialTrip(null);
        setSelectedTrips(new Set());
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    // const toggleTripDetails = (tripId) => {
    //     setActiveTripId(activeTripId === tripId ? null : tripId);
    // };

    return (
        <>
            {(userDetails.role !== 'admin') ? (
                <div>
                    You do not have permission to view this page.
                </div>
            ) : (
                <>
                    <div className="center potential-trips">
                    <ConfirmTripModal
                        isOpen={isConfirmModalOpen}
                        // openConfirmTripModal={openConfirmTripModal}
                        onClose={closeConfirmModal}
                        onRefresh={triggerRefresh}
                        // potentialTripData={currentPotentialTrip}
                        selectedTrips={selectedTrips}
                    />
                    <FlagTripModal
                        isOpen={isFlagModalOpen}
                        // openConfirmTripModal={openFlagTripModal}
                        onClose={closeFlagModal}
                        onRefresh={triggerRefresh}
                        // potentialTripData={currentPotentialTrip}
                        selectedTrips={selectedTrips}
                    />
                        {loaded ? (
                            <>
                                <div className="row">
                                    <h4>Potential Trips</h4>
                                </div>
                                { progress &&
                                    <div className="row" style={{ width: '60%'}}>
                                        <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                            <div className="determinate tb-teal darken-2" style={{ width: `${progress.percent_complete}` }}></div>
                                        </div>
                                        <h5>
                                            <span className="text-bold">{progress.percent_complete}</span> complete
                                        </h5>
                                        <p>
                                            <span className="tb-teal-text text-bold">{progress.total_potential}</span> pending trips
                                            <br/>
                                            <span className="tb-teal-text text-bold">{progress.total_confirmed}</span> validated trips
                                        </p>
                                    </div>
                                }
                                <div className="row" style={{ marginTop: '10px', marginBottom: '30px'}}>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'qualityIssuesFirst' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('qualityIssuesFirst')}
                                    >
                                        Quality Issues
                                    </div>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'latestTripsFirst' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('latestTripsFirst')}
                                    >
                                        Latest Trips
                                    </div>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'oldestTripsFirst' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('oldestTripsFirst')}
                                    >
                                        Oldest Trips
                                    </div>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'shortestTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('shortestTrips')}
                                    >
                                        Shortest Trips
                                    </div>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'longestTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('longestTrips')}
                                    >
                                        Longest Trips
                                    </div>
                                    <div
                                        className={`chip waves-effect btn ${sortOption === 'flaggedTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                        onClick={() => setSortOption('flaggedTrips')}
                                    >
                                        Flagged Trips
                                    </div>
                                </div>
                                {/* <div className="container"> */}
                                {displayData.length ? (
                                    displayData.map(trip => (
                                        <>
                                            <div key={trip.id} className="card potential-trip-card">
                                                <div className="card-content">
                                                    <span className="card-title">{trip.trip_name || "Unnamed Trip"}</span>
                                                    <span className="chip tb-grey lighten-4">{trip.review_status}</span>
                                                    <button
                                                        className="btn-floating btn-small waves-effect waves-light success-green"
                                                        onClick={() => openConfirmTripModal(trip)}
                                                    >
                                                        <i className="material-icons">check</i>
                                                    </button>
                                                    &nbsp;
                                                    <button
                                                        className="btn-floating btn-small waves-effect waves-light red lighten-3"
                                                        onClick={() => openFlagTripModal(trip)}
                                                    >
                                                        <i className="material-icons">flag</i>
                                                    </button>
                                                    <ul>
                                                        {trip.accommodation_logs.map(log => (
                                                            <li key={log.id}>
                                                                <SingleLogDisplay log={log} />
                                                            </li>
                                                        ))}
                                                        <li style={{ marginTop: '20px' }}>
                                                        <label className="tb-checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                className="tb-checkbox"
                                                                checked={[...selectedTrips].some(t => t.id === trip.id)}
                                                                onChange={() => handleToggleTrip(trip)}
                                                            />
                                                            <span>Mark for merge</span>
                                                        </label>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    ))
                                ) : (
                                    <p>No trips available for grouping.</p>
                                )}
                                {/* </div> */}
                            </>
                        ) : (
                            <div>
                                <CircularPreloader show={true} />
                            </div>
                        )}
                    </div>
                </>
            )
            }
        </>
    )
}

export default PotentialTrips;
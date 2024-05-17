import React, { useEffect, useState, useCallback } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import moment from 'moment';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
import ConfirmTripModal from './ConfirmTripModal';
import FlagTripModal from './FlagTripModal';
import TricklingDotsPreloader from '../../components/TricklingDotsPreloader';

export const PotentialTrips = () => {
    const [apiData, setApiData] = useState([]);
    const MemoizedConfirmTripModal = React.memo(ConfirmTripModal);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(10);
    const [refreshData, setRefreshData] = useState(false);
    const [sortOption, setSortOption] = useState('latestTripsFirst');
    const [loaded, setLoaded] = useState(false);
    const [loadedProgress, setLoadedProgress] = useState(false);
    // const [activeTripId, setActiveTripId] = useState(null);
    const { userDetails, logout } = useAuth();
    const [progress, setProgress] = useState(null);
    const [currentFlaggedTrip, setCurrentFlaggedTrip] = useState(null);
    const [displayData, setDisplayData] = useState([]);
    const [isProgressExpanded, setIsProgressExpanded] = useState(false);
    // const [currentPotentialTrip, setCurrentPotentialTrip] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('all');

    const [selectedTrips, setSelectedTrips] = useState(new Set());

    console.log(progress);

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

    const getYear = (dateString) => {
        if (!dateString) return null; // or some default value indicating invalid or absence of date
    
        const date = new Date(dateString);
        return isNaN(date.getFullYear()) ? null : date.getFullYear();
    };

    useEffect(() => {
        // let filteredData = apiData.filter(trip => {
        //     return trip.trip_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        //         trip.accommodation_logs.some(log => log.primary_traveler.toLowerCase().includes(searchTerm.toLowerCase())) ||
        //         trip.accommodation_logs.some(log => log.consultant_display_name.toLowerCase().includes(searchTerm.toLowerCase()));
        // });

        let filteredData = apiData.filter(trip => {
            // Basic search term filtering
            const matchesSearchTerm = trip.trip_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                trip.accommodation_logs.some(log => log.primary_traveler.toLowerCase().includes(searchTerm.toLowerCase())) ||
                trip.accommodation_logs.some(log => log.consultant_display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
            // Additional filtering based on the filter option
            switch (filterOption) {
                case 'qualityIssues':
                    return matchesSearchTerm && trip.accommodation_logs.some(log =>
                        log.consultant_flag || log.num_pax_flag || log.date_out_flag || log.date_in_flag || log.core_destination_flag || log.primary_traveler_flag);
                case 'flaggedTrips':
                    return matchesSearchTerm && trip.review_status?.includes('flagged');
                case 'year2023':
                    return matchesSearchTerm && getYear(trip?.start_date) === 2023;
                case 'year2024':
                    return matchesSearchTerm && getYear(trip?.start_date) === 2024;
                case 'africa':
                    return matchesSearchTerm && trip.core_destination?.includes('Africa');
                case 'latinAmerica':
                    return matchesSearchTerm && trip.core_destination?.includes('Latin America');
                case 'asia':
                    return matchesSearchTerm && trip.core_destination?.includes('Asia');
                case 'other':
                    const continents = ['Africa', 'Latin America', 'Asia'];
                    return matchesSearchTerm && !continents.some(continent => trip.core_destination?.includes(continent));
                default:
                    return matchesSearchTerm;
            }
        });
    
        let sortedData = [...filteredData];

        // let sortedData = [...apiData]; // Create a shallow copy to sort
        sortedData.forEach(trip => {
            // Count the total number of flags in each trip
            trip.totalFlags = trip.accommodation_logs.reduce((acc, log) => {
                return acc + (log.consultant_flag ? 1 : 0) + (log.num_pax_flag ? 1 : 0) +
                    (log.date_out_flag ? 1 : 0) + (log.date_in_flag ? 1 : 0) + (log.core_destination_flag ? 1 : 0)
                    + (log.primary_traveler_flag ? 1 : 0);
            }, 0);
        });

        switch (sortOption) {
            // case 'qualityIssuesFirst':
            //     sortedData.sort((a, b) => b.totalFlags - a.totalFlags);
            //     break;
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
            // case 'flaggedTrips':
            //     sortedData.sort((a, b) => {
            //         const flagA = !a.review_status?.includes('flagged') ? 1 : 0;
            //         const flagB = !b.review_status?.includes('flagged') ? 1 : 0;
            //         return flagA - flagB;
            //     });
            //     break;
            // case 'africaFirst':
            //     sortedData.sort((a, b) => {
            //         const continentA = a.core_destination?.includes('Africa') ? 0 : 1;
            //         const continentB = b.core_destination?.includes('Africa') ? 0 : 1;
            //         return continentA - continentB;
            //     });
            //     break;
            // case 'latinAmericaFirst':
            //     sortedData.sort((a, b) => {
            //         const continentA = a.core_destination?.includes('Latin America') ? 0 : 1;
            //         const continentB = b.core_destination?.includes('Latin America') ? 0 : 1;
            //         return continentA - continentB;
            //     });
            //     break;
            // case 'otherFirst':
            //     sortedData.sort((a, b) => {
            //         // Check if the destination does not include Africa, Latin America, or Asia
            //         const continents = ['Africa', 'Latin America', 'Asia']; // List of continents to check against
            //         const isOtherA = !continents.some(continent => a.core_destination?.includes(continent));
            //         const isOtherB = !continents.some(continent => b.core_destination?.includes(continent));
            //         const continentA = isOtherA ? 0 : 1; // 0 if none of the listed continents are included, otherwise 1
            //         const continentB = isOtherB ? 0 : 1;
            //         return continentA - continentB;
            //     });
            //     break;
            // case 'asiaFirst':
            //     sortedData.sort((a, b) => {
            //         const continentA = a.core_destination?.includes('Asia') ? 0 : 1;
            //         const continentB = b.core_destination?.includes('Asia') ? 0 : 1;
            //         return continentA - continentB;
            //     });
            //     break;
            // case 'year2023First':
            //     sortedData.sort((a, b) => {
            //         const yearA = new Date(a.start_date).getFullYear() === 2023 ? 0 : 1;
            //         const yearB = new Date(b.end_date).getFullYear() === 2023 ? 0 : 1;
            //         return yearA - yearB;
            //     });
            //     break;
            // case 'year2024First':
            //     sortedData.sort((a, b) => {
            //         const yearA = new Date(a.start_date).getFullYear() === 2024 ? 0 : 1;
            //         const yearB = new Date(b.end_date).getFullYear() === 2024 ? 0 : 1;
            //         return yearA - yearB;
            //     });
            //     break;
            default:
                break;
        }

        const newTotalPages = Math.ceil(sortedData.length / itemsPerPage);
        setTotalPages(newTotalPages);

        // Pagination logic
        if (currentPage >= newTotalPages) {
            setCurrentPage(0);
        }
        const displayStartIndex = currentPage * itemsPerPage;
        const displayEndIndex = displayStartIndex + itemsPerPage;
        setDisplayData(sortedData.slice(displayStartIndex, displayEndIndex));
    }, [sortOption, apiData, currentPage, itemsPerPage, searchTerm, filterOption]);

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
    }, [refreshData, userDetails.token, logout]);


    useEffect(() => {
        setTimeout(() => {
            fetch(`${process.env.REACT_APP_API}/v1/progress`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`
                }
            })
                .then((res) => res.json())
                .then((data) => {
                    setProgress(data);
                    setLoadedProgress(true);
                })
                .catch((err) => {
                    setLoadedProgress(true);
                    console.error(err);
                });
        }, 1000);
    }, [refreshData, userDetails.token, logout]);

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

    function validateData(trips) {
        return trips.map(trip => {
            const logs = trip.accommodation_logs;
            const consultantCounts = {};
            const coreDestinationCounts = {};
            const numPaxCounts = {};
            const primaryTravelerCount = {};

            // Count occurrences of each value
            logs.forEach(log => {
                consultantCounts[log.consultant_display_name] = (consultantCounts[log.consultant_display_name] || 0) + 1;
                coreDestinationCounts[log.core_destination_name] = (coreDestinationCounts[log.core_destination_name] || 0) + 1;
                numPaxCounts[log.num_pax] = (numPaxCounts[log.num_pax] || 0) + 1;
                primaryTravelerCount[log.primary_traveler] = (primaryTravelerCount[log.primary_traveler] || 0) + 1;
            });

            // Determine most common values
            const mostCommonConsultant = Object.keys(consultantCounts).reduce((a, b) => consultantCounts[a] > consultantCounts[b] ? a : b);
            const mostCommonDestination = Object.keys(coreDestinationCounts).reduce((a, b) => coreDestinationCounts[a] > coreDestinationCounts[b] ? a : b);
            const mostCommonNumPax = Object.keys(numPaxCounts).reduce((a, b) => numPaxCounts[a] > numPaxCounts[b] ? a : b);
            const mostCommonTraveler = Object.keys(primaryTravelerCount).reduce((a, b) => primaryTravelerCount[a] > primaryTravelerCount[b] ? a : b);

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

                // Check for gap between consecutive logs
                if (i < logs.length - 1) {
                    const currentDateOut = new Date(log.date_out);
                    const nextDateIn = new Date(logs[i + 1].date_in);
                    const gapDays = (nextDateIn - currentDateOut) / (1000 * 60 * 60 * 24);
                    if (gapDays > 0) {
                        log.date_out_flag = true;
                        logs[i + 1].date_in_flag = true;
                    }
                }

                // Check for mismatch in consultant, destination, and num_pax
                if (log.consultant_display_name !== mostCommonConsultant) {
                    log.consultant_flag = true;
                }
                if (log.core_destination_name !== mostCommonDestination) {
                    log.core_destination_flag = true;
                }
                if (log.primary_traveler !== mostCommonTraveler) {
                    log.primary_traveler_flag = true;
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

    const openConfirmTripModal = (trip = null) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before confirming trips.',
                displayLength: 2000,
                classes: 'error-red',
            });
            return;
        } else {
            if (trip) {
                addTripToSelection(trip); // Only add the trip if it's passed
            }
            setIsConfirmModalOpen(true);
        }
    };

    const closeConfirmModal = useCallback(() => {
        setIsConfirmModalOpen(false);
        setSelectedTrips(new Set());
        document.body.style.overflow = '';
    }, []);
    
    const onCloseConfirmModal = useCallback(() => {
        closeConfirmModal();
    }, [closeConfirmModal]);

    const handleFilterChange = (newFilter) => {
        setFilterOption(newFilter);
        setSortOption(''); // Reset sort option or set it to any default value
    };

    const handleSortChange = (newSort) => {
        setSortOption(newSort);
        setFilterOption(''); // Reset sort option or set it to any default value
    };
    

    const openFlagTripModal = (trip) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before flagging trips.',
                displayLength: 2000,
                classes: 'error-red',
            });
            return;
        } else {
            setCurrentFlaggedTrip(trip);
            setIsFlagModalOpen(true);
        }
    };

    const closeFlagModal = useCallback(() => {
        setIsFlagModalOpen(false);
        // setCurrentPotentialTrip(null);
        setSelectedTrips(new Set());
        document.body.style.overflow = '';
    }, []);

    const onCloseFlagModal = useCallback(() => {
        closeFlagModal();
    }, [closeFlagModal]);

    const triggerRefresh = useCallback(() => {
        setRefreshData(prev => !prev);
    }, []);

    const onRefreshModal = useCallback(() => {
        triggerRefresh();
    }, [triggerRefresh]);

    return (
        <>
            {(userDetails.role !== 'admin') ? (
                <div>
                    You do not have permission to view this page.
                </div>
            ) : (
                <>
                    <div className="center potential-trips">
                    <MemoizedConfirmTripModal
                        isOpen={isConfirmModalOpen}
                        onClose={onCloseConfirmModal}
                        onRefresh={onRefreshModal}
                        selectedTrips={selectedTrips}
                    />
                    <FlagTripModal
                        isOpen={isFlagModalOpen}
                        onClose={onCloseFlagModal}
                        onRefresh={onRefreshModal}
                        potentialTripData={currentFlaggedTrip}
                        selectedTrips={selectedTrips}
                    />
                    <div className="row">
                        <h4>Potential Trips</h4>
                    </div>
                    { loadedProgress ? (
                        progress ? (
                        <>
                            <div className="row" style={{ width: '60%', marginBottom: '0px', paddingBottom: '0px'}}>
                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_overall.percent_complete}` }}></div>
                                </div>
                                <h5>
                                    <span className="text-bold">{progress.progress_overall.percent_complete}</span> complete
                                </h5>
                                <span className="tb-teal-text text-bold">
                                    {progress.progress_overall?.confirmed}
                                </span>
                                <span> / </span>
                                <span className="tb-grey-text text-bold">
                                    {progress.progress_overall?.confirmed + progress.progress_overall?.potential}
                                </span>
                                <br/>
                                <div
                                    className={`chip waves-effect btn ${isProgressExpanded ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => setIsProgressExpanded(!isProgressExpanded)}
                                >
                                    Progress<span className="material-symbols-outlined">
                                        expand_more
                                    </span>
                                </div>
                            </div>
                            {isProgressExpanded &&
                            <div className="row" style={{ width: '90%', marginTop: '0px', paddingTop: '0px'}}>
                                <div className="card potential-trip-card">
                                    <div className="card-content scoreboard">
                                        <h5 className="scoreboard">Scorecard</h5>
                                        <div className="row">
                                            <div className="col m3 s12">
                                                <p>Africa</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_destination['Africa']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_destination['Africa']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_destination['Africa']?.confirmed}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_destination['Africa']?.confirmed + progress.progress_by_destination['Africa']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>Latin America</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_destination['Latin America']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_destination['Latin America']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_destination['Latin America']?.confirmed}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_destination['Latin America']?.confirmed + progress.progress_by_destination['Latin America']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>Asia</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_destination['Asia']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_destination['Asia']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_destination['Asia']?.confirmed}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_destination['Asia']?.confirmed + progress.progress_by_destination['Asia']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>Other</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_destination['Other']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_destination['Other']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_destination['Other']?.confirmed || "0"}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_destination['Other']?.confirmed + progress.progress_by_destination['Other']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="row" style={{ marginTop: '30px'}}>
                                            <div className="col m3 s12">
                                                <p>Pre-2023</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_year['Pre-2023']?.percent_complete}` }}></div>
                                                </div>
                                                    {progress.progress_by_year['Pre-2023']?.percent_complete ?? "-"}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_year['Pre-2023']?.confirmed ?? "0"}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_year['Pre-2023']?.confirmed + progress.progress_by_year['Pre-2023']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>2023</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_year['2023']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_year['2023']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_year['2023']?.confirmed ?? "-"}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_year['2023']?.confirmed + progress.progress_by_year['2023']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>2024</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_year['2024']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_year['2024']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_year['2024']?.confirmed ?? "-"}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_year['2024']?.confirmed + progress.progress_by_year['2024']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                            <div className="col m3 s12">
                                                <p>Post-2024</p>
                                                <div className="progress tb-grey lighten-3" style={{ height: '30px', borderRadius: '15px', boxShadow:'0 8px 15px rgba(0, 0, 0, 0.1)'}}>
                                                    <div className="determinate tb-teal darken-2" style={{ width: `${progress.progress_by_year['Post-2024']?.percent_complete}` }}></div>
                                                </div>
                                                {progress.progress_by_year['Post-2024']?.percent_complete}
                                                <br/>
                                                <span className="tb-teal-text text-bold">
                                                    {progress.progress_by_year['Post-2024']?.confirmed}
                                                </span>
                                                <span> / </span>
                                                <span className="tb-grey-text text-bold">
                                                    {(progress.progress_by_year['Post-2024']?.confirmed + progress.progress_by_year['Post-2024']?.potential) ?? "-"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            }
                        </>
                    ) : (
                        <p>Could not load progress.</p>
                      )
                    ) : (
                        <div style={{ marginBottom: '30px'}}>
                            <TricklingDotsPreloader show={true} />
                        </div>
                    )}

                    {loaded ? (
                        <>
                            <div className="row" style={{ marginTop: '10px', marginBottom: '0px'}}>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'africa' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('africa')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Africa
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'latinAmerica' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('latinAmerica')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Latin America
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'asia' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('asia')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Asia
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'other' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('other')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Other
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'year2024' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('year2024')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    2024
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'year2023' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('year2023')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    2023
                                </div>
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'qualityIssues' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('qualityIssues')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Quality Issues
                                </div>
                                
                                <div
                                    className={`chip waves-effect btn ${filterOption === 'flaggedTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleFilterChange('flaggedTrips')}
                                >
                                    <span className="material-symbols-outlined">
                                        filter_alt
                                    </span>
                                    Flagged Trips
                                </div>
                            </div>
                            <div className="row" style={{ paddingTop: '0px', marginBottom: '30px'}}>
                                <div
                                    className={`chip waves-effect btn ${sortOption === 'latestTripsFirst' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleSortChange('latestTripsFirst')}
                                >
                                    <span class="material-symbols-outlined">
                                        swap_vert
                                    </span>
                                    Latest Trips
                                </div>
                                <div
                                    className={`chip waves-effect btn ${sortOption === 'oldestTripsFirst' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleSortChange('oldestTripsFirst')}
                                >
                                    <span class="material-symbols-outlined">
                                        swap_vert
                                    </span>
                                    Oldest Trips
                                </div>
                                <div
                                    className={`chip waves-effect btn ${sortOption === 'shortestTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleSortChange('shortestTrips')}
                                >
                                    <span class="material-symbols-outlined">
                                        swap_vert
                                    </span>
                                    Shortest Trips
                                </div>
                                <div
                                    className={`chip waves-effect btn ${sortOption === 'longestTrips' ? 'tb-teal darken-2 tb-off-white-text text-bold' : 'tb-grey lighten-4'}`}
                                    onClick={() => handleSortChange('longestTrips')}
                                >
                                    <span class="material-symbols-outlined">
                                        swap_vert
                                    </span>
                                    Longest Trips
                                </div>
                            </div>
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
                            <div className="row center">
                                <div className="col s6 offset-s3 input-field">
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <span className="material-symbols-outlined grey-text text-darken-1 prefix">
                                            search
                                        </span>
                                        <input
                                            type="text"
                                            id="potential-search-query"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                            autoComplete="off"
                                        />
                                        <span>
                                            <button className="btn btn-floating btn-small error-red" onClick={() => setSearchTerm('')}>
                                                x
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {selectedTrips.size > 0 && (
                                <div className="row white" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                                    <div className="row white" style= {{marginBottom: '0px'}}>
                                        <span className="code">Trips selected:</span>
                                        <span className="chip warning-yellow text-bold" style={{ marginLeft: '5px' }}>
                                            {selectedTrips.size}
                                        </span>
                                    </div>
                                    <div className="row white">
                                        <button
                                            className="btn error-red-light grey-text text-darken-4"
                                            onClick={() => setSelectedTrips(new Set())}
                                        >
                                            <span className="material-symbols-outlined">
                                                remove_done
                                            </span>
                                        </button>
                                        &nbsp;
                                        <button
                                            className="btn tb-teal lighten-3 grey-text text-darken-4"
                                            onClick={() => openConfirmTripModal()}
                                        >
                                            <i className="material-icons">merge</i>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {displayData.length ? (
                                displayData.map(trip => (
                                    <div key={trip.id} className="card potential-trip-card">
                                        <div className="card-content">
                                            <span className="card-title">{trip.trip_name || "Unnamed Trip"}</span>
                                            {trip.review_status === "pending" ? (
                                                <span className="chip warning-yellow-light lighten-4">
                                                    <span className="material-symbols-outlined">
                                                        pending
                                                    </span>
                                                    {trip.review_status}
                                                </span>
                                            ) : (
                                                <span className="chip error-red-light">
                                                    <span className="material-symbols-outlined">
                                                        flag
                                                    </span>
                                                    {trip.review_status} by <span className="text-bold">{trip.reviewed_by?.split('@')[0]}</span>
                                                </span>
                                            )}
                                            <button
                                                className="btn-floating btn-small waves-effect waves-light success-green"
                                                onClick={() => openConfirmTripModal(trip)}
                                            >
                                                <i className="material-icons">check</i>
                                            </button>
                                            &nbsp;
                                            {trip.review_status !== "flagged" &&
                                            <button
                                                className="btn-floating btn-small waves-effect waves-light red lighten-3"
                                                onClick={() => openFlagTripModal(trip)}
                                            >
                                                <i className="material-icons">flag</i>
                                            </button>
                                            }
                                            {trip.review_notes &&
                                            <div className="container center">
                                            <div className="card tb-grey lighten-4 potential-trip-card" style={{ marginTop: '30px', marginBottom: '30px', fontSize: '1.2rem'}}>
                                                    <p className="tb-grey-text text-darken-2" style={{ paddingTop: '10px', paddingBottom: '10px'}}>
                                                        <span className="text-bold">Note from <span className="tb-teal-text text-darken-1">{trip.reviewed_by.split('@')[0]}</span>:</span>
                                                        <br/>
                                                        {trip.review_notes}
                                                        <br/>
                                                        <em style={{ fontSize: '1rem' }}>{moment(trip.reviewed_at).local().fromNow()}</em>
                                                    </p>
                                            </div>
                                            </div>
                                            }
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
                                ))
                                ) : (
                                    <p>No trips available for grouping.</p>
                                )}
                                {/* </div> */}
                            </>
                        ) : (
                            <div style={{ marginTop: '20px' }}>
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
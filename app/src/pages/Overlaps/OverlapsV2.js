import React, { useEffect, useState, useMemo } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import WeekSelector from '../../pages/Overlaps/WeekSelector';
import moment from 'moment';

export const OverlapsV2 = () => {
    const [apiData, setApiData] = useState({});
    // const [filteredData, setFilteredData] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [startDate, setStartDate] = useState(moment().startOf('week'));
    // const [endDate, setEndDate] = useState(moment().endOf('week'));

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1100);

    const handleWeekChange = (newStart) => {
        if (!newStart.isSame(startDate, 'day')) {
            setStartDate(newStart);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        M.AutoInit();
        setLoaded(false);

        const endDate = moment(startDate).endOf('week');
        const startDateFormat = startDate.format('YYYY-MM-DD');
        const endDateFormat = endDate.format('YYYY-MM-DD');

        fetch(`${process.env.REACT_APP_API}/v1/overlaps?start_date=${startDateFormat}&end_date=${endDateFormat}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const parsedOverlaps = data.map(log => JSON.parse(log));
                setApiData(parsedOverlaps);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token, startDate]);

    const groupedOverlaps = useMemo(() => {
        // Ensure apiData is treated as an array if it's not falsy; otherwise, use an empty array
        const validApiData = Array.isArray(apiData) ? apiData : [];
        return validApiData.reduce((acc, item) => {
            if (!acc[item.property_id]) {
                acc[item.property_id] = {
                    propertyName: item.property_name,
                    propertyCountry: item.country_name,
                    propertyCoreDestination: item.core_destination_name,
                    overlaps: []
                };
            }
            acc[item.property_id].overlaps.push(item);
            return acc;
        }, {});
    }, [apiData]);

    console.log(groupedOverlaps);

    const renderOverlapItems = (property) => {
        if (!property || !Array.isArray(property.overlaps)) {
            return null;
        }

        const renderedTravelers = new Set();

        const renderIndividualOverlap = (overlap) => {
            let renderedRows = 0;
            const daysOfWeek = Array(7).fill(null); // Represents a week
            const weekStart = moment(startDate);

            const renderWeekCells = (traveler, bookingChannel, consultant, overlapStartDate, overlapEndDate) => {
                const uniqueKey = `${traveler}-${property.propertyName}-${overlapStartDate}-${overlapEndDate}`;
                if (renderedTravelers.has(uniqueKey)) {
                    // This traveler has been rendered for this property and date range, skip rendering
                    return null; // Return null to indicate no row should be generated
                } else {
                    renderedTravelers.add(uniqueKey); // Mark this traveler as rendered
                }

                // Render cells for the week, but this time we're checking for actual content
                overlapStartDate = moment(overlapStartDate);
                overlapEndDate = moment(overlapEndDate);
                let startIndex = Math.max(0, overlapStartDate.diff(weekStart, 'days'));
                let endIndex = Math.min(6, overlapEndDate.diff(weekStart, 'days'));
                let hasContent = startIndex <= endIndex;
                const rowCells = daysOfWeek.map((_, index) => {
                    if (index >= startIndex && index <= endIndex) {
                        if (index === startIndex) {
                            return (
                                <td key={index} colSpan={endIndex - startIndex + 1} style={{ textAlign: 'center' }}>
                                    <div
                                        className="tb-grey lighten-4"
                                        style={{
                                            border: bookingChannel === "FAM/TB Travel" ? '3px solid #057e8c' : 'none' // Apply conditional border
                                        }}
                                    >

                                        {bookingChannel === "FAM/TB Travel" ? (
                                            <div style={{ marginTop: '10px' }}>
                                                <span className="material-symbols-outlined tb-md-black-text">person</span>
                                                <span className="tb-teal-text text-darken-1 text-bold">{traveler}</span>
                                                <span style={{ marginLeft: '8px', height: '30px' }} className="chip tb-grey darken-1 tb-off-white-text text-bold">FAM/TB</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="material-symbols-outlined tb-md-black-text">person</span>
                                                <span className="tb-teal-text text-darken-1 text-bold">{traveler}</span>
                                            </div>
                                        )
                                        }
                                        <span className="material-symbols-outlined tb-md-black-text">badge</span>
                                        <em>{consultant}</em><br />
                                        <em>{overlapStartDate.format("M/D")}-{overlapEndDate.format("M/D")}</em>
                                    </div>
                                </td>
                            );
                        }
                        return null; // Cells covered by colSpan
                    } else {
                        return <td key={index}></td>;
                    }
                });

                return hasContent ? rowCells : null; // Only return rowCells if the row has content
            };

            const overlapStart1 = overlap.date_in_traveler1;
            const overlapEnd1 = overlap.date_out_traveler1;
            const overlapStart2 = overlap.date_in_traveler2;
            const overlapEnd2 = overlap.date_out_traveler2;

            const traveler1Row = renderWeekCells(overlap.traveler1, overlap.booking_channel_traveler1, `${overlap.consultant_first_name_traveler1} ${overlap.consultant_last_name_traveler1}`, overlapStart1, overlapEnd1);
            if (traveler1Row) renderedRows++;
            const traveler2Row = renderWeekCells(overlap.traveler2, overlap.booking_channel_traveler2, `${overlap.consultant_first_name_traveler2} ${overlap.consultant_last_name_traveler2}`, overlapStart2, overlapEnd2);
            if (traveler2Row) renderedRows++;

            return {
                renderedJsx: (
                    traveler1Row || traveler2Row ? (
                        <>
                            {traveler1Row ? <tr style={{ borderBottom: 'none' }}>{traveler1Row}</tr> : null}
                            {traveler2Row ? <tr style={{ borderBottom: 'none' }}>{traveler2Row}</tr> : null
                            }
                        </>
                    ) : null
                ),
                count: renderedRows
            };
        };

        let actualRenderedRows = 0; // Initialize counter

        // Assuming `property.overlaps` exists and is an array
        const overlapContent = property.overlaps.map((overlap, index) => {
            const { renderedJsx, count } = renderIndividualOverlap(overlap);
            actualRenderedRows += count;
            return <React.Fragment key={`overlap-${index}`}>{renderedJsx}</React.Fragment>;
        });

        return (
            <>
                <tr style={{ borderBottom: 'none', width: '200px' }}>
                    <td colSpan="1"
                        className="tb-grey lighten-4"
                        rowSpan={actualRenderedRows + 3}
                        style={{ borderBottom: 'none' }}
                    >
                        <span className="text-bold">{property.propertyName}</span>
                        <br />
                        <span className="material-symbols-outlined tb-md-grey-text text-darken-1">
                            globe
                        </span>
                        {property.propertyCountry}
                        <br />
                        <span className="material-symbols-outlined tb-md-grey-text text-darken-1">
                            explore
                        </span>
                        {property.propertyCoreDestination}
                    </td>
                </tr>
                <tr colSpan="1" style={{ height: '20px', borderBottom: 'none', borderTop: 'none' }}></tr>
                {overlapContent}
                <tr colSpan="1" style={{ height: '20px', borderBottom: '2px solid #8c8782', borderTop: 'none' }}></tr>
            </>
        );
    };

    return (
        <>
            <header>
                <Navbar title="Client Overlaps" />
            </header>

            <main className="tb-grey lighten-6" style={{
                position: 'absolute',
                top: isMobileView ? '100px' : '80px',
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
            }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '800px' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <div className="container center" style={{ width: '100%' }}>
                                        <div className="sticky-container">
                                            <WeekSelector onWeekChange={handleWeekChange} initialDate={startDate} />
                                            <div style={{ fontSize: '1.4rem' }}>
                                                <span>Overlaps from </span>
                                                <span className="tb-teal-text text-bold">
                                                    {startDate.format("M/D/YY")}
                                                </span>
                                                <span> to </span>
                                                <span className="tb-teal-text text-bold">
                                                    {moment(startDate).endOf('week').format("M/D/YY")}
                                                </span>
                                            </div>
                                            {/* Rest of your component */}
                                        </div>
                                        <table className="overlaps-table">
                                            <thead>
                                                <tr className="tb-grey-text text-lighten-5 text-bold" style={{ borderBottom: '2px solid #8c8782', borderTop: 'none' }}>
                                                    <th className="tb-teal darken-4" style={{ borderRadius: '5px 0px 0px 0px', width: '200px' }}>Property</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>SUN</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>MON</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>TUES</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>WEDS</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>THURS</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px' }}>FRI</th>
                                                    <th className="tb-teal darken-3" style={{ borderRadius: '0px 5px 0px 0px' }}>SAT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loaded && Object.values(groupedOverlaps).length > 0 ? (
                                                    Object.values(groupedOverlaps).map((property, propertyIndex) => (
                                                        <React.Fragment key={propertyIndex}>
                                                            {renderOverlapItems(property)} {/* Call with the entire property */}
                                                        </React.Fragment>
                                                    ))
                                                ) : loaded ? (
                                                    <tr>
                                                        <td colSpan="8" style={{ textAlign: 'center' }}>No overlaps this week.</td>
                                                    </tr>
                                                ) :
                                                    null
                                                }
                                            </tbody>
                                        </table>
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
            </main >
        </>
    );

};

export default OverlapsV2;

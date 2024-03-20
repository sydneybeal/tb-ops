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

    const handleWeekChange = (newStart) => {
        if (!newStart.isSame(startDate, 'day')) {
            setStartDate(newStart);
        }
    };


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

    const renderOverlapItems = (property) => {
        if (!property || !Array.isArray(property.overlaps)) {
            return null;
        }

        const renderedTravelers = new Set();

        const renderIndividualOverlap = (overlap) => {
            const daysOfWeek = Array(7).fill(null); // Represents a week
            const weekStart = moment(startDate);

            const renderWeekCells = (traveler, consultant, overlapStartDate, overlapEndDate) => {
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
                                    <div className="tb-grey lighten-4" style={{ width: '100%', borderRadius: '5px' }}>
                                        <span className="material-symbols-outlined tb-md-black-text">person</span>
                                        <span className="tb-teal-text text-bold">{traveler}</span><br />
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

            const traveler1Row = renderWeekCells(overlap.traveler1, `${overlap.consultant_first_name_traveler1} ${overlap.consultant_last_name_traveler1}`, overlapStart1, overlapEnd1);
            const traveler2Row = renderWeekCells(overlap.traveler2, `${overlap.consultant_first_name_traveler2} ${overlap.consultant_last_name_traveler2}`, overlapStart2, overlapEnd2);

            return <><tr>{traveler1Row}</tr><tr>{traveler2Row}</tr></>;
        };


        return (
            <>
                <tr>
                    <td colSpan="1" rowSpan={property.overlaps.length * 2 + 1}>
                        <span className="text-bold">{property.propertyName}</span>
                        <br />
                        <span className="material-symbols-outlined tb-grey-text text-darken-1">
                            globe
                        </span>
                        {property.propertyCountry}
                        <br />
                        <span className="material-symbols-outlined tb-grey-text text-darken-1">
                            explore
                        </span>
                        {property.propertyCoreDestination}
                    </td>
                </tr>
                {property.overlaps.map((overlap, index) => (
                    <React.Fragment key={index}>
                        {renderIndividualOverlap(overlap)}
                    </React.Fragment>
                ))}
            </>
        );
    };

    return (
        <>
            <header>
                <Navbar title="Client Overlaps" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '100%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>

                                    <div className="container center" style={{ width: '90%' }}>
                                        <div>
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
                                        <table>
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th>Property Name</th>
                                                    <th>Sunday</th>
                                                    <th>Monday</th>
                                                    <th>Tuesday</th>
                                                    <th>Wednesday</th>
                                                    <th>Thursday</th>
                                                    <th>Friday</th>
                                                    <th>Saturday</th>
                                                </tr>
                                            </thead>
                                            {/* Scrollable table body */}
                                            {/* <div style={{ overflowY: 'auto', maxHeight: '800px' }}> */}
                                            <tbody>
                                                {
                                                    Object.values(groupedOverlaps).length > 0 ? (
                                                        Object.values(groupedOverlaps).map((property, propertyIndex) => (
                                                            <React.Fragment key={propertyIndex}>
                                                                {renderOverlapItems(property)} {/* Call with the entire property */}
                                                            </React.Fragment>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="8" style={{ textAlign: 'center' }}>No overlaps this week.</td>
                                                        </tr>
                                                    )
                                                }
                                            </tbody>
                                            {/* </div> */}
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

import React, { useEffect, useState } from 'react';
// import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import SingleLogDisplay from '../AccommodationLogs/SingleLogDisplay';
// import Navbar from '../../components/Navbar';
// import moment from 'moment';

export const Trips = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    // const [activeTripId, setActiveTripId] = useState(null);
    const { userDetails } = useAuth();
    // const [displayData, setDisplayData] = useState([]);

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
    }, [userDetails.token]);

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
                            {/* <div className="container"> */}
                            {apiData.length ? (
                                    apiData.map(trip => (
                                        <>
                                            <div key={trip.id} className="card potential-trip-card">
                                                <div className="card-content">
                                                    <span className="card-title">{trip.trip_name || "Unnamed Trip"}</span>
                                                    <span className="chip green lighten-4">validated</span>
                                                    <ul>
                                                        {trip.accommodation_logs.map(log => (
                                                            <li key={log.id}>
                                                                <SingleLogDisplay log={log} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
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
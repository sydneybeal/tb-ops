import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import WeekSelector from '../../pages/Overlaps/WeekSelector';
import TravelMap from './TravelMap';
import moment from 'moment';

export const Maps = () => {
    const [apiData, setApiData] = useState({});
    const [displayData, setDisplayData] = useState({});
    // const [filteredData, setFilteredData] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [startDate, setStartDate] = useState(moment().startOf('week'));
    // const [endDate, setEndDate] = useState(moment().endOf('week'));

    // const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1100);

    const handleWeekChange = (newStart) => {
        if (!newStart.isSame(startDate, 'day')) {
            setStartDate(newStart);
        }
    };

    console.log(loaded);

    useEffect(() => {
        setLoaded(false);

        // const endDate = moment(startDate).endOf('week');
        // const startDateFormat = startDate.format('YYYY-MM-DD');
        // const endDateFormat = endDate.format('YYYY-MM-DD');

        // TODO implement start/end dates in the API
        // fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs?start_date=${startDateFormat}&end_date=${endDateFormat}`, {
        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`, {
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
                const parsedData = data.map(log => (
                    {
                        primary_traveler: log.primary_traveler,
                        num_pax: log.num_pax,
                        country_name: log.country_name,
                        date_in: log.date_in,
                        date_out: log.date_out,
                        property_name: log.property_name,
                        latitude: log.property_latitude,
                        longitude: log.property_longitude,
                    }
                ));
                setApiData(parsedData);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token]);

    useEffect(() => {
        // setLoaded(false);
        if (Array.isArray(apiData)) { // Check if apiData is an array
            const endDate = moment(startDate).endOf('week');

            const filteredData = apiData.filter(item => {
                const dateIn = moment(item.date_in);
                const dateOut = moment(item.date_out);
                return (dateIn.isSameOrAfter(startDate) && dateIn.isSameOrBefore(endDate)) ||
                       (dateOut.isSameOrAfter(startDate) && dateOut.isSameOrBefore(endDate));
            });

            setDisplayData(filteredData);
        }
        // setLoaded(true);
    }, [apiData, startDate]);

    return (
        <>
            <header>
                <Navbar title="Maps" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
                <div className="container center" style={{ width: '100%' }}>
                    <div className="sticky-container">
                        <WeekSelector onWeekChange={handleWeekChange} initialDate={startDate} />
                        <div style={{ fontSize: '1.4rem' }}>
                            <span>Maps from </span>
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
                </div>
                {loaded ? (
                    <>
                        <TravelMap data={displayData} />
                    </>
                    ) : (
                    <div>
                        <CircularPreloader show={true} />
                    </div>
                )}
                </div>
            </main>
        </>
    )
}

export default Maps;
import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
// import Select from 'react-select';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';
// import moment from 'moment';

export const TripReports = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const elems = document.querySelectorAll('.sidenav, .sidenav-overlay');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
        var overlay = document.querySelector('.sidenav-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }, []);

    return (
        <>
            <header>
                <Navbar title="Trip Reports" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                    {userDetails.role === 'admin' ? (
                        <>
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
                        </>
                    ) : (
                        <h5>
                            Coming soon...
                        </h5>
                    )}
                </div>
            </main>
        </>
    )
}

export default TripReports;
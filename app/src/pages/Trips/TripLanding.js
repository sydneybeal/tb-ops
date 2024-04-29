// import React, { useEffect, useState } from 'react';
import React, { useState } from 'react';
// import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
// import moment from 'moment';
import Trips from './Trips';
import PotentialTrips from './PotentialTrips';

export const TripLanding = () => {
    const [pageSelection, setPageSelection] = useState('potential_trips');

    return (
        <>
            <header>
                <Navbar title="Trips" />
            </header>
            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center">
                    <div className="row">
                        <div className="col s12">
                            {/* Buttons for page selection */}
                            <button
                                className={`waves-effect waves-light btn ${pageSelection === 'trips' ? 'tb-teal' : 'grey'}`}
                                onClick={() => setPageSelection('trips')}
                            >
                                All Trips
                            </button>
                            <button
                                className={`waves-effect waves-light btn ${pageSelection === 'potential_trips' ? 'tb-teal' : 'grey'}`}
                                style={{ marginLeft: '10px' }}
                                onClick={() => setPageSelection('potential_trips')}
                            >
                                Potential Trips
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        {pageSelection === 'trips' ? (
                            <Trips />
                        ) : (
                            <PotentialTrips />
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}

export default TripLanding;
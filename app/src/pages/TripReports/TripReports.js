import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../components/AuthContext';
import moment from 'moment';

export const Properties = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            <header>
                <Navbar title="Trip Reports" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    <h5>
                        Coming soon...
                    </h5>
                </div>
            </main>
        </>
    )
}

export default Properties;
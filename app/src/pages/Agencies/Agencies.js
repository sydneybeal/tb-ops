import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import { useRole } from '../../components/RoleContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const Agencies = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const { role } = useRole();

    return (
        <>
            <header>
                <Navbar title="Agency Management" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    {(role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <div>
                            Welcome to Agencies!
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default Agencies;
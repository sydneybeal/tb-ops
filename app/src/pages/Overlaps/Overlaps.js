import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';

export const Overlaps = () => {
    const [apiData, setApiData] = useState({});
    // const [filteredData, setFilteredData] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        M.AutoInit();
        setLoaded(false);
        fetch(`${process.env.REACT_APP_API}/v1/overlaps`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const parsedOverlaps = data.map(log => JSON.parse(log));
                console.log(parsedOverlaps);
                setApiData(parsedOverlaps);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token]);

    console.log(loaded);

    return (
        <>
            <header>
                <Navbar title="Client Overlaps" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <div className="container center">
                                        <table className="accommodation-logs-table center">
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th
                                                    // onClick={() =>
                                                    //     applySorting('last_name')
                                                    // }
                                                    >
                                                        Pax 1
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {/* {sorting.field === 'last_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'} */}
                                                        </span>
                                                    </th>
                                                    <th
                                                    // onClick={() =>
                                                    //     applySorting('first_name')
                                                    // }
                                                    >
                                                        Pax 2
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {/* {sorting.field === 'first_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'} */}
                                                        </span>
                                                    </th>
                                                    <th
                                                    // onClick={() =>
                                                    //     applySorting('first_name')
                                                    // }
                                                    >
                                                        # Nights
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {/* {sorting.field === 'first_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'} */}
                                                        </span>
                                                    </th>
                                                    <th
                                                    // onClick={() =>
                                                    //     applySorting('is_active')
                                                    // }
                                                    >
                                                        Property
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {/* {sorting.field === 'is_active' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'} */}
                                                        </span>
                                                    </th>
                                                    <th
                                                    // onClick={() =>
                                                    //     applySorting('is_active')
                                                    // }
                                                    >
                                                        Consultant
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {/* {sorting.field === 'is_active' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'} */}
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(apiData) && apiData.length > 0 ? (
                                                    apiData.map((item, index) => (
                                                        <React.Fragment key={index}>
                                                            <tr>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.traveler1}</p>
                                                                    <p><span className="chip tb-grey lighten-1">{item.date_in_traveler1}</span></p>
                                                                    <p><span className="chip tb-grey lighten-1">{item.date_out_traveler1}</span></p>
                                                                </td>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.traveler2}</p>
                                                                    <p><span className="chip tb-grey lighten-1">{item.date_in_traveler1}</span></p>
                                                                    <p><span className="chip tb-grey lighten-1">{item.date_out_traveler2}</span></p>
                                                                </td>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.overlap_days}</p>
                                                                </td>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.property_name}</p>
                                                                </td>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.consultant_last_name}/{item.consultant_first_name}</p>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" style={{ textAlign: 'center' }}>No results.</td>
                                                    </tr>
                                                )}
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
            </main>
        </>
    );

};

export default Overlaps;

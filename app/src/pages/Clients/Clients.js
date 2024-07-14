import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import moment from 'moment';

export const Clients = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'display_name', ascending: true });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/clients`, {
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
                if (!Array.isArray(data)) {
                    console.error("Expected an array but got:", data);
                    data = []; // Set data to an empty array if it's not an array
                }
                console.log(JSON.stringify(data[0], null, 2));
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, logout]);

    useEffect(() => {
        // Perform sorting on filteredData
        let sortedData = Array.isArray(apiData) ? [...apiData].sort((a, b) => {
            let aValue = a[sorting.field] !== undefined && a[sorting.field] !== null ? a[sorting.field] : '';
            let bValue = b[sorting.field] !== undefined && b[sorting.field] !== null ? b[sorting.field] : '';

            // If both values are numbers, compare them as numbers.
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sorting.ascending ? aValue - bValue : bValue - aValue;
            }

            // If either value is not a number, convert both to strings and compare.
            // This handles null, undefined, and other non-number types safely.
            aValue = String(aValue);
            bValue = String(bValue);
            return sorting.ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }) : [];
        setDisplayData(sortedData);
    }, [sorting, apiData]);

    /**
  * Sets sorting criteria.
  * @param {string} key - Field name to sort by.
  * @param {boolean} ascending - Sort order: true (ascending), false (descending).
  */
    function applySorting(key) {
        setSorting((prevSorting) => ({
            field: key,
            ascending: prevSorting.field === key ? !prevSorting.ascending : true,
        }));
    };

    function formatAmount(amount) {
        if (amount === null || amount === undefined) return "0.00";
    
        // Convert the number to a float and format it with two decimal places and commas
        const formatted = parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 5,
        });
    
        // Use a regular expression to remove unnecessary trailing zeroes but leave two if they are at the decimal point
        return formatted.replace(/(\.\d*?[1-9])0+$|\.00+$/, '$1');
    }

    return (
        <>
            <header>
                <Navbar title="Clients" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <div style={{ marginBottom: '20px' }}>
                                        <em className="tb-grey-text">
                                            <span className="text-bold tb-teal-text">{displayData?.length?.toLocaleString()}</span> clients
                                        </em>
                                    </div>
                                    <div className="container center" style={{ width: '100%' }}>
                                        <table className="accommodation-logs-table">
                                            <thead>
                                                <tr className="tb-md-black-text text-bold">
                                                    <th
                                                        onClick={() =>
                                                            applySorting('display_name')
                                                        }
                                                    >
                                                        Name
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('lifetime_spend')
                                                        }
                                                    >
                                                        Lifetime Spend
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'lifetime_spend' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('referred_by_display_name')
                                                        }
                                                    >
                                                        Referred By
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'referred_by_display_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('reservations_count')
                                                        }
                                                    >
                                                        # Trips
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'reservations_count' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('referrals_count')
                                                        }
                                                    >
                                                        # Referrals
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'referrals_count' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('trips_plus_referrals')
                                                        }
                                                    >
                                                        Trips + Referrals
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'trips_plus_referrals' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('subjective_score')
                                                        }
                                                    >
                                                        Subjective Score
                                                        <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                            {sorting.field === 'subjective_score' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(displayData) && displayData.length > 0 ? (
                                                    displayData.map((client, index) => (
                                                        <React.Fragment key={client.id}>
                                                            <tr>
                                                                <td>
                                                                    <p className="text-bold">{client.display_name}</p>
                                                                    <span className="chip tb-grey lighten-2">
                                                                        {client.address_city}, {client.address_state}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    ${formatAmount(client.lifetime_spend)}
                                                                </td>
                                                                <td>
                                                                    {client.referred_by_display_name}
                                                                </td>
                                                                <td>
                                                                    <span className="chip tb-teal lighten-2">{client.reservations.length}</span>
                                                                    {Array.isArray(client.reservations) && client.reservations.length > 0 && (
                                                                        <>
                                                                            <br />
                                                                            {client.reservations.sort((a, b) => {
                                                                                return moment(b.start_date).diff(moment(a.start_date));
                                                                            }).map((trip, index) => (
                                                                                <React.Fragment key={trip.id}>
                                                                                    <p>
                                                                                        <span className="text-bold">{moment(trip.start_date).format("MMM 'YY")}</span>
                                                                                        <span>- Africa x{trip.num_pax}</span>
                                                                                    </p>
                                                                                </React.Fragment>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {client.referrals_count}
                                                                </td>
                                                                <td>
                                                                    {client.trips_plus_referrals}
                                                                </td>
                                                                <td>
                                                                    {client.subjective_score} / 100
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center' }}>No results.</td>
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
    )
}

export default Clients;
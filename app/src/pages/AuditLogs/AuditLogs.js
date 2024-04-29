import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import CircularPreloader from '../../components/CircularPreloader';
import moment from 'moment';

export const AuditLogs = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const { userDetails, logout } = useAuth();
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        const elems = document.querySelectorAll('.sidenav, .sidenav-overlay');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
        var overlay = document.querySelector('.sidenav-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }, []);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}/v1/audit_logs`, {
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
                        classes: 'red lighten-2',
                    });
                    logout();
                    return;
                }
                if (!Array.isArray(data)) {
                    console.error("Expected an array but got:", data);
                    data = []; // Set data to an empty array if it's not an array
                }
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token]);

    const toggleRowExpansion = (index) => {
        setExpandedRows(prevExpandedRows => {
            const newExpandedRows = new Set(prevExpandedRows);
            if (newExpandedRows.has(index)) {
                newExpandedRows.delete(index);
            } else {
                newExpandedRows.add(index);
            }
            return newExpandedRows;
        });
    };

    const calculateDifferences = (action, categoryName, before, after) => {
        const differences = {};
        const ignoreKeys = ['created_at', 'representative', 'id']; // Keys to ignore
        const identifierKeys = getIdentifierKeys(categoryName);

        Object.keys({ ...before, ...after }).forEach(key => {
            // Skip the keys that should be ignored
            if (ignoreKeys.includes(key)) {
                return;
            }

            if (before[key] !== after[key]) {
                // Handle formatting for 'updated_at' differently
                if (key === 'updated_at') {
                    const beforeFormatted = before[key] ? moment.utc(before[key]).format('LLLL') : '';
                    const afterFormatted = after[key] ? moment.utc(after[key]).format('LLLL') : '';
                    differences[key] = { before: beforeFormatted, after: afterFormatted };
                } else {
                    // Convert all other values to strings, including boolean values
                    differences[key] = {
                        before: before[key] === undefined ? '' : String(before[key]),
                        after: after[key] === undefined ? '' : String(after[key])
                    };
                }
            } else if (identifierKeys.includes(key)) {
                // For identifier keys, if there is no change, still show the before value and indicate no change
                differences[key] = {
                    before: before[key] === undefined ? '' : String(before[key]),
                    after: '(no change)'
                };
            }
        });

        return differences;
    };

    const getIdentifierKeys = (category) => {
        switch (category) {
            case 'accommodation_logs':
                return ['primary_traveler', 'date_in', 'date_out'];
            case 'properties':
                return ['name', 'portfolio', 'country'];
            case 'consultants':
                return ['first_name', 'last_name'];
            case 'agencies':
                return ['name'];
            case 'portfolios':
                return ['name'];
            case 'booking_channels':
                return ['name'];
            case 'countries':
                return ['name'];
            case 'property_details':
                return ['property_id'];
            default:
                return [];
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'update':
                return 'warning-yellow-light';
            case 'delete':
                return 'error-red-light';
            case 'insert':
                return 'success-green-light';
            default:
                return 'tb-grey'; // Default color if action does not match
        }
    };

    const getActionSymbol = (action) => {
        switch (action) {
            case 'update':
                return 'draw';
            case 'delete':
                return 'delete';
            case 'insert':
                return 'library_add';
            default:
                return 'help'; // Default color if action does not match
        }
    }


    const actionEntityNames = {
        accommodation_logs: "service provider entry",
        booking_channels: "booking channel",
        agencies: "agency",
        properties: "property",
        consultants: "consultant",
        portfolios: "portfolio",
        countries: "country",
        trips: "trip",
        property_details: "property detail"
    };
    // const actionNames = {
    //     update: "updated",
    //     insert: "added",
    //     delete: "deleted",
    // };

    return (
        <>
            <header>
                <Navbar title="Audit Logs" />
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

                                <div className="container center" style={{ width: '60%' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <em className="tb-grey-text">
                                            Displaying <span className="text-bold tb-teal-text">{apiData?.length?.toLocaleString()}</span> total audit logs from the past <span className="text-bold tb-teal-text">7</span> days.
                                        </em>
                                    </div>
                                    {Array.isArray(apiData) && apiData.length > 0 ? (
                                        <>
                                            <table>
                                                <tbody>
                                                    {apiData.map((item, index) => {
                                                        // Assuming displayName is a variable you have defined elsewhere that determines the number of records
                                                        // Adjust this logic based on what you actually need
                                                        const category = item.table_name;
                                                        const action = item.action;

                                                        // const categoryColor = getCategoryColor(category);
                                                        const actionColor = getActionColor(action);

                                                        const actionSymbol = getActionSymbol(action);
                                                        const categoryName = actionEntityNames[category] ||
                                                            category.charAt(0).toUpperCase() + category.slice(1);
                                                        // const actionName = actionNames[action] ||
                                                        //     action.charAt(0).toUpperCase() + action.slice(1);

                                                        return (
                                                            <React.Fragment key={index}>
                                                                <tr key={index}>
                                                                    <td onClick={() => toggleRowExpansion(index)}>
                                                                        <span className="material-symbols-outlined text-bold">expand_more</span>
                                                                    </td>
                                                                    <td onClick={() => toggleRowExpansion(index)}>
                                                                        <div className="chip tb-teal lighten-3">
                                                                            <span className="material-symbols-outlined">
                                                                                schedule
                                                                            </span>
                                                                            {moment.utc(item.action_timestamp).local().format('ddd MMM D, h:mma')}
                                                                        </div>
                                                                    </td>
                                                                    <td onClick={() => toggleRowExpansion(index)}>
                                                                        <div className={`chip ${actionColor} text-bold tb-md-black-text`}>
                                                                            <span className="material-symbols-outlined">
                                                                                {actionSymbol}
                                                                            </span>
                                                                            {categoryName}
                                                                        </div>
                                                                    </td>
                                                                    <td onClick={() => toggleRowExpansion(index)}>
                                                                        <span className="material-symbols-outlined">
                                                                            person
                                                                        </span>
                                                                        <span className="text-bold grey-text text-darken-2">{item.user_name.split('@')[0]} </span>
                                                                    </td>
                                                                </tr>
                                                                {
                                                                    expandedRows.has(index) && (
                                                                        <tr>
                                                                            <td colSpan="4" style={{ padding: '0px' }}> {/* Adjust colspan as needed */}
                                                                                <div className="tb-grey lighten-4" style={{ padding: '10px' }}>
                                                                                    {Object.entries(calculateDifferences(action, category, item.before_value, item.after_value)).map(([key, { before, after }]) => (
                                                                                        <div key={key}>
                                                                                            <span>{key}: </span>
                                                                                            <span style={{ color: 'grey' }}>{before}</span>
                                                                                            <span> ➔ </span>
                                                                                            <span style={{ color: 'teal', fontWeight: 'bold' }}>{after}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                }
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </>


                                    ) : (
                                        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                                            <em className="grey-text text-lighten-1">No audit logs found.</em>
                                        </div>
                                    )}
                                </div>
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
    )
};

export default AuditLogs;
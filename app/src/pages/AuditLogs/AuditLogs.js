import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

export const AuditLogs = ({ auditLogs }) => {
    const [expandedRows, setExpandedRows] = useState(new Set());

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
        potential_trips: "flagged trips",
        property_details: "property detail"
    };

    return (
        <>
            <table>
                <tbody>
                    {Array.isArray(auditLogs) && auditLogs.length > 0 && auditLogs.map((item, index) => {
                        const category = item.table_name;
                        const action = item.action;

                        const actionColor = getActionColor(action);

                        const actionSymbol = getActionSymbol(action);
                        const categoryName = actionEntityNames[category] ||
                            category.charAt(0).toUpperCase() + category.slice(1);
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
    )
};

export default AuditLogs;
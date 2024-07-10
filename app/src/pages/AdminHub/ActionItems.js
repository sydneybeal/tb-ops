import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import moment from 'moment';

export const ActionItems = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [sorting, setSorting] = useState({ field: 'is_active', ascending: false });
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1400);

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1400);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/admin_comments`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
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
            <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                {loaded ? (
                    <>
                        <table className="accommodation-logs-table center">
                            <thead>
                                <tr className="tb-md-black-text text-bold">
                                    <th>
                                        Update Type
                                    </th>
                                    <th>
                                        Property Name
                                    </th>
                                    <th>
                                        Comment
                                    </th>
                                    <th>
                                        Reported By
                                    </th>
                                    <th>
                                        Trip Report
                                    </th>
                                    <th>
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(displayData) && displayData.length > 0 ? (
                                    displayData.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <tr>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    <p className="text-bold">
                                                        {item.comment_type === 'attribute_update' ? 'Property' :
                                                        item.comment_type === 'document_update' ? 'Document' :
                                                        ''}
                                                    </p>
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    (property name)
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    {item.comment}
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    (reported by)
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    (trip report link)
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    <span className={`chip ${item.status === 'unreviewed' ? 'indigo lighten-3' : 'success-green'}`}>
                                                        {item.status === 'unreviewed' ? 'PENDING' : 'COMPLETE'}
                                                    </span>
                                                </td>
                                            </tr>
                                            </React.Fragment>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="1" style={{ textAlign: 'center' }}>No results.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div>
                        <CircularPreloader show={true} />
                    </div>
                )}
                </div>
        </>
    )
}

export default ActionItems;
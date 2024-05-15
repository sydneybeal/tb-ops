import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import AuditLogs from './AuditLogs';
import CircularPreloader from '../../components/CircularPreloader';

export const AuditLanding = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const { userDetails, logout } = useAuth();

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
                                            <AuditLogs auditLogs={apiData} />
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

export default AuditLanding;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import ActionItems from './ActionItems';

export const AdminHub = () => {
    const { userDetails } = useAuth();
    const [pageSelection, setPageSelection] = useState('action items');

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    useEffect(() => {
        // init to get the navbar to go away
        let elems = document.querySelectorAll('.sidenav');
        let instance = M.Sidenav.init(elems, {});
        return () => {
            if (document.body.contains(instance.el)) {
                instance.destroy();
            }
        }
    }, []);

    return (
        <>
            <header>
                <Navbar title={`Admin Hub: ${toTitleCase(pageSelection)}`} />
            </header>
            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="center">
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            <div className="row">
                                <div className="col s12">
                                    {/* Buttons for page selection */}
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'action items' ? 'tb-teal' : 'grey'}`}
                                        onClick={() => setPageSelection('action items')}
                                    >
                                        Action Items
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'pending properties' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('pending properties')}
                                    >
                                        Pending Properties
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'user management' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('user management')}
                                    >
                                        User Management
                                    </button>
                                </div>
                            </div>
                            <div className="row">
                                {pageSelection === 'action items' ? (
                                    <ActionItems/>
                                ) : pageSelection === 'pending properties' ? (
                                    <p>Pending Properties coming soon.</p>
                                ) : pageSelection === 'user management' ? (
                                    <p>User Management coming soon.</p>
                                ) : (
                                    <></>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}

export default AdminHub;
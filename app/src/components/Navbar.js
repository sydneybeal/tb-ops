import React, { useEffect } from 'react';
import M from 'materialize-css';
import { Link } from 'react-router-dom';
import { useRole } from './RoleContext';

const Navbar = ({ title }) => {
    // State to keep track of the current role
    const { role, setRole } = useRole();
    const { userName, setUserName } = useRole();

    useEffect(() => {
        // Initialize Sidenav
        let elems = document.querySelectorAll('.sidenav');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
        let dropdowns = document.querySelectorAll('.dropdown-trigger');
        M.Dropdown.init(dropdowns, {});
    }, []);

    return (
        <>
            <nav className="top-nav">
                <div className="nav-wrapper">
                    <div className="row">
                        <div className="col s12 m7 grey-text text-darken-3">
                            <h4 className="header">{title}</h4>
                        </div>
                        <div className="col s12 m3">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-symbols-outlined grey-text" style={{ fontSize: '2rem' }}>
                                    account_circle
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    onChange={(e) => setUserName(e.target.value)}
                                    value={userName}
                                    style={{ flexShrink: 1, marginTop: '10px', paddingLeft: '10px' }}
                                    className="grey-text text-darken-2"
                                />
                            </div>
                        </div>
                        <div className="col s12 m2">
                            <button className='dropdown-trigger btn' href='#' data-target='role-dropdown'>Role: {role}</button>
                            <ul id='role-dropdown' className='dropdown-content'>
                                <li><a href="#!" onClick={() => setRole('admin')}>Admin</a></li>
                                <li><a href="#!" onClick={() => setRole('user')}>User</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="container">
                <a href="/#" data-target="slide-out" className="top-nav sidenav-trigger full hide-on-large-only">
                    <i className="material-icons">menu</i>
                </a>
            </div>
            <ul id="slide-out" className="sidenav sidenav-fixed" style={{ transform: 'translateX(0%)' }}>
                <li className="logo">
                    <a id="logo-container" href="/" className="brand-logo">
                        <img
                            id="front-page-logo"
                            src={`${process.env.PUBLIC_URL}/tbops.png`}
                            alt="tb operations"
                            style={{ maxWidth: '100px', display: 'block', margin: '0 auto' }} />
                    </a>
                </li>
                <div className="container" style={{ width: '100%' }}>
                    <li>
                        <Link to={'/service_providers'} className="text-bold">
                            Service Providers
                        </Link>
                    </li>
                </div>
                <div className="container" style={{ width: '100%' }}>
                    <li>
                        <Link to={'/bed_night_reports'} className="text-bold">
                            Bed Night Reports
                        </Link>
                    </li>
                </div>
                <div className="container" style={{ width: '100%' }}>
                    <li>
                        <Link to={'/trip_reports'} className="text-bold">
                            Trip Reports
                        </Link>
                    </li>
                </div>
                {role === 'admin' && (
                    <>
                        <div className="container" style={{ width: '80%' }}>
                            <li>
                                <div className="chip small grey lighten-2">
                                    ADMIN
                                </div>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/properties'} className="text-bold">
                                    Manage Properties
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/consultants'} className="text-bold">
                                    Manage Consultants
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/agencies'} className="text-bold">
                                    Manage Agencies
                                </Link>
                            </li>
                        </div>
                    </>
                )}

            </ul>
        </>
    );
};

export default Navbar;

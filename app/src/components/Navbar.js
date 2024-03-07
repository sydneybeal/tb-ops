import React, { useEffect } from 'react';
import M from 'materialize-css';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ title }) => {
    const { userDetails, logout } = useAuth();

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
                    <div className="row" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', justifyContent: 'space-between' }}>
                        <div className="col s12 m6 grey-text text-darken-3">
                            <h4 className="header">{title}</h4>
                        </div>
                        {userDetails &&
                            <>
                                <div className="col s12 m6" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                                    >
                                        <span className="material-symbols-outlined grey-text" style={{ fontSize: '2rem' }}>
                                            account_circle
                                        </span>
                                        <span className="grey-text text-darken-2">
                                            Welcome, <span className="text-bold">{userDetails.email.split('@')[0]}</span>
                                        </span>

                                        {userDetails.role === 'admin' &&
                                            <span className="chip green lighten-4 dark-grey-text text-darken-5 text-bold" style={{ margin: '0px' }}>
                                                {userDetails.role.toUpperCase()}
                                            </span>
                                        }

                                        <button
                                            className='btn btn-floating red lighten-2'
                                            onClick={logout}
                                            style={{ margin: '0px' }}
                                        >
                                            <span className="material-symbols-outlined">
                                                logout
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        }
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
                {userDetails?.role === 'admin' && (
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
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/booking_channels'} className="text-bold">
                                    Manage Booking Channels
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/audit_logs'} className="text-bold">
                                    Audit Logs
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

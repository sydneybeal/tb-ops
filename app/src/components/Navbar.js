import React, { useEffect } from 'react';
import M from 'materialize-css';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ title }) => {
    const { userDetails, logout } = useAuth();
    const version = 'v0.1.23';

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
                <div className="nav-wrapper container tb-md-black-text" style={{ width: '95%' }} >
                    <div className="row" style={{ margin: 0, alignItems: 'center' }}>
                        {/* Sidenav Trigger */}
                        <div className="col s2 m2 hide-on-large-only">
                            <a href="/#" data-target="slide-out" className="sidenav-trigger tb-teal-text text-darken-4">
                                <i className="material-icons">menu</i>
                            </a>
                        </div>
                        {/* Title */}
                        <div className="col s8 m8 l6 header-container" >
                            <h4 className="header hide-on-large-only center-align" style={{ margin: 0, marginTop: '20px', fontSize: '1.8rem' }}>
                                {title}
                            </h4>
                            <h4 className="header hide-on-med-and-down left-align" style={{ margin: 0, marginTop: '20px', fontSize: '2.0rem' }}>
                                {title}
                            </h4>

                            {/* User info for small and medium screens */}
                            {userDetails && (
                                <div className="hide-on-large-only center-align" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <i className="material-icons" style={{ fontSize: '1.2rem' }}>account_circle</i>
                                    <span className="text-bold" style={{ margin: '0 5px' }}>{userDetails.email.split('@')[0]}</span>
                                    {userDetails.role === 'admin' && (
                                        <>
                                            <span className="chip tb-teal lighten-4 tb-md-black-text text-bold" style={{ margin: '0px' }}>
                                                {userDetails.role.toUpperCase()}
                                            </span>
                                            <span className="tb-teal-text text-bold" style={{ margin: '0px' }}>
                                                &nbsp;{version}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* User Info & Logout for large screens */}
                        {userDetails && (
                            <div className="col l6 hide-on-med-and-down right-align" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <i className="material-icons" style={{ fontSize: '1.2rem' }}>account_circle</i>
                                <span className="hide-on-med-and-down" > Welcome, </span>
                                <span className="text-bold" style={{ margin: '0 5px' }}>
                                    {userDetails.email.split('@')[0]}
                                </span>
                                {userDetails.role === 'admin' && (
                                    <>
                                        <span className="chip tb-teal lighten-4 tb-md-black-text text-bold" style={{ margin: '0px 10px 0px 0px' }}>
                                            {userDetails.role.toUpperCase()}
                                        </span>
                                        <span className="tb-teal-text text-bold" style={{ margin: '0px' }}>
                                            {version}
                                        </span>
                                    </>
                                )}
                                <button className='btn btn-floating error-red' onClick={logout} style={{ height: '30px', width: '30px', lineHeight: '30px', padding: '0', marginLeft: '10px' }}>
                                    <i className="material-icons" style={{ fontSize: '18px', lineHeight: '30px' }}>logout</i>
                                </button>
                            </div>
                        )}
                        {/* Logout button for small and medium screens */}
                        {userDetails && (
                            <div className="col s2 m2 hide-on-large-only right-align">
                                <button className='btn btn-floating error-red' onClick={logout} style={{ height: '30px', width: '30px', lineHeight: '30px', padding: '0' }}>
                                    <i className="material-icons" style={{ fontSize: '18px', lineHeight: '30px' }}>logout</i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav >
            <ul id="slide-out" className="sidenav sidenav-fixed" style={{ transform: 'translateX(0%)' }}>
                <li className="logo">
                    <a id="logo-container" href="/" className="brand-logo">
                        <img
                            id="front-page-logo"
                            src={`${process.env.PUBLIC_URL}/rrlogo.png`}
                            alt="roam & report"
                            style={{
                                maxWidth: '70%',
                                height: 'auto', // Ensures the height scales in proportion to the width
                                objectFit: 'contain', // Keeps the aspect ratio and fits the content within the bounds of its container
                                display: 'block',
                                margin: '0 auto'
                            }} />
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
                {/* <div className="container" style={{ width: '100%' }}>
                    <li>
                        <Link to={'/trip_reports'} className="text-bold">
                            Trip Reports
                        </Link>
                    </li>
                </div> */}
                <div className="container" style={{ width: '100%' }}>
                    <li>
                        <Link to={'/faq'} className="text-bold">
                            FAQ
                        </Link>
                    </li>
                </div>
                {userDetails?.role === 'admin' && (
                    <>
                        <div className="container" style={{ width: '80%' }}>
                            <li>
                                <div className="chip small tb-grey lighten-3">
                                    ADMIN
                                </div>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/overlaps'} className="text-bold">
                                    Client Overlaps
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/properties'} className="text-bold">
                                    Properties
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/consultants'} className="text-bold">
                                    Consultants
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/agencies'} className="text-bold">
                                    Agencies
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/booking_channels'} className="text-bold">
                                    Booking Channels
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/portfolios'} className="text-bold">
                                    Portfolios
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/countries'} className="text-bold">
                                    Countries
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/trips'} className="text-bold">
                                    <span className="material-symbols-outlined">
                                        casino
                                    </span>
                                    Trip Matching
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
                        <div className="container" style={{ width: '80%' }}>
                            <li>
                                <div className="chip small tb-teal lighten-3">
                                    BETA
                                </div>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/property_details'} className="text-bold">
                                    Property Details
                                </Link>
                            </li>
                        </div>
                        <div className="container" style={{ width: '100%' }}>
                            <li>
                                <Link to={'/looker_reports'} className="text-bold">
                                    Looker Reports
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

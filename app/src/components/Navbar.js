import React, { useEffect } from 'react';
import M from 'materialize-css';
import { Link } from 'react-router-dom';

const Navbar = ({ title }) => {
    useEffect(() => {
        // Initialize Sidenav
        let elems = document.querySelectorAll('.sidenav');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
    }, []);

    return (
        <>
            <nav className="top-nav">
                <div className="nav-wrapper">
                    <div className="row">
                        <div className="col s12 m10 grey-text text-darken-3">
                            <h4 className="header">{title}</h4>
                        </div>
                    </div>
                </div>
            </nav>
            <div className="container">
                <a href="#" data-target="slide-out" className="top-nav sidenav-trigger full hide-on-large-only">
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
                    <li className="bold">
                        <Link to={'/service_providers'}>
                            Service Providers
                        </Link>
                    </li>
                </div>
                <div className="container" style={{ width: '100%' }}>
                    <li className="bold">
                        <Link to={'#'}>
                            Properties
                        </Link>
                    </li>
                </div>
                <div className="container" style={{ width: '100%' }}>
                    <li className="bold">
                        <Link to={'#'}>
                            Consultants
                        </Link>
                    </li>
                </div>
                <div className="container" style={{ width: '100%' }}>
                    <li className="bold">
                        <Link to={'#'}>
                            Trip Reports
                        </Link>
                    </li>
                </div>
            </ul>
        </>
    );
};

export default Navbar;

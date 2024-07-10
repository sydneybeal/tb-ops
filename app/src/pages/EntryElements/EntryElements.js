// import React, { useEffect, useState } from 'react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import Properties from '../Properties/Properties';
import Consultants from '../Consultants/Consultants';
import Agencies from '../Agencies/Agencies';
import BookingChannels from '../BookingChannels/BookingChannels';
import Portfolios from '../Portfolios/Portfolios';
import Countries from '../Countries/Countries';

export const EntryElements = () => {
    const { userDetails } = useAuth();
    const [pageSelection, setPageSelection] = useState('properties');

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
                <Navbar title={`Entry Elements: ${toTitleCase(pageSelection)}`} />
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
                                        className={`waves-effect waves-light btn ${pageSelection === 'properties' ? 'tb-teal' : 'grey'}`}
                                        onClick={() => setPageSelection('properties')}
                                    >
                                        Properties
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'portfolios' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('portfolios')}
                                    >
                                        Portfolios
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'consultants' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('consultants')}
                                    >
                                        Consultants
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'agencies' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('agencies')}
                                    >
                                        Agencies
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'booking channels' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('booking channels')}
                                    >
                                        Booking Channels
                                    </button>
                                    <button
                                        className={`waves-effect waves-light btn ${pageSelection === 'countries' ? 'tb-teal' : 'grey'}`}
                                        style={{ marginLeft: '10px' }}
                                        onClick={() => setPageSelection('countries')}
                                    >
                                        Countries
                                    </button>
                                </div>
                            </div>
                            <div className="row">
                                {pageSelection === 'properties' ? (
                                    <Properties />
                                ) : pageSelection === 'consultants' ? (
                                    <Consultants />
                                ) : pageSelection === 'agencies' ? (
                                    <Agencies />
                                ) : pageSelection === 'booking channels' ? (
                                    <BookingChannels />
                                ) : pageSelection === 'portfolios' ? (
                                    <Portfolios />
                                ) : pageSelection === 'countries' ? (
                                    <Countries />
                                ) : (
                                    <></>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    )
}

export default EntryElements;
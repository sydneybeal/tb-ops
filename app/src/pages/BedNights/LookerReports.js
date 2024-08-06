// import React, { useEffect, useState } from 'react';
import React from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import LookerDashboard from './LookerDashboard';
import { useAuth } from '../../components/AuthContext';

export const LookerReports = () => {
    const { userDetails } = useAuth();
    const reports = {
        "country": "c32e1255-81ce-4d31-9363-77e24a1ee917/page/AGQtD",
        "heatMap": "0e7273c2-c5f9-4ab0-a622-6798c0ee0345/page/nmXtD",
        "africaByYear": "84feb0c8-5400-4db5-8f23-ca7aa347ede1/page/AGQtD"
    }

    return (
        <>
            <header>
                <Navbar title="Looker Reports" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container" style={{ width: '90%', paddingBottom: '100px' }}>
                {(userDetails.role !== 'admin') ? (
                        <div className="center">
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                    <div className="row">
                        <h3 style={{ fontFamily: 'Bodoni, sans-serif', marginBottom: '20px' }}>By Country</h3>
                        <LookerDashboard by="Bed Nights By Country" url={reports["country"]} />
                    </div>
                    <hr className="report-divider" />
                    <div className="row">
                        <h3 style={{ fontFamily: 'Bodoni, sans-serif', marginBottom: '20px' }}>Africa By Year</h3>
                        <LookerDashboard by="Africa By Year" url={reports["africaByYear"]} />
                    </div>
                    <hr className="report-divider" />
                    <div className="row">
                        <h3 style={{ fontFamily: 'Bodoni, sans-serif', marginBottom: '20px' }}>Client Heat Map Per Capita</h3>
                        <LookerDashboard by="Client Heat Map" url={reports["heatMap"]} />
                    </div>
                    </>
                    )}
                </div>
            </main>
        </>
    );

};

export default LookerReports;
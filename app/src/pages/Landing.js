import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const Landing = () => {

    return (
        <>
            <header>
                <Navbar />
            </header>
            <main>
                <div className="container" style={{ width: '100%' }}>
                    Hello world
                </div>
            </main>
        </>
    );
};

export default Landing;
import React from 'react';
import Navbar from '../components/Navbar';

const Landing = () => {

    return (
        <>
            <header>
                <Navbar title="Home" />
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
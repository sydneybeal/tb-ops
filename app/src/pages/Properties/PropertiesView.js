// import React, { useEffect, useState } from 'react';
import React, { useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import Navbar from '../../components/Navbar';
import Properties from '../Properties/Properties';

export const PropertiesView = () => {

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
                <Navbar title='Properties' />
            </header>
            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="center">
                    <div className="row">
                        <Properties />        
                    </div>
                </div>
            </main>
        </>
    )
}

export default PropertiesView;

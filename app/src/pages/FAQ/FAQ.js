import React, { useEffect } from 'react';
// import React, { useEffect, useState } from 'react';
// import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import Navbar from '../../components/Navbar';
// import ReactDatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const FaqPage = () => {
    // const { userDetails } = useAuth();
    // const [apiData, setApiData] = useState([]);
    // const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const elems = document.querySelectorAll('.sidenav, .sidenav-overlay');
        M.Sidenav.init(elems, {}); // If you have options, they would go inside the {}
        var overlay = document.querySelector('.sidenav-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }, []);

    return (
        <>
            <header>
                <Navbar title="FAQ" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container" style={{ width: '90%' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                How do I know how to enter travelers into R&R?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            Use the following guidelines to determine bed night entry:
                            <ul className="custom-icons">
                                <li>In general, build the primary travelers/service providers like the Res Cards in CB+.</li>
                                <li>The person paying for the accommodation is the primary traveler.</li>
                                <li>There should only be one traveler name on each entry.</li>
                                <li>
                                    Do NOT enter bed nights for FAM trips, charity trips, personal TB trips,
                                    or any other discounted travel.
                                </li>
                                <li>
                                    When in doubt: Do what makes sense. Keep in mind the purpose of R&R
                                    is to have an accurate reflection of bed nights per location.
                                    How can you best represent that?
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                What if a client cancels?
                            </span>
                        </div>
                        <div>
                            <ul className="custom-icons">
                                <li>If the client cancels AFTER FULL PAYMENT has been made, the bed nights stay in R&R.</li>
                                <li>If the client cancels AFTER DEPOSIT but BEFORE FULL PAYMENT, remove the bed nights from R&R.</li>
                            </ul>
                        </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                What service providers do I enter?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            All service providers for all CORE destinations and the following non-core destinations:
                            <ul className="custom-icons">
                                <li>
                                    Australia, including all states and islands
                                </li>
                                <li>
                                    Bhutan
                                </li>
                                <li>
                                    Bolivia
                                </li>
                                <li>
                                    Colombia
                                </li>
                                <li>
                                    Costa Rica
                                </li>
                                <li>
                                    India
                                </li>
                                <li>
                                    Maldives
                                </li>
                                <li>
                                    Malaysia
                                </li>
                                <li>
                                    New Zealand
                                </li>
                                <li>
                                    Panama
                                </li>
                                <li>
                                    Singapore
                                </li>
                                <li>
                                    Uruguay
                                </li>
                            </ul>

                            Other notes about destinations:
                            <ul className="custom-icons">
                                <li>
                                    Only enter overnight stays (no day rooms)
                                </li>
                                <li>
                                    If clients travel outside of our core destinations for a period of their trip
                                    (ex: South America trip that includes Paraguay) only enter the core destination
                                    and/or tracked non-core destination stays as noted above.
                                </li>
                            </ul>


                        </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                What ships are entered?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            All ships for all destinations:
                            <ul className="custom-icons">
                                <li>
                                    <span className="text-bold tb-teal-text">Expedition Ships: </span>
                                    <ul>
                                        <li>
                                            Enter all expedition ships: Lindblad, Quasar, Ecoventura, etc
                                        </li>
                                        <li>
                                            Enter all locations: Galápagos, Antarctica, other “expedition style” cruises
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="text-bold tb-teal-text">All River Boats: </span>
                                    <ul>
                                        <li>
                                            Enter specialized river lines: Aqua Expeditions (Amazon & Mekong), Ananda
                                        </li>
                                        <li>
                                            Enter traditional river Lines: Ama, Viking, Uniworld
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="text-bold tb-teal-text">Smaller “Experience” Boats: </span>
                                    <ul>
                                        <li>
                                            Enter experience boats: Sanctuary's Nile River Boat, Burma Boating, Vietnam Junks, etc.
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                            Other notes about ships:
                            <ul className="custom-icons">
                                <li>
                                    Only enter overnight stays (no day trips)
                                </li>
                                <li>
                                    Do not enter non-core destination pre- or post-hotel stays
                                </li>
                            </ul>



                        </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                What rail journeys are entered?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            All rail journeys for all destinations:
                            <ul className="custom-icons">
                                <li>
                                    Blue Train & Rovos Rail (Africa)
                                </li>
                                <li>
                                    Belmond Rail (Peru)
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                live_help
                            </span>
                            <span className="text-bold">
                                What if a property/service provider does not exist?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            Enter "Placeholder" for the time being, then email Steph and Joleen to add.
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export default FaqPage;

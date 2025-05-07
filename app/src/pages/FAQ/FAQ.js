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

            <main className="tb-grey lighten-6" style={{ paddingTop: '60px' }}>
                <div className="container" style={{ width: '90%', paddingBottom: '100px' }}>
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
                                <li>Make sure the name in R&R matches the name of the primary traveler in CB+ exactly.</li>
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
                                How do I enter TB FAMs, personal travel, and hosted FAMs into R&R?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            Enter service providers as normal, but select <span className="text-bold tb-teal-text">FAM/TB Travel</span> as the <span className="text-bold">booking channel</span>. This will exclude the entry from Bed Night Reports.
                            <ul className="custom-icons">
                                <li>TB FAMs and personal travel, select <span className="text-bold tb-teal-text">n/a</span> for the <span className="text-bold">agency</span>.</li>
                                <li>Hosted FAMs, select the appropriate agency.</li>
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
                                <li>If the client cancels and the vendor is <span className="text-bold">paid in full</span>, the bed nights stay in R&R.</li>
                                <li>If the client cancels and the vendor was <span className="text-bold">only paid deposit</span>, or is <span className="text-bold">offering a refund</span>, remove the bed nights from R&R.</li>
                                <li>We only count nights that vendors get full payment for, if they are refunding anything we delete it.</li>
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
                                What if a client postpones?
                            </span>
                        </div>
                        <div>
                            <ul className="custom-icons">
                                <li>If the vendors are moving some/all the funds paid to the new dates, you can edit the bed night entries to match the new travel dates.</li>
                                <li>
                                    If the client has not confirmed the new travel dates, you can send Steph and Joleen
                                    a request to delete the original nights and add the new travel dates following confirmation,
                                    as normal.
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
                                Dayrooms - only enter if client paid the full nightly rate to secure the room. If
                                costing has a reduced dayroom rate, it should not be entered.
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
                                How do I enter Kilimanjaro and Inca Trail Treks?
                            </span>
                        </div>
                        <div>
                            <ul className="custom-icons">
                                <li>
                                Kilimanjaro - Select <span className="text-bold">Kilimanjaro Climb</span> as the property and include all dates of trek.  Do not enter each camp individually.
                                </li>
                                <li>
                                Inca Trail - If booked through Explorandes, select <span className="text-bold">Inca Trail Explorandes</span> as the property and include all dates of trek. If booked through another supplier, please email Steph or Joleen to add a new property.
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
                                How are migrational camps tracked?
                            </span>
                        </div>
                        <div>
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            One location is listed for each migrational camp.  Do not add a new property for each seasonal location.
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

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
import Navbar from '../../components/Navbar';
// import ReactDatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const FaqPage = ({ isOpen, onClose, onRefresh, editPortfolioData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            <header>
                <Navbar title="FAQ" />
            </header>

            <main className="grey lighten-5">
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
                                How do I know how to enter travelers into
                                <span className="amber-text text-darken-2"> (the system/R&R/something)</span>
                                ?
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
                            <ul class="custom-icons">
                                <li>In general, build the primary travelers/service providers like the Res Cards in CB+.</li>
                                <li>The person paying for the accommodation is the primary traveler.</li>
                                <li><span className="amber-text text-darken-2">(Remove this? not applicable)</span> There should only be one traveler name on each line.</li>
                                <li>
                                    Do NOT enter bed nights for FAM trips, charity trips, personal TB trips,
                                    or any other discounted travel.
                                </li>
                                <li>
                                    When in doubt: Do what makes sense. Keep in mind the purpose of <span className="amber-text text-darken-2"> (the system/R&R/something) </span>
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
                            <span
                                className="material-symbols-outlined grey-text text-darken-2"
                                style={{ marginRight: '10px' }}
                            >
                                menu_book
                            </span>
                            Rule of thumb:
                            <ul class="custom-icons">
                                <li>If the client cancels AFTER FULL PAYMENT has been made, the bed nights stay on <span className="amber-text text-darken-2"> (the system/R&R/something)</span>.</li>
                                <li>If the client cancels AFTER DEPOSIT but BEFORE FULL PAYMENT, remove the bed nights from <span className="amber-text text-darken-2"> (the system/R&R/something)</span>.</li>
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
                            All service providers for all CORE destinations and SOME non-core destinations:
                            <ul class="custom-icons">
                                <li>
                                    <span className="text-bold tb-teal-text">Africa: </span>
                                    All Southern Africa, East Africa and Egypt destinations
                                    <ul>
                                        <li>
                                            <span className="tb-teal-text">Southern Africa: </span>
                                            Botswana, Malawi, Mozambique, Namibia, South Africa, Zambia, Zimbabwe, Seychelles, Mauritius, Madagascar
                                        </li>
                                        <li>
                                            <span className="tb-teal-text">East Africa: </span>
                                            Kenya, Rwanda, Tanzania (Zanzibar), Uganda, Seychelles
                                        </li>
                                        <li>
                                            Egypt
                                        </li>
                                        <li>
                                            Do not enter any other Africa countries (Morocco, DRC, etc)
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="text-bold tb-teal-text">Southeast Asia: </span>
                                    All SEA core destinations
                                    <ul>
                                        <li>
                                            Cambodia, Laos, Myanmar (Burma), Thailand, Vietnam and Indonesia
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="text-bold tb-teal-text">Latin America: </span>
                                    All South America core destinations
                                    <ul>
                                        <li>
                                            Argentina, Brazil, Chile, Ecuador (Galapagos), Peru
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <span className="text-bold tb-teal-text">Non-Core Destinations:
                                        <span className="amber-text text-darken-2"> (Removed the "In Southeast Asia Tab" language. This section needs some more consideration.)</span>
                                    </span>
                                    <ul>
                                        <li>

                                        </li>
                                        <li>
                                            Australia, including all states and islands  (Antipodes)
                                        </li>
                                        <li>
                                            Bhutan (Southeast Asia)
                                        </li>
                                        <li>
                                            Bolivia (Latin America)
                                        </li>
                                        <li>
                                            Colombia (Latin America)
                                        </li>
                                        <li>
                                            Costa Rica (Latin America)
                                        </li>
                                        <li>
                                            India
                                        </li>
                                        <li>
                                            Maldives (Southeast Asia)
                                        </li>
                                        <li>
                                            Malaysia (Southeast Asia)
                                        </li>
                                        <li>
                                            New Zealand (Antipodes)
                                        </li>
                                        <li>
                                            Panama (Latin America)
                                        </li>
                                        <li>
                                            Singapore (Southeast Asia)
                                        </li>
                                        <li>
                                            Tahiti (Antipodes)
                                        </li>
                                        <li>
                                            Uruguay (Latin America)
                                        </li>
                                    </ul>
                                </li>
                            </ul>

                            Other notes about destinations:
                            <ul class="custom-icons">
                                <li>
                                    Only enter overnight stays (no day rooms)
                                </li>
                                <li>
                                    If clients travel outside of our core destinations for a period of their trip
                                    (ex: South America trip that includes Uruguay) only enter the core destination
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
                            <ul class="custom-icons">
                                <li>
                                    <span className="text-bold tb-teal-text">Expedition Ships: </span>
                                    <ul>
                                        <li>
                                            Enter all expedition ships: Lindblad, Quasar, Ecoventura, Zegrahm Expeditions, etc
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
                                            Enter specialized river lines: Aqua Expeditions (Amazon & Mekong), Delfin, Pandaw
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
                                <li>
                                    <span className="text-bold tb-teal-text">Larger Boats: </span>
                                    <ul>
                                        <li>
                                            Enter all larger ocean lines: Silversea, Disney, Seabourn, etc.
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                            Other notes about ships:
                            <ul class="custom-icons">
                                <li>
                                    Only enter overnight stays (no day trips)
                                </li>
                                <li>
                                    <span className="amber-text text-darken-2">(Re-word this) </span>
                                    Enter core destination pre- or post-night hotel stays in the appropriate core destination page
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
                            All rail journeys for all destinations (use the RAIL tab)
                            <ul class="custom-icons">
                                <li>
                                    Blue Train & Rovos Rail (Africa)
                                </li>
                                <li>
                                    Belmond Rail (Peru)
                                </li>
                                <li>
                                    Great Southern Rail (Australia)
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
                                <span className="amber-text text-darken-2">(Re-word ALL of this) </span>
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
                            <span className="amber-text text-darken-2">(Something about admins can create new properties/agencies etc) </span>
                            Add the service provider to the ___ first. Then create their bed night entry.
                            <ul class="custom-icons">
                                <li>
                                    Be sure to look up the most unique portion of the property name before adding.
                                    This will ensure you do not duplicate entries.
                                </li>
                                <li>
                                    When in doubt, please use the most appropriate naming convention for each property
                                    and fix any extra names that may exist.
                                </li>
                                <li>
                                    As a rule of thumb: ___ and ClientBase should match exactly.
                                    When in doubt, use the property's name as it appears on their website.
                                </li>
                                <li>
                                    If you add a new Service Provider, check ClientBase to see if it needs
                                    to be entered or updated there.
                                </li>
                                <li>
                                    When entering portfolio names: If a DMC owns a property (ex. Wilderness Safaris or &Beyond),
                                    you can enter the DMC name. If the DMC does not own the property, you should enter the hotel's owner.
                                </li>
                            </ul>





                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export default FaqPage;

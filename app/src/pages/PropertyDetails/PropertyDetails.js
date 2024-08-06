import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
// import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditPropertyDetailModal from './AddEditModal';
// import moment from 'moment';

export const PropertyDetails = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [refreshData, setRefreshData] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditProperty, setCurrentEditProperty] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/property_details`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, refreshData]);

    const openEditModal = (property) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before editing properties.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditProperty(property); // Set the data for the log to be edited
            setIsEditMode(true);       // Indicate that we're in edit mode
            setIsModalOpen(true);      // Open the modal
        }
    };

    function toTitleCase(str) {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please enter your name above before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentEditProperty(null);
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    return (
        <>
            <header>
                <Navbar title="Property Details" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                {(userDetails.role !== 'admin') ? (
                        <div className="center">
                            You do not have permission to view this page.
                        </div>
                    ) : (
                    <>
                        <AddEditPropertyDetailModal
                            isOpen={isModalOpen}
                            onClose={closeModal}
                            onRefresh={triggerRefresh}
                            editPropertyData={currentEditProperty}
                            isEditMode={isEditMode}
                        />
                        {loaded ? (
                            <>
                                <div className="container center">
                                    <div className="row center">
                                        <div className="col s2 offset-s10">
                                            <button
                                                href=""
                                                className="btn-float btn-large waves-effect waves-light tb-teal darken-4"
                                                onClick={openModal}
                                            >
                                                <span className="material-symbols-outlined">
                                                    add
                                                </span>
                                                Add New
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        {Array.isArray(apiData) && apiData.length > 0 ? (
                                            apiData.map((item) => (
                                                <div className="row" key={item.property_id}>
                                                    <div className="col s12">
                                                        <div className="card">
                                                            <div className="card-content">
                                                                <span className="card-title text-bold" style={{ fontFamily: 'Bodoni, sans-serif', marginBottom: '20px' }}>
                                                                    {item.name}
                                                                </span>
                                                                <div className="row">
                                                                    {item.portfolio_name &&
                                                                        <div className="chip tb-grey darken-1 tb-grey-text text-lighten-5 text-bold">
                                                                            <span className="material-symbols-outlined">store</span>
                                                                            {item.portfolio_name}
                                                                        </div>
                                                                    }
                                                                    {item.country_name &&
                                                                        <div className="chip tb-grey darken-1 tb-grey-text text-lighten-5 text-bold">
                                                                            <span className="material-symbols-outlined">public</span>
                                                                            {item.country_name}
                                                                        </div>
                                                                    }
                                                                    {item.core_destination_name &&
                                                                        <div className="chip tb-grey darken-1 tb-grey-text text-lighten-5 text-bold">
                                                                            <span className="material-symbols-outlined">explore</span>
                                                                            {item.core_destination_name}
                                                                        </div>
                                                                    }
                                                                    {/* Add more details as needed */}
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col l4 s12">
                                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                                            {toTitleCase(item.property_type) || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                        </span>
                                                                        <br />
                                                                        <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                                                            <span className="material-symbols-outlined">
                                                                                camping
                                                                            </span>
                                                                            Property Type
                                                                        </em>
                                                                    </div>
                                                                    <div className="col l4 s12">
                                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                                            {item.price_range || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                        </span>
                                                                        <br />
                                                                        <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                                                            <span className="material-symbols-outlined">
                                                                                payments
                                                                            </span>
                                                                            Price Range
                                                                        </em>
                                                                    </div>
                                                                    <div className="col l4 s12">
                                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                                            {item.num_tents || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                        </span>
                                                                        <br />
                                                                        <em className="tb-grey-text text-lighten-1" style={{ fontSize: '1rem' }}>
                                                                            <span className="material-symbols-outlined">
                                                                                bedroom_child
                                                                            </span>
                                                                            # of Rooms
                                                                        </em>
                                                                    </div>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col s12 prop-chips-container">
                                                                        {item.property_type === 'camp' &&
                                                                            <div className="prop-chip-wrapper">
                                                                                <span className={`chip prop-chip ${item.has_trackers === null ? 'tb-grey lighten-5' : item.has_trackers ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                    <span className="material-symbols-outlined">
                                                                                        pets
                                                                                    </span>
                                                                                </span>
                                                                                    {item.has_trackers === null ? "Unknown" : item.has_trackers ? 'YES' : 'NO'}
                                                                                </span>
                                                                                <label>Trackers</label>
                                                                            </div>
                                                                        }
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_wifi_in_room === null ? 'tb-grey lighten-5' : item.has_wifi_in_room ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    wifi_home
                                                                                </span>
                                                                            </span>
                                                                                {item.has_wifi_in_room === null ? "Unknown" : item.has_wifi_in_room ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>WiFi (Room)</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_wifi_in_common_areas === null ? 'tb-grey lighten-5' : item.has_wifi_in_common_areas ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    wifi
                                                                                </span>
                                                                            </span>
                                                                                {item.has_wifi_in_common_areas === null ? "Unknown" : item.has_wifi_in_common_areas ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>WiFi (Common Area)</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_hairdryers === null ? 'tb-grey lighten-5' : item.has_hairdryers ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    self_care
                                                                                </span>
                                                                            </span>
                                                                                {item.has_hairdryers === null ? "Unknown" : item.has_hairdryers ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Hair Dryers</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_credit_card_tipping === null ? 'tb-grey lighten-5' : item.has_credit_card_tipping ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    credit_card_heart
                                                                                </span>
                                                                            </span>
                                                                                {item.has_credit_card_tipping === null ? "Unknown" : item.has_credit_card_tipping ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Credit Card Tips</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_pool === null ? 'tb-grey lighten-5' : item.has_pool ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    pool
                                                                                </span>
                                                                            </span>
                                                                                {item.has_pool === null ? "Unknown" : item.has_pool ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Pool</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.has_heated_pool === null ? 'tb-grey lighten-5' : item.has_heated_pool ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    local_fire_department
                                                                                </span>
                                                                            </span>
                                                                                {item.has_heated_pool === null ? "Unknown" : item.has_heated_pool ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Heated Pool</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.is_child_friendly === null ? 'tb-grey lighten-5' : item.is_child_friendly ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                                                                                <span className="material-symbols-outlined">
                                                                                    crib
                                                                                </span>
                                                                            </span>
                                                                                {item.is_child_friendly === null ? "Unknown" : item.is_child_friendly ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Child Friendly</label>
                                                                        </div>
                                                                        <div className="prop-chip-wrapper">
                                                                            <span className={`chip prop-chip ${item.is_handicap_accessible === null ? 'tb-grey lighten-5' : item.is_handicap_accessible ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>
                                                                                <span className="text-bold">
                                                                                    <span className="material-symbols-outlined">
                                                                                        accessible
                                                                                    </span>
                                                                                </span>
                                                                                {item.is_handicap_accessible === null ? "Unknown" : item.is_handicap_accessible ? 'YES' : 'NO'}
                                                                            </span>
                                                                            <label>Accessible</label>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-action">
                                                                {/* Add any action buttons/links here */}
                                                                <a
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        openEditModal(item);
                                                                    }}
                                                                    className="warning-yellow-text"
                                                                    href="/#"
                                                                >
                                                                    Edit
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div>No results.</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <CircularPreloader show={true} />
                            </div>
                        )}
                    </>
                )}
                </div>
            </main>
        </>
    )
}

export default PropertyDetails;
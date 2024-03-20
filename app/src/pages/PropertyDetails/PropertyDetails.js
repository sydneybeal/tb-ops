import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditPropertyDetailModal from './AddEditModal';
import moment from 'moment';

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

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%' }}>
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
                                                                <span className="card-title text-bold">
                                                                    {item.name}
                                                                </span>
                                                                <div className="row">
                                                                    {item.portfolio_name &&
                                                                        <div className="chip tb-teal lighten-2">
                                                                            <span className="material-symbols-outlined">store</span>
                                                                            {item.portfolio_name}
                                                                        </div>
                                                                    }
                                                                    {item.country_name &&
                                                                        <div className="chip tb-teal lighten-2">
                                                                            <span className="material-symbols-outlined">public</span>
                                                                            {item.country_name}
                                                                        </div>
                                                                    }
                                                                    {item.core_destination_name &&
                                                                        <div className="chip tb-teal lighten-2">
                                                                            <span className="material-symbols-outlined">explore</span>
                                                                            {item.core_destination_name}
                                                                        </div>
                                                                    }
                                                                    {/* Add more details as needed */}
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col s12 l7">
                                                                        <table className="property-details-table">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Property Type
                                                                                    </td>
                                                                                    <td>
                                                                                        {toTitleCase(item.property_type) || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Price Range
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.price_range || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        # of Rooms
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.num_tents || <span className="chip tb-grey lighten-3">Unknown</span>}
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <div className="col s12 l5">
                                                                        <table className="property-details-table">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Trackers
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.has_trackers === null
                                                                                            ? <span className="chip tb-grey lighten-3">Unknown</span>
                                                                                            : item.has_trackers
                                                                                                ? 'YES'
                                                                                                : 'NO'}
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Wifi In Room
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.has_wifi_in_room === null
                                                                                            ? <span className="chip tb-grey lighten-3">Unknown</span>
                                                                                            : item.has_wifi_in_room
                                                                                                ? 'YES'
                                                                                                : 'NO'}
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Wifi In Common Area
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.has_wifi_in_common_areas === null
                                                                                            ? <span className="chip tb-grey lighten-3">Unknown</span>
                                                                                            : item.has_wifi_in_common_areas
                                                                                                ? 'YES'
                                                                                                : 'NO'}
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="tb-teal-text text-bold">
                                                                                        Hair Dryers
                                                                                    </td>
                                                                                    <td>
                                                                                        {item.has_hairdryers === null
                                                                                            ? <span className="chip tb-grey lighten-3">Unknown</span>
                                                                                            : item.has_hairdryers
                                                                                                ? 'YES'
                                                                                                : 'NO'}
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
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
                </div>
            </main>
        </>
    )
}

export default PropertyDetails;
import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditConsultantModal from './AddEditModal';
import moment from 'moment';

export const Consultants = () => {
    const { userDetails } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'is_active', ascending: false });
    const [refreshData, setRefreshData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditConsultant, setCurrentEditConsultant] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/consultants`, {
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

    /**
  * Sets sorting criteria.
  * @param {string} key - Field name to sort by.
  * @param {boolean} ascending - Sort order: true (ascending), false (descending).
  */
    function applySorting(key) {
        setSorting((prevSorting) => ({
            field: key,
            ascending: prevSorting.field === key ? !prevSorting.ascending : true,
        }));
    };

    useEffect(() => {
        let sortedData = [...apiData].sort((a, b) => {
            const isActiveA = a.is_active === true || a.is_active === 'true';
            const isActiveB = b.is_active === true || b.is_active === 'true';

            // Sort by is_active depending on ascending/descending, then by last_name.
            if (sorting.field === 'is_active') {
                if (isActiveA !== isActiveB) {
                    return sorting.ascending ? (isActiveA ? 1 : -1) : (isActiveA ? -1 : 1);
                }
                // If both have the same active status, then sort by last_name.
                return a.last_name.localeCompare(b.last_name);
            } else {
                // Your existing sorting logic for other fields.
                let aValue = a[sorting.field] !== undefined && a[sorting.field] !== null ? a[sorting.field] : '';
                let bValue = b[sorting.field] !== undefined && b[sorting.field] !== null ? b[sorting.field] : '';
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sorting.ascending ? aValue - bValue : bValue - aValue;
                }
                aValue = String(aValue);
                bValue = String(bValue);
                return sorting.ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }
        });
        setDisplayData(sortedData);
    }, [sorting, apiData]);

    useEffect(() => {
        // Initialize tooltips
        const tooltipElems = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltipElems, {
            exitDelay: 100,
            enterDelay: 10,
            html: false,
            margin: 0,
            inDuration: 300,
            outDuration: 250,
            position: 'bottom',
            transitionMovement: 10
        });

        setTimeout(() => {
            document.querySelectorAll('.material-tooltip').forEach(tooltipElem => {
                const relatedTrigger = tooltipElems[Array.from(document.querySelectorAll('.tooltipped')).findIndex(elem => elem.getAttribute('data-tooltip-id') === tooltipElem.getAttribute('id'))];
                if (relatedTrigger) {
                    const customClass = relatedTrigger.getAttribute('data-tooltip-class');
                    if (customClass) {
                        tooltipElem.classList.add(customClass);
                    }
                }
            });
        }, 10);

        // Clean up function to destroy initialized tooltips to prevent memory leaks
        return () => {
            M.Tooltip.getInstance(tooltipElems)?.destroy();
        };
    }, [displayData]);


    const openEditModal = (consultant) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding bed nights.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditConsultant(consultant);
            setIsEditMode(true);
            setIsModalOpen(true);
        }
    };

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
        setCurrentEditConsultant(null);
        document.body.style.overflow = '';
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    return (
        <>
            <header>
                <Navbar title="Consultant Management" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            <AddEditConsultantModal
                                isOpen={isModalOpen}
                                onClose={closeModal}
                                onRefresh={triggerRefresh}
                                editConsultantData={currentEditConsultant}
                                isEditMode={isEditMode}
                            />
                            {loaded ? (
                                <>
                                    <div className="container center">
                                        <div className="row center">
                                            <div className="col s2 offset-s10">
                                                <button
                                                    href=""
                                                    className="btn-float btn-large waves-effect waves-light green lighten-3"
                                                    onClick={openModal}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        add
                                                    </span>
                                                    Add New
                                                </button>
                                            </div>
                                        </div>
                                        <table className="accommodation-logs-table center">
                                            <thead>
                                                <tr>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('last_name')
                                                        }
                                                    >
                                                        Last Name
                                                        <span className="material-symbols-outlined teal-text text-lighten-3">
                                                            {sorting.field === 'last_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('first_name')
                                                        }
                                                    >
                                                        First Name
                                                        <span className="material-symbols-outlined teal-text text-lighten-3">
                                                            {sorting.field === 'first_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th
                                                        onClick={() =>
                                                            applySorting('is_active')
                                                        }
                                                    >
                                                        Active?
                                                        <span className="material-symbols-outlined teal-text text-lighten-3">
                                                            {sorting.field === 'is_active' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th style={{ width: '200px', textAlign: 'right' }}>
                                                        <span
                                                            className={`tooltipped`}
                                                            data-position="bottom"
                                                            data-tooltip="Edit"
                                                            data-tooltip-class="tooltip-light"
                                                        >
                                                            <span className="material-symbols-outlined blue-grey-text text-darken-4 text-bold">
                                                                edit
                                                            </span>
                                                        </span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(displayData) && displayData.length > 0 ? (
                                                    displayData.map((item, index) => (
                                                        <React.Fragment key={item.id}>
                                                            <tr>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p>{item.last_name}</p>
                                                                </td>
                                                                <td style={{ verticalAlign: 'top' }}>
                                                                    <p className="text-bold">{item.first_name}</p>
                                                                </td>
                                                                <td>{item.is_active ? (
                                                                    <span className="chip green lighten-3">YES</span>
                                                                ) : (
                                                                    <span className="chip grey lighten-2">NO</span>
                                                                )}
                                                                </td>
                                                                <td style={{ width: '200px' }}>
                                                                    <div style={{ textAlign: 'right', padding: '0px' }}>
                                                                        <span
                                                                            className={`tooltipped`}
                                                                            data-position="left"
                                                                            data-tooltip={`Updated ${moment.utc(item.updated_at).local().fromNow()} by ${item.updated_by === 'Initialization script' ? 'platform' : item.updated_by}`}
                                                                            data-tooltip-class="tooltip-updated-by"
                                                                        >
                                                                            <button
                                                                                className="btn waves-effect waves-light deep-orange lighten-3"
                                                                                onClick={() => openEditModal(item)}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <br />
                                                                            <em className="grey-text" style={{ fontSize: '0.75rem' }}>
                                                                                <span className="material-symbols-outlined grey-text">
                                                                                    update
                                                                                </span>
                                                                                {moment.utc(item.updated_at).local().fromNow()}
                                                                            </em>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center' }}>No results.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
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

export default Consultants;
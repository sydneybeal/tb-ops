import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import AddEditConsultantModal from './AddEditModal';
import moment from 'moment';

export const Consultants = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'is_active', ascending: false });
    const [refreshData, setRefreshData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditConsultant, setCurrentEditConsultant] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 1400);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 1400);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/consultants`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    // Session has expired or credentials are invalid
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, refreshData, logout]);

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
        let sortedData = Array.isArray(apiData) ? [...apiData].sort((a, b) => {
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
        }) : [];
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
    }, [displayData, refreshData]);


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
            <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
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
                            <div style={{ marginBottom: '20px' }}>
                                <em className="tb-grey-text">
                                    <span className="text-bold tb-teal-text">{displayData?.length?.toLocaleString()}</span> consultants
                                </em>
                            </div>
                            <table className="accommodation-logs-table center">
                                <thead>
                                    <tr className="tb-md-black-text text-bold">
                                        <th
                                            onClick={() =>
                                                applySorting('last_name')
                                            }
                                        >
                                            Last Name
                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                {sorting.field === 'last_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('first_name')
                                            }
                                        >
                                            First Name
                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                {sorting.field === 'first_name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('is_active')
                                            }
                                        >
                                            Active?
                                            <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                {sorting.field === 'is_active' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </th>
                                        <th
                                            onClick={() =>
                                                applySorting('updated_at')
                                            }
                                            style={{ width: '200px', textAlign: 'right' }}
                                        >
                                            <span
                                                className={`tooltipped`}
                                                data-position="bottom"
                                                data-tooltip="Last updated"
                                                data-tooltip-class="tooltip-light"
                                            >
                                                <span className="material-symbols-outlined tb-md-black-text text-bold">
                                                    update
                                                </span>
                                                <span className="material-symbols-outlined tb-teal-text text-lighten-4">
                                                    {sorting.field === 'updated_at' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
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
                                                        <span className="chip success-green-light">YES</span>
                                                    ) : (
                                                        <span className="chip tb-grey lighten-2">NO</span>
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
                                                                    className="btn-floating btn-small waves-effect waves-light tb-grey lighten-2"
                                                                    onClick={() => openEditModal(item)}
                                                                >
                                                                    <span className="material-symbols-outlined grey-text text-darken-4" style={{ fontSize: '1.3rem', marginBottom: '0px', marginRight: '0px' }}>
                                                                        edit
                                                                    </span>
                                                                </button>
                                                                <br />
                                                                <em className="tb-grey-text text-darken-1" style={{ fontSize: '0.75rem' }}>
                                                                    <span className="material-symbols-outlined">
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
                            {isMobileView && (
                                <div className="mobile-friendly-table">
                                    {Array.isArray(displayData) && displayData.length > 0 && displayData.map((item) => (
                                        <div key={item.id} className="card tb-grey lighten-6" style={{ borderRadius: '6px' }}>
                                            <div className="card-content">
                                                <div className="row" style={{ textAlign: 'left', marginBottom: '0px' }}>
                                                    <div className="col s10">
                                                        <div><i className="material-symbols-outlined tb-teal-text text-bold">badge</i>
                                                            <span className="text-bold">{item.display_name}</span>
                                                            {!item.is_active &&
                                                                <span>&nbsp;<span className="chip tb-grey lighten-3">INACTIVE</span></span>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="col s2">
                                                        <button onClick={() => openEditModal(item)} className="btn-floating btn-small waves-effect waves-light warning-yellow-light right">
                                                            <i className="material-icons grey-text text-darken-3">edit_note</i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-footer">
                                                <div className="row">
                                                    <div className="col s12" style={{ textAlign: 'right' }}>
                                                        <i className="material-symbols-outlined tb-teal-text text-bold">update</i>
                                                        <em className="tb-grey-text text-lighten-2"> Last Updated: {moment.utc(item.updated_at).local().fromNow()}</em>
                                                    </div>
                                                </div>
                                            </div>
                                        </div >
                                    ))}
                                </div >
                            )}
                        </div>
                    </>
                ) : (
                    <div>
                        <CircularPreloader show={true} />
                    </div>
                )}
            </div>
        </>
    )
}

export default Consultants;
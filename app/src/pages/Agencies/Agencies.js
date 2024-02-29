import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import Navbar from '../../components/Navbar';
import AddEditAgencyModal from './AddEditModal';

export const Agencies = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const { userDetails } = useAuth();
    const [displayData, setDisplayData] = useState([]);
    const [sorting, setSorting] = useState({ field: 'name', ascending: true });
    const [refreshData, setRefreshData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditAgency, setCurrentEditAgency] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/agencies`, {
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
        // Perform sorting on filteredData
        let sortedData = [...apiData].sort((a, b) => {
            let aValue = a[sorting.field] !== undefined && a[sorting.field] !== null ? a[sorting.field] : '';
            let bValue = b[sorting.field] !== undefined && b[sorting.field] !== null ? b[sorting.field] : '';

            // If both values are numbers, compare them as numbers.
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sorting.ascending ? aValue - bValue : bValue - aValue;
            }

            // If either value is not a number, convert both to strings and compare.
            // This handles null, undefined, and other non-number types safely.
            aValue = String(aValue);
            bValue = String(bValue);
            return sorting.ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        });
        setDisplayData(sortedData);

    }, [sorting, apiData]);

    const openEditModal = (agency) => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please log in before adding agencies.',
                displayLength: 2000,
                classes: 'red lighten-2',
            });
            return;
        } else {
            setCurrentEditAgency(agency);
            setIsEditMode(true);
            setIsModalOpen(true);
        }
    };

    const openModal = () => {
        if (!userDetails.email) {
            M.toast({
                html: 'Please enter your name above before adding agencies.',
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
        setCurrentEditAgency(null);
    };

    const triggerRefresh = () => {
        setRefreshData(prev => !prev);
    };

    return (
        <>
            <header>
                <Navbar title="Agency Management" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '90%' }}>
                    {(userDetails.role !== 'admin') ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            {loaded ? (
                                <>
                                    <AddEditAgencyModal
                                        isOpen={isModalOpen}
                                        onClose={closeModal}
                                        onRefresh={triggerRefresh}
                                        editAgencyData={currentEditAgency}
                                        isEditMode={isEditMode}
                                    />
                                    <div className="container center">
                                        <div className="row center">
                                            <div className="col s2 offset-s10">
                                                <button
                                                    href=""
                                                    className="btn-float btn-large waves-effect waves-light green lighten-2"
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
                                                            applySorting('name')
                                                        }
                                                    >
                                                        Name
                                                        <span className="material-symbols-outlined teal-text">
                                                            {sorting.field === 'name' && sorting.ascending ? 'arrow_drop_up' : 'arrow_drop_down'}
                                                        </span>
                                                    </th>
                                                    <th style={{ width: '90px' }} className="center">
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
                                                                    <p className="text-bold">{item.name}</p>
                                                                </td>
                                                                <td style={{ width: '90px' }}>
                                                                    <button
                                                                        className="btn waves-effect waves-light orange lighten-3"
                                                                        onClick={() => openEditModal(item)}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="2" style={{ textAlign: 'center' }}>No results.</td>
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

export default Agencies;
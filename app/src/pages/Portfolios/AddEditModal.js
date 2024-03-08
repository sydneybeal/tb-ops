import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import moment from 'moment';

const AddEditPortfolioModal = ({ isOpen, onClose, onRefresh, editPortfolioData = null, isEditMode = false }) => {
    const { userDetails } = useAuth();
    const [portfolioId, setPortfolioId] = useState(null);
    const [name, setName] = useState('');
    const [relatedEntries, setRelatedEntries] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({
        name: false,
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            M.toast({
                html: 'Please check the form for errors.',
                displayLength: 4000,
                classes: 'red lighten-2',
            });
            // Prevent form submission if validation fails
            return;
        }

        const portfolioToSubmit = {
            portfolio_id: portfolioId || null,
            name: name || null,
            updated_by: userDetails.email || ''
        };

        console.log(portfolioToSubmit);

        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Your entry was valid, but only admins are able to save to the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            fetch(`${process.env.REACT_APP_API}/v1/portfolios`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.token}`,
                },
                body: JSON.stringify(portfolioToSubmit, null, 2),
            })
                .then(response => {
                    if (!response.ok) {
                        // If the response is not ok, throw an error with the status
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // Handle success response
                    const insertedCount = data?.inserted_count ?? 0;
                    const updatedCount = data?.updated_count ?? 0;
                    let toastHtml = '';
                    let toastColor = 'green darken-1';

                    // Check for error first
                    if (data?.error) {
                        toastHtml = data.error;
                        toastColor = 'red lighten-2';
                    } else if (insertedCount > 0) {
                        toastHtml = `Added ${insertedCount} portfolio.`;
                    } else if (updatedCount > 0) {
                        toastHtml = `Modified ${updatedCount} portfolio.`;
                    } else {
                        toastHtml = data?.message ?? "No portfolios were added.";
                        toastColor = 'red lighten-2';
                    }

                    console.log(toastHtml);
                    M.toast({
                        html: toastHtml,
                        displayLength: 4000,
                        classes: toastColor,
                    });
                })
                .finally(() => {
                    resetFormState();
                    onRefresh();
                    onClose();
                })
                .catch((error) => {
                    console.error('Error:', error);
                    M.toast({
                        html: 'Your entry was valid, but we were unable to save to the database.',
                        displayLength: 4000,
                        classes: 'amber darken-1',
                    });
                });
            // }
        }
    };

    const validateForm = () => {
        let errors = {};

        if (!(name || '').trim()) {
            errors.name = 'Missing portfolio name';
        }

        setValidationErrors(errors);

        // Determine if the form is valid based on the presence of errors
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('add-edit-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen || !portfolioId) return;

        fetch(`${process.env.REACT_APP_API}/v1/related_entries?identifier=${portfolioId}&identifier_type=portfolio_id`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then(res => res.json())
            .then((data) => {
                const parsedRelatedEntries = data.affected_logs.map(log => JSON.parse(log));
                parsedRelatedEntries.sort((a, b) => {
                    if (a.date_in < b.date_in) {
                        return -1;
                    }
                    if (a.date_in > b.date_in) {
                        return 1;
                    }
                    return 0;
                });
                setRelatedEntries(parsedRelatedEntries);
            })
            .catch((err) => {
                console.error(err);
            })
    }, [portfolioId, isOpen, onClose, userDetails.token]);

    const handleDelete = () => {
        if (userDetails.role !== 'admin') {
            M.toast({
                html: 'Only admins are able to delete from the database at this time.',
                displayLength: 4000,
                classes: 'amber darken-1',
            });
        }
        else {
            const confirmDelete = window.confirm("Are you sure you want to delete this portfolio?");
            if (confirmDelete) {
                if (!portfolioId) {
                    M.toast({ html: 'Error: No portfolio ID found', classes: 'red lighten-2' });
                    return;
                }
                // Replace `/your-api-endpoint/` with the actual endpoint and `entryId` with the actual ID
                fetch(`${process.env.REACT_APP_API}/v1/portfolios/${portfolioId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userDetails.token}`,
                    },
                })
                    .then(response => response.json().then(data => ({ status: response.status, body: data })))
                    .then(({ status, body }) => {
                        if (status !== 200) {
                            let errorMessage = body.error || 'Unknown API error';
                            console.log(body);
                            if (body.affected_logs && body.affected_logs.length > 0) {
                                // console.log(body.affected_logs);
                                // Parse the JSON string from each detail into an object
                                const affected_logs = body.affected_logs.map(detail => JSON.parse(detail));
                                // Limit the details to 10 for display
                                const limitedDetails = affected_logs.slice(0, 10).map(log =>
                                    `Traveler: ${log.primary_traveler}, Dates: ${log.date_in} to ${log.date_out}`
                                ).join('<br/>');
                                const additionalCount = affected_logs.length - 10;
                                errorMessage += `<br/><br/>${limitedDetails}` +
                                    (additionalCount > 0 ? `<br/>...and ${additionalCount} others` : '');
                            }
                            throw new Error(errorMessage);
                        }
                        // Handle success here
                        M.toast({
                            html: `Portfolio '${name}' successfully deleted`,
                            classes: 'green',
                            displayLength: 2000
                        });
                    })
                    .finally(() => {
                        resetFormState();
                        onRefresh();
                        onClose();
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        M.toast({
                            html: error.message,
                            classes: 'red lighten-1',
                            displayLength: 8000
                        });
                    });
            }
        }
    };

    useEffect(() => {
        if (!isOpen) {
            resetFormState(); // Reset form state when modal closes
        } else if (isOpen && isEditMode && editPortfolioData) {
            setPortfolioId(editPortfolioData.id);
            setName(editPortfolioData.name);
        }
    }, [isOpen, isEditMode, editPortfolioData]);

    const resetFormState = () => {
        setPortfolioId(null);
        setName('');
        setValidationErrors({});
        setRelatedEntries([]);
    };

    const validateName = (value) => {
        if (!(value || '').trim()) {
            return 'Missing portfolio name';
        }
        return '';
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);

        if (touched.name) {
            setValidationErrors(prevErrors => ({
                ...prevErrors,
                name: validateName(value),
            }));
        }
    };

    const handleNameBlur = () => {
        setTouched(prev => ({ ...prev, name: true }));
        setValidationErrors(prevErrors => ({
            ...prevErrors,
            name: validateName(name),
        }));
    };

    return (
        <div id="add-edit-modal" className="modal add-edit-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                    {!isEditMode ? 'New' : 'Editing'} Portfolio&nbsp;&nbsp;
                    {isEditMode &&
                        <button
                            className="btn waves-effect waves-light red lighten-3"
                            onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined grey-text text-darken-2" style={{ marginBottom: '0px', marginRight: '0px' }}>
                                delete_forever
                            </span>
                        </button>
                    }
                </h4>
                <div className="container" style={{ width: '60%' }}>
                    <div style={{ textAlign: 'left', marginTop: '50px' }}>
                        <form id="consultantForm" onSubmit={handleFormSubmit}>
                            {validationErrors.name && (
                                <div className="row" style={{ marginBottom: '20px' }}>
                                    {validationErrors.name && (
                                        <div className="chip red lighten-4 text-bold">{validationErrors.name}</div>
                                    )}
                                </div>
                            )}
                            <div className="row" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    id="portfolio_name"
                                    value={name}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    placeholder="Portfolio name"
                                    style={{ marginRight: '10px', flexGrow: '1' }}
                                    className={validationErrors.name ? 'invalid' : ''}
                                />
                                <label htmlFor="portfolio_name">
                                    <span className="material-symbols-outlined">
                                        store
                                    </span>
                                    Portfolio Name
                                </label>
                            </div>
                        </form>
                    </div>
                </div >
            </div >
            <div className="modal-footer" style={{ marginBottom: '20px', zIndex: '-1' }}>
                <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                    <em className="grey-text">
                        <span className="text-bold">{relatedEntries.length}</span> associated service provider entries.
                    </em>
                </div>
                {/* {Array.isArray(relatedEntries) && relatedEntries.length > 0 ? (
                    <>
                        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                            <h5 className="grey-text text-darken-3" style={{ marginBottom: '30px' }}>Related Service Provider Entries</h5>
                            {relatedEntries.slice(0, 5).map((item, index) => (
                                <div key={index}>
                                    <div>
                                        <span className="material-symbols-outlined">
                                            hiking
                                        </span>
                                        <span className="text-bold">{item.primary_traveler}  </span>
                                        <div className="chip blue lighten-5">
                                            <span className="material-symbols-outlined">
                                                flight_land
                                            </span>
                                            {item.date_in}
                                        </div>
                                        to&nbsp;
                                        <div className="chip blue lighten-5">
                                            <span className="material-symbols-outlined">
                                                flight_takeoff
                                            </span>
                                            {item.date_out}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {relatedEntries.length > 5 && (
                                <p className="grey-text">and {relatedEntries.length - 5} more...</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                        <em className="grey-text text-lighten-1">No associated service provider entries.</em>
                    </div>
                )} */}
                <div style={{ paddingBottom: '20px' }}>
                    <button className="btn modal-close waves-effect waves-light red lighten-2" onClick={onClose}>
                        Close
                    </button>
                    &nbsp;&nbsp;
                    <button type="submit" form="consultantForm" className="btn waves-effect waves-light green">Save</button>
                </div>
            </div>
        </div >
    )

}

export default AddEditPortfolioModal;
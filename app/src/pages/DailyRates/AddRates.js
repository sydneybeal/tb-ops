import React, { useEffect, useState, useRef } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import { parse } from 'papaparse';
import Navbar from '../../components/Navbar';
import moment from 'moment';
import { Link } from 'react-router-dom';

export const AddRates = () => {
    const { userDetails, logout } = useAuth();
    const [file, setFile] = useState(null);
    const [rates, setRates] = useState([]);
    const [loadingGet, setLoadingGet] = useState(false);
    const [loadingPost, setLoadingPost] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState(null);
    const [existingRates, setExistingRates] = useState([]);
    const [dateFilter, setDateFilter] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);
    const fileInputRef = useRef(null);
    const filePathRef = useRef(null);
    const rolesAllowedToUpload = ['admin', 'accounting'];

    const displayTime = existingRates.length > 0 ? moment(existingRates[0].updated_at, "HH:mm:ss").format("h:mma") : null;
    const displayUpdatedBy = existingRates.length > 0 ? existingRates[0].updated_by: null;

    // Fetch existing rates
    useEffect(() => {
        const rateDateFormat = moment(dateFilter).format('YYYY-MM-DD');
        if (dateFilter) {
            setLoadingGet(true);
            fetch(`${process.env.REACT_APP_API}/v1/daily_rates?rate_date=${rateDateFormat}`, {
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
                data.sort((a, b) => a.target_currency.localeCompare(b.target_currency));
                setExistingRates(data);
                setLoadingGet(false);
            })
            .catch((err) => {
                setLoadingGet(false);
                console.error(err);
            });
        }
    }, [dateFilter, logout, userDetails.token]);

    const handleSubmit = () => {
        setLoadingPost(true);
        console.log(rates);
        fetch(`${process.env.REACT_APP_API}/v1/daily_rates`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userDetails.token}`,
            },
            body: JSON.stringify(rates, null, 2),
        })
            .then(response => {
                if (!response.ok) {
                    // If the response is not ok, throw an error with the status
                    console.log('Network response was not ok: ' + response.statusText);
                    M.toast({
                        html: "Something went wrong.",
                        displayLength: 4000,
                        classes: "error-red",
                    });
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const rateChangeSummary = data?.summarized_audit_logs?.daily_rates ?? {};
                const messages = data?.messages ?? [];
                const inserts = rateChangeSummary.insert || 0;
                const updates = rateChangeSummary.update || 0;
                const unchanged = messages.length;
                let successHtml = '';
                if (inserts > 0) {
                    successHtml += `Added ${inserts} rate${inserts > 1 ? 's' : ''}.<br>`;
                }
                if (updates > 0) {
                    successHtml += `Updated ${updates} rate${updates > 1 ? 's' : ''}.<br>`;
                }
                if (unchanged > 0) {
                    successHtml += `${unchanged} rate${unchanged > 1 ? 's' : ''} unchanged.<br>`;
                }
                if (successHtml === '') {
                    successHtml += 'Daily rates have been processed.'
                }
                
                M.toast({
                    html: successHtml,
                    displayLength: 12000,
                    classes: "success-green",
                });
                setSuccessMessage(successHtml);
            })
            .catch(error => console.error('Error updating rates', error));
    };

    const handleFileChange = event => {
        setRates([]);
        setDateFilter(null);
        // if (fileInputRef.current) {
        //     fileInputRef.current.value = "";
        // }
        setFile(event.target.files[0]);
    };

    const handleClearFile = () => {
        setFile(null);
        setDateFilter(null);
        setRates([]);
        setSuccessMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (filePathRef.current) {
            filePathRef.current.value = "";
        }
    };

    const handleFileUpload = () => {
        if (file) {
            parse(file, {
                complete: (result) => {
                    let errorMessage = '';
                    const formattedRates = [];
    
                    for (const item of result.data) {
                        console.log(item);
                        // Validate the number of rows and the format of each row
                        if (result.data.length > 30) {
                            errorMessage = 'Error: More than 30 rows of data are not allowed.';
                            break;
                        }
                        if (typeof item[0] !== 'string' || typeof item[1] !== 'string' || typeof item[2] !== 'string') {
                            errorMessage = 'Error: The first three columns of each row should be strings.';
                            break;
                        }
                        if (isNaN(parseFloat(item[3]))) {
                            errorMessage = 'Error: The fourth column must be a decimal number.';
                            break;
                        }
                        if (item[4] !== '') {
                            errorMessage = 'Error: The fifth column should be blank.';
                            break;
                        }
                        if (!moment(item[5], ['M/D/YY', 'MM/DD/YY', 'MM/DD/YYYY', 'M/D/YYYY']).isValid()) {
                            errorMessage = 'Error: The sixth column should be a valid date.';
                            break;
                        }
                        if (!moment(item[6], ['H:mm:ss', 'H:mm:ss A']).isValid()) {
                            errorMessage = 'Error: The seventh column should be a valid time.';
                            break;
                        }
    
                        // If all validations pass, format and push the row into the rates array
                        formattedRates.push({
                            base_currency: item[0],
                            target_currency: item[1],
                            currency_name: item[2],
                            conversion_rate: parseFloat(item[3]),
                            rate_date: moment(item[5], ['M/D/YY', 'MM/DD/YYYY', 'M/D/YYYY', 'MM/DD/YY']).format('YYYY-MM-DD'),
                            rate_time: moment(item[6], ['H:mm:ss', 'h:mm:ss A']).local().format('hh:mm:ss'),
                            updated_by: userDetails.email || ''
                        });
                    }    
                    if (errorMessage === '') {
                        setRates(formattedRates.sort((a, b) => a.target_currency.localeCompare(b.target_currency)));
                        if (formattedRates.length > 0) {
                            setDateFilter(formattedRates[0].rate_date);
                        }
                    } else {
                        setUploadErrorMessage(errorMessage);
                    }
                },
                skipEmptyLines: true
            });
        } else {
            console.error('No file selected for upload.');
        }
    };

    const hasChanges = () => {
        return rates.some(rate => {
            const existingRate = existingRates.find(er => er.target_currency === rate.target_currency && er.rate_date === rate.rate_date);
            return existingRate ? parseFloat(existingRate.conversion_rate).toFixed(6) !== parseFloat(rate.conversion_rate).toFixed(6) : true;
        });
    };

    return (
        <>
            <header>
                <Navbar title="Add Daily Rates" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '70%',  marginBottom: '100px' }}>
                    {(!rolesAllowedToUpload.includes(userDetails.role)) ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                            <div className="row center">
                                <h4>Upload Daily Rates</h4>
                                <div className="row center" style={{ marginBottom: '40px', marginTop: '40px'}}>
                                        <Link to={'/daily_rates'} className="text-bold">
                                            <div className="btn tb-teal lighten-2">
                                                <span className="material-symbols-outlined">
                                                    arrow_back
                                                </span>
                                                Back to Rates
                                            </div>
                                        </Link>
                                </div>
                            </div>
                            <div className="row center">
                                <div className="container" style={{ width: '100%', paddingLeft: '80px' }}>
                                    <div className="file-field input-field">
                                        <div
                                            className="btn tb-teal"
                                        >
                                            <span>
                                                <span className="material-symbols-outlined">
                                                    upload_file
                                                </span>
                                                Choose File
                                            </span>
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                ref={fileInputRef} 
                                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                            />
                                        </div>
                                        <div className="file-path-wrapper" style={{ width: '50%' }}>
                                            <input
                                                className="file-path validate"
                                                type="text"
                                                placeholder="Click or drag & drop to upload Daily Rate file"
                                                ref={filePathRef}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {file && rates.length === 0 ? (
                                    <div className="row">
                                        <button className="btn tb-teal darken-4" onClick={handleFileUpload}>
                                            Continue
                                        </button>
                                    </div>
                                ) : rates.length > 0 ? (
                                    <div className="row">
                                        <button className="btn error-red" onClick={handleClearFile}>
                                            Clear
                                        </button>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                            {successMessage ? (
                                <div className="center success-green-text text-bold" style={{ fontSize: '1.4rem'}}>
                                    <p>Successfully entered rates for {dateFilter}!</p>
                                {successMessage.split('<br>').map((part, index, array) => (
                                    <React.Fragment key={index}>
                                        {part}
                                        {index !== array.length - 1 && <br />} {/* Only add <br /> if it's not the last part */}
                                    </React.Fragment>
                                ))}
                            </div>                    
                            ) : uploadErrorMessage ? (
                                <div className="center text-bold" style={{ fontSize: '1.4rem'}}>
                                    <p>Oops, something went wrong:</p>
                                    <p className="error-red-text">{uploadErrorMessage}</p>
                            </div>                    
                            ) : loadingGet ? (
                                <div className="center">
                                    <CircularPreloader show={true} />
                                </div>
                            ) : (Array.isArray(rates) && rates.length > 0) ? (
                            <>
                                <div className="center">
                                    <h5 className="center">Upload Preview</h5>
                                    { Array.isArray(existingRates) && existingRates.length === 0 ? (
                                        <p>Entering new rates for date <b>{dateFilter}</b></p>
                                    ) : (
                                        <>
                                            <p>
                                                <b className="waring-yellow">Modifying</b> rates for date <b>{dateFilter}</b>
                                            </p>
                                            {displayTime &&
                                                <p className="center tb-grey-text text-darken-1" style={{ marginTop: '1px' }}>
                                                    <em>Rates posted at {displayTime} by {displayUpdatedBy}</em>
                                                </p>
                                            }
                                        </>
                                    )}
                                </div>
                                <div className="row center" style={{ marginTop: '20px' }}>
                                {hasChanges() ? (
                                    <button className="btn btn-large success-green" onClick={handleSubmit}>
                                        <span>Submit Rates </span>
                                        <span className="material-symbols-outlined">
                                            new_releases
                                        </span>
                                    </button>
                                ) : (
                                    <>
                                        <button className="btn btn-large tb-teal darken-4 disabled" onClick={handleSubmit}>
                                            No changes to upload
                                        </button>
                                    </>
                                )}
                                </div>
                                <table className="accommodation-logs-table rates-table">
                                        <thead>
                                            <tr>
                                                <th>Base Currency</th>
                                                <th>Target Currency</th>
                                                <th>Conversion Rate</th>
                                                <th>Rate Date</th>
                                                <th>Rate time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {rates.map(rate => {
                                            const existingRate = existingRates.find(er => er.target_currency === rate.target_currency && er.rate_date === rate.rate_date);
                                            const isNewRateDifferent = existingRate && parseFloat(existingRate.conversion_rate).toFixed(6) !== parseFloat(rate.conversion_rate).toFixed(6);
                                            return (
                                                <tr key={rate.rate_date + rate.target_currency}>
                                                    <td>{rate.base_currency}</td>
                                                    <td>{rate.target_currency}</td>
                                                    <td>
                                                        {existingRate ? (
                                                            <>
                                                                {parseFloat(existingRate.conversion_rate).toFixed(4).replace(/\.?0+$/, '')}
                                                                {isNewRateDifferent &&
                                                                    <b className="success-green-text">
                                                                        {" → "}
                                                                        {parseFloat(rate.conversion_rate).toFixed(4).replace(/\.?0+$/, '')}
                                                                    </b>
                                                                }
                                                            </>
                                                        ) : (
                                                            <b className="success-green-text">
                                                                {parseFloat(rate.conversion_rate).toFixed(4).replace(/\.?0+$/, '')}
                                                            </b>
                                                        )}
                                                    </td>
                                                    <td>{rate.rate_date}</td>
                                                    <td>{moment(rate.rate_time, 'hh:mm:ss').format('hh:mm:ss A')}</td>
                                                </tr>
                                            )
                                        })}
                                        </tbody>
                                </table>
                            </>
                            ) : !file && (
                                <div className="center">Choose a file to get started</div>
                            )
                            }
                        </>
                    )}
                </div>
            </main>
        </>
    )
}

export default AddRates;
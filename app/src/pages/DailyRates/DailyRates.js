import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import moment from 'moment';

const currenciesToMultiply = ["AUD", "EUR", "GBP", "NZD", "ZAR"];

export const DailyRates = () => {
    const [apiData, setApiData] = useState({});
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [rateDate, setRateDate] = useState(moment());
    const [inputAmount, setInputAmount] = useState();
    const [currency, setCurrency] = useState('ZAR');
    const [convertedAmount, setConvertedAmount] = useState('');
    const allowedToUpload = ['kayb@travelbeyond.com', 'erinj@travelbeyond.com'];

    const handleAmountChange = (e) => {
        setInputAmount(e.target.value);
    };

    const handlePreviousDay = () => {
        const previousDay = moment(rateDate).subtract(1, 'days');
        setRateDate(previousDay.format('YYYY-MM-DD'));
    };
    
    const handleNextDay = () => {
        const nextDay = moment(rateDate).add(1, 'days');
        setRateDate(nextDay.format('YYYY-MM-DD'));
    };
    

    useEffect(() => {
        M.updateTextFields();
    }, [apiData]);

    const handleCurrencyChange = (e) => {
        setCurrency(e.target.value);
    };

    function copyToClipboard(textToCopy) {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        const toastHtml = `<span>Copied to clipboard: <span style="font-weight: bold;">${textToCopy}</span></span>`;
        M.toast({
          html: toastHtml,
          displayLength: 2000,
          activationPercent: 0.2,
          classes: 'tb-teal lighten-5 tb-grey-text text-darken-4',
        });
      }

    useEffect(() => {
        M.AutoInit();
        if (apiData && apiData.length > 0 && currency && inputAmount) {
            // Find the rate from apiData based on the selected currency
            const currencyRate = apiData.find(rate => rate.target_currency === currency);
            let rate = currencyRate ? parseFloat(currencyRate.conversion_rate) : 0;
    
            if (rate !== 0) { // Ensure rate is not zero to avoid division by zero
                if (currency === 'ZAR') {
                    // Special handling for ZAR as per company's spreadsheet
                    rate = 1 / rate * 1.04; // Adjust the rate by inverting and then multiplying by 1.04
                } else {
                    // Handle other currencies - assuming they need to be divided by the rate and adjusted
                    rate = currenciesToMultiply.includes(currency) ? rate * 1.04 : rate / 1.04;
                }
                console.log(rate);
    
                const baseAmount = parseFloat(inputAmount);
                const result = (baseAmount * rate).toFixed(4); // Apply the adjusted rate to the base amount
                setConvertedAmount(result);
            } else {
                setConvertedAmount('Rate not available'); // Handling when the rate is zero or not found
            }
        } else {
            setConvertedAmount(0)
        }
    }, [inputAmount, currency, apiData]);       

    const displayDate = rateDate && moment(rateDate).isValid() 
                    ? moment(rateDate).format('dddd, MMMM D, YYYY') 
                    : null;

    function formatAmount(amount, digits=2) {
        if (amount === null || amount === undefined) return "0.00";
    
        // Convert the number to a string with two decimal places
        return parseFloat(amount).toFixed(digits);
    }
    
    useEffect(() => {
        M.AutoInit();
        setLoaded(false);
        const rateDateFormat = moment(rateDate).format('YYYY-MM-DD');
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
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token, rateDate]);

    const displayTime = apiData.length > 0 ? moment(apiData[0].updated_at, "HH:mm:ss").format("h:mma") : null;
    const displayUpdatedBy = apiData.length > 0 ? apiData[0].updated_by: null;
    // const displayTime = '';

    return (
        <>
            <header>
                <Navbar title="Daily Rates" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '90%',  marginBottom: '500px' }}>
                    <div className="row" style={{ marginTop: '10px' }}>
                        {displayDate ? (
                            <h5 className="center" style={{ marginBottom: '3px' }}>Rates for <span className="text-bold">
                                {displayDate}
                            </span></h5>
                        ) : (
                            <h5 className="center">Choose a date:</h5>
                        )}
                        <div className="row center" style={{ marginBottom: '30px', marginTop: '20px', width: '100%',  display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="btn btn-small tb-grey lighten-2"
                                onClick={handlePreviousDay}
                                style={{ marginRight: '20px', marginTop: '10px' }}
                            >
                                <span className="material-symbols-outlined">
                                    fast_rewind
                                </span>
                            </button>
                            <ReactDatePicker
                                selected={rateDate && moment(rateDate).isValid() ? moment(rateDate).toDate() : null}
                                onChange={(date) => {
                                    setRateDate(date ? moment(date).format('YYYY-MM-DD') : '');
                                    setApiData({});
                                }}
                                isClearable
                                placeholderText="mm/dd/yyyy"
                                className="date-input"
                                dateFormat="MM/dd/yyyy"
                                minDate={new Date('2024-01-01')}
                                maxDate={new Date('2100-12-31')}
                                autoComplete="off"
                                todayButton="Today"
                                openToDate={rateDate && moment(rateDate).isValid() ? moment(rateDate).toDate() : new Date()}
                            />
                            <button
                                className="btn btn-small tb-grey lighten-2"
                                onClick={handleNextDay}
                                style={{ marginLeft: '20px', marginTop: '10px' }}
                            >
                                <span className="material-symbols-outlined">
                                    fast_forward
                                </span>
                            </button>
                        </div>
                    
                        { (userDetails.role === 'admin' || allowedToUpload.includes(userDetails.email)) &&
                            <div className="row center" style={{ marginBottom: '40px'}}>
                                    <Link to={'/daily_rates/add'} className="text-bold">
                                        <div className="btn btn-large tb-teal lighten-2">
                                            + Add Rates
                                        </div>
                                    </Link>
                            </div>
                        }
                        <div className="row" style={{ width: '70%' }}>
                        <h4 style={{ marginBottom: '30px' }} className="center">Currency Calculator</h4>
                            <div className="card potential-trip-card" >
                                <div className="card-content" style={{paddingBottom: '2px'}}>
                                    <div className="row">
                                    {apiData && apiData.length > 0 ? (
                                    <>
                                        <div className="col s12 l5">
                                            <div className="input-field">
                                                <span className="material-symbols-outlined grey-text text-darken-1 prefix">payments</span>
                                                <input
                                                    type="text"
                                                    id="inputAmount"
                                                    value={inputAmount}
                                                    onChange={handleAmountChange}
                                                    placeholder=" "  // Ensure this is empty or just a space for better label handling
                                                    autoComplete="off"
                                                />
                                                <label
                                                    style={{ fontSize: '1.3rem' }}
                                                    htmlFor="inputAmount"
                                                    className="grey-text text-darken-3"
                                                >
                                                    Starting amount
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col s12 l3">
                                            <div className="input-field" style={{paddingBottom: '1px'}}>
                                                <select id="currencySelect" value={currency} onChange={handleCurrencyChange}>
                                                    {apiData && apiData.length > 0 && apiData.map((rate, index) => (
                                                        <option key={index} value={rate.target_currency}>{rate.target_currency}</option>
                                                    ))}
                                                </select>
                                                <label style={{ fontSize: '1.0rem' }} htmlFor="currencySelect" className="grey-text text-darken-3">
                                                    <span className="material-symbols-outlined">
                                                        currency_exchange
                                                    </span>
                                                    Currency
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col s12 l4" style={{ textAlign: 'center'}}>
                                            <label style={{ fontSize: '1.1rem' }} htmlFor="convertedValue" className="grey-text text-darken-3">
                                                USD Conversion
                                            </label>
                                            <span className="copyable-text" onClick={() => copyToClipboard("$"+formatAmount(convertedAmount))}>
                                                <p id="convertedValue" className="text-bold" style={{ fontSize: '1.8rem' }}>
                                                    ${formatAmount(convertedAmount)}
                                                    <span
                                                        class="material-symbols-outlined tb-teal-text text-darken-2 text-bold"
                                                        style={{ marginLeft: '5px' }}
                                                    >
                                                        content_paste
                                                    </span>
                                                </p>
                                            </span>
                                        </div>
                                    </>
                                    ) : (
                                        <p className="center">No rates available for this date.</p>
                                    )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container" style={{ width: '70%' }}>
                        <h4 style={{ marginBottom: '30px' }} className="center">
                            Conversion Rates
                        </h4>
                        {displayTime &&
                            <p className="center tb-grey-text text-darken-1" style={{ marginTop: '1px' }}>
                                <em>Rates posted at {displayTime} by {displayUpdatedBy}</em>
                            </p>
                        }
                        <table className="accommodation-logs-table rates-table" >
                            <thead>
                                <tr>
                                    <th>Currency</th>
                                    <th>Currency Name</th>
                                    <th>Base Rate</th>
                                    <th>Markup Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                            {apiData && apiData.length > 0 ? (
                                apiData.map((dailyRate, index) => {
                                    const baseConversionRate = dailyRate.target_currency === 'ZAR'
                                        ? 1 / parseFloat(dailyRate.conversion_rate)
                                        : parseFloat(dailyRate.conversion_rate);
                                    const baseConversionRateFixed = baseConversionRate.toFixed(4).replace(/\.?0+$/, '');
                                    const markedUpRate = currenciesToMultiply.includes(dailyRate.target_currency)
                                        ? (baseConversionRate * 1.04).toFixed(4).replace(/\.?0+$/, '')
                                        : (baseConversionRate / 1.04).toFixed(4).replace(/\.?0+$/, '');
                                    return (
                                        <tr key={index}>
                                            <td>
                                                <span className="text-bold">
                                                    {dailyRate.target_currency}
                                                    {dailyRate.target_currency === 'ZAR' &&
                                                        <span className="text-bold tb-teal-text">*</span>
                                                    }
                                                </span>
                                            </td>
                                            <td>{dailyRate.currency_name}</td>
                                            <td onClick={() => copyToClipboard(baseConversionRateFixed)}>
                                                <span className="copyable-text">
                                                    <span
                                                        class="material-symbols-outlined tb-grey-text text-darken-2 text-bold"
                                                        style={{ marginLeft: '10px'}}
                                                    >
                                                        content_paste
                                                    </span>
                                                    {formatAmount(baseConversionRateFixed, 4)}
                                                    {dailyRate.target_currency === 'ZAR' &&
                                                        <span className="text-bold tb-teal-text">*</span>
                                                    }
                                                {/* <span> USD per {dailyRate.target_currency}</span> */}
                                                </span>
                                            </td>
                                            <td onClick={() => copyToClipboard(markedUpRate)}>
                                                <span className="copyable-text">
                                                    <span
                                                        class="material-symbols-outlined tb-grey-text text-darken-2 text-bold"
                                                        style={{ marginLeft: '10px' }}
                                                    >
                                                        content_paste
                                                    </span>
                                                    {formatAmount(markedUpRate, 4)}
                                                    {dailyRate.target_currency === 'ZAR' &&
                                                        <span className="text-bold tb-teal-text">*</span>
                                                    }
                                                    {/* <span> USD per {dailyRate.target_currency}</span> */}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="center">No rates available for this date.</td></tr> // Properly filling the table when no data is present
                            )}
                            </tbody>
                        </table>
                        {apiData && apiData.length > 0 &&
                            <p className="center">
                                <span className="text-bold tb-teal-text">*</span>
                                Please note that for ZAR, the displayed value is the inverse of the conversion rate.
                            </p>
                        }
                        </div>
                    </div>
                </div>
            </main>
        </>
    )

}

export default DailyRates;
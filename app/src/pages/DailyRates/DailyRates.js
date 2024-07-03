import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import moment from 'moment';

const currenciesToMultiply = ["AUD", "EUR", "GBP", "NZD", "ZAR"];

export const DailyRates = () => {
    const [apiData, setApiData] = useState({});
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const [rateDate, setRateDate] = useState('2024-05-16');
    const [inputAmount, setInputAmount] = useState();
    const [currency, setCurrency] = useState('ZAR');
    const [convertedAmount, setConvertedAmount] = useState('');

    const handleAmountChange = (e) => {
        setInputAmount(e.target.value);
    };

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
            console.log(inputAmount);
            // Find the rate from apiData based on the selected currency
            const currencyRate = apiData.find(rate => rate.target_currency === currency);
            let rate = currencyRate ? parseFloat(currencyRate.conversion_rate) : 0;
            console.log(rate);
    
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

    const displayDate = moment(rateDate).format('MMMM D, YYYY');

    function formatAmount(amount) {
        if (amount === null || amount === undefined) return "0.00";
    
        // Convert the number to a string with a fixed number of decimal places (e.g., 5)
        const formatted = parseFloat(amount).toFixed(5);
    
        // Use a regular expression to remove trailing zeroes but leave two if they are at the decimal point
        return formatted.replace(/(\.\d*?[1-9])0+$|\.00+$/, '$1');
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

    console.log(JSON.stringify(apiData, null, 2));
    const displayTime = apiData.length > 0 ? moment(apiData[0].rate_time, "HH:mm:ss").format("h:mma") : '';
    // const displayTime = '';

    return (
        <>
            <header>
                <Navbar title="Daily Rates" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '70%' }}>
                    <div className="row" style={{ margin: '20px' }}>
                        <h5 style={{ marginBottom: '30px' }} className="center">Currency Conversion</h5>
                        <div className="card potential-trip-card">
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
                                            <label style={{ fontSize: '1.3rem' }} htmlFor="inputAmount" className="grey-text text-darken-3">Starting amount</label>
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
                                        <p id="convertedValue" className="text-bold" style={{ fontSize: '1.8rem' }}>
                                            ${formatAmount(convertedAmount)}
                                            {convertedAmount !== 0 &&
                                                <span
                                                    class="material-symbols-outlined tb-teal-text text-darken-2 text-bold"
                                                    style={{ marginLeft: '10px' }}
                                                    onClick={() => copyToClipboard("$"+formatAmount(convertedAmount))}
                                                >
                                                    content_copy
                                                </span>
                                            }
                                        </p>
                                    </div>
                                </>
                                ) : (
                                    <p>No rates available for this date.</p>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row" style={{ marginTop: '10px', width: '80%' }}>
                        <h5 className="center" style={{ marginBottom: '3px' }}>Rates for <span className="text-bold">{displayDate}</span></h5>
                        <p className="center tb-grey-text" style={{ marginTop: '1px' }}>
                            <em>Rates posted at {displayTime}</em>
                        </p>
                        <table className="accommodation-logs-table rates-table">
                            <thead>
                                <tr>
                                    <th>Currency</th>
                                    <th>Currency Name</th>
                                    <th>Conversion Rate</th>
                                    <th>Markup Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                            {apiData && apiData.length > 0 ? (
                                apiData.map((dailyRate, index) => {
                                    const baseConversionRate = dailyRate.target_currency === 'ZAR'
                                        ? 1 / dailyRate.conversion_rate
                                        : parseFloat(dailyRate.conversion_rate);
                                    const markedUpRate = currenciesToMultiply.includes(dailyRate.target_currency)
                                        ? (baseConversionRate * 1.04).toFixed(4).replace(/\.?0+$/, '')
                                        : (baseConversionRate / 1.04).toFixed(4).replace(/\.?0+$/, '');
                                    return (
                                        <tr key={index}>
                                            <td>{dailyRate.target_currency}</td>
                                            <td>{dailyRate.currency_name}</td>
                                            <td>
                                                {baseConversionRate.toFixed(4).replace(/\.?0+$/, '')}
                                                {dailyRate.target_currency === 'ZAR' &&
                                                    <span className="text-bold tb-teal-text">*</span>
                                                }
                                            </td>
                                            <td>
                                                {markedUpRate}
                                                {dailyRate.target_currency === 'ZAR' &&
                                                    <span className="text-bold tb-teal-text">*</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="center">No rates available for this date.</td></tr> // Properly filling the table when no data is present
                            )}
                            </tbody>
                        </table>
                        <p className="center">
                            <span className="text-bold tb-teal-text">*</span>
                            Please note that for ZAR, the displayed value is the inverse of the conversion rate.
                        </p>
                    </div>
                </div>
            </main>
        </>
    )

}

export default DailyRates;
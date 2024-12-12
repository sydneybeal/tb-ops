import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import CircularPreloader from '../../components/CircularPreloader';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import WrappedSummary from './WrappedSummary';
import moment from 'moment';

export const Wrapped = () => {
    const [apiData, setApiData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [consultantOptions, setConsultantOptions] = useState([]);
    const { userDetails, logout } = useAuth();
    const [loaded, setLoaded] = useState(false);

    console.log(consultantOptions);

    useEffect(() => {
        if (Array.isArray(apiData) && apiData.length > 0) {
            const uniqueConsultants = apiData.reduce((acc, item) => {
                if (!acc[item.consultant_id]) {
                    acc[item.consultant_id] = {
                        consultant_id: item.consultant_id,
                        consultant_display_name: item.consultant_display_name,
                        consultant_first_name: item.consultant_first_name,
                        consultant_is_active: item.consultant_is_active
                    };
                }
                return acc;
            }, {});
            const distinctConsultants = Object.values(uniqueConsultants);
            const consultantOptions = distinctConsultants
                .map(item => ({
                    value: item.consultant_id || '',
                    label: item.consultant_display_name || '',
                    consultant_display_name: item.consultant_display_name || '',
                    consultant_first_name: item.consultant_first_name || '',
                    consultant_is_active: item.consultant_is_active
                }))
                .sort((a, b) => {
                    // Sort by is_active, true before false
                    if (a.consultant_is_active && !b.consultant_is_active) return -1;
                    if (!a.consultant_is_active && b.consultant_is_active) return 1;
        
                    // Then sort alphabetically by label
                    return a.label.localeCompare(b.label);
                })
                .map(item => ({
                    value: item.value,
                    label: `${item.label}${item.consultant_is_active ? '' : ' (inactive)'}`,
                    consultant_first_name: item.consultant_first_name || '', 
                    consultant_display_name: item.consultant_display_name || '', 
                }));
            setConsultantOptions(consultantOptions);
        }
    }, [apiData]);

    useEffect(() => {
        setLoaded(false);

        fetch(`${process.env.REACT_APP_API}/v1/accommodation_logs`, {
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
                console.log(data[0]);
                const parsedData = data.map(log => (
                    {
                        primary_traveler: log.primary_traveler,
                        num_pax: log.num_pax,
                        country_name: log.country_name,
                        core_destination_name: log.core_destination_name,
                        property_portfolio: log.property_portfolio,
                        property_location: log.property_location,
                        agency_name: log.agency_name,
                        date_in: log.date_in,
                        date_out: log.date_out,
                        property_name: log.property_name,
                        property_type: log.property_type,
                        latitude: log.property_latitude,
                        longitude: log.property_longitude,
                        consultant_display_name: log.consultant_display_name,
                        consultant_id: log.consultant_id,
                        consultant_first_name: log.consultant_first_name,
                        consultant_is_active: log.consultant_is_active,
                        bed_nights: log.bed_nights,
                    }
                ));
                setApiData(parsedData);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [logout, userDetails.token]);

    console.log(selectedConsultant);

    useEffect(() => {
        if (Array.isArray(apiData)) {
            // Define the start and end of 2024 explicitly
            const startOfYear = moment('2024-01-01').startOf('day');
            const endOfYear = moment('2024-12-31').endOf('day');
        
            // Filter data where check-in date is within the 2024 range
            const filteredData = apiData.filter(item => {
                const dateIn = moment(item.date_in);
                const inDateRange = dateIn.isBetween(startOfYear, endOfYear, undefined, '[]');
                // const matchesConsultant = true;
                const matchesConsultant = selectedConsultant?.value 
                ? item.consultant_id === selectedConsultant.value 
                : true;
                return inDateRange && matchesConsultant;
            });
        
            setDisplayData(filteredData);
        }
    }, [apiData, selectedConsultant]);

    return (
        <>
            <header>
                <Navbar title="R&R Wrapped" />
            </header>

            <main className="tb-grey lighten-6">
                <div className="container center" style={{ width: '90%', marginBottom: '500px' }}>
                    {/* <div className="sticky-container"> */}
                        <div className="scoreboard" style={{ fontSize: '1.4rem' }}>
                            <h5>R&R Wrapped 2024</h5>
                        </div>
                    {/* </div> */}
                    {loaded && Array.isArray(displayData) && displayData.length > 0 ? (
                        <>
                            <WrappedSummary
                                data={displayData}
                                consultantName={selectedConsultant && selectedConsultant.consultant_first_name}
                            />
                            <div className="container">
                                <Select
                                    placeholder="Consultant"
                                    value={selectedConsultant}
                                    onChange={(option) => setSelectedConsultant(option)} // option.value is the full consultant object
                                    options={consultantOptions}
                                    className={`select ${selectedConsultant ? 'select--has-value' : ''}`}
                                    classNamePrefix="select"
                                    styles={{
                                        control: (provided, state) => ({
                                            ...provided,
                                            borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                            '&:hover': {
                                                borderColor: state.isFocused ? '#0e9bac' : provided.borderColor,
                                            },
                                            boxShadow: state.isFocused ? '0 0 0 1px #0e9bac' : 'none',
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            fontWeight: state.isFocused || state.isSelected ? 'bold' : 'normal',
                                            backgroundColor: state.isSelected
                                                ? '#0e9bac'
                                                : state.isFocused
                                                    ? '#e8e5e1'
                                                    : '#ffffff',
                                            ':active': {
                                                backgroundColor: !state.isSelected ? '#e8e5e1' : '#0e9bac',
                                            },
                                        }),
                                    }}
                                    isClearable
                                />
                            </div>
                        </>
                        ) : (
                        <div className="container" style={{marginTop: '50px'}}>
                            <CircularPreloader show={true} />
                        </div>
                    )}

                </div>
            </main>
        </>
    )
}

export default Wrapped;
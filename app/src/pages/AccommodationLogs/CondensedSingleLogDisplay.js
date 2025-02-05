// import React, { useEffect, useState } from 'react';
// import M from 'materialize-css/dist/js/materialize';
// import { useAuth } from '../../components/AuthContext';
// import 'react-datepicker/dist/react-datepicker.css';
// import Navbar from '../../components/Navbar';
// import CircularPreloader from '../../components/CircularPreloader';
// import moment from 'moment';

export const CondensedSingleLogDisplay = ({ log, onPassengerToggleClick }) => {

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    return (
        <div key={log.id} className="row log-display-row" style={{marginBottom: '0px'}}>
            {/* Date In and Date Out */}
            <div className="col s3">
                <span className={`chip tb-grey lighten-3`}>
                <span className="material-symbols-outlined text-bold">flight_land</span> {log.date_in}
                </span>
                <br />
                <span className={`chip tb-grey lighten-3`}>
                <span className="material-symbols-outlined text-bold">flight_takeoff</span> {log.date_out}
                </span>
            </div>


            {/* Property Details */}
            <div className="col s9" style={{ textAlign: 'left' }}>
                <strong>
                    {log.property_name}
                </strong>
                {log.property_type &&
                    <strong className="text-teal">{toTitleCase(log.property_type)}</strong>
                }
                <br />
                {log.property_location &&
                    <span className={`chip tb-grey lighten-3`}>
                        {log.property_location}
                    </span>
                }
                <span className={`chip tb-grey lighten-3`}>
                    {log.country_name}
                </span>
                <span className={`chip tb-grey lighten-3`}>
                    {log.core_destination_name}
                </span>
                <span
                    className={`chip tb-teal lighten-3'}`}
                    style={{ paddingLeft: '8px', paddingRight: '12px' }}
                    onClick={onPassengerToggleClick}
                >
                    <span className="material-symbols-outlined">
                        group
                    </span>
                    {log.totalNumPax}
                    <span className="material-symbols-outlined text-bold">expand_more</span>
                </span>
                <br />
                {log.viewPassengerNames &&
                    <em className="tb-grey-text">
                        {log.passengers.map((passenger, index) => (
                            <span key={index} style={{ display: 'block' }}>
                                {passenger}
                            </span>
                        ))}
                    </em>
                }
            </div>

        </div>
    )

}

export default CondensedSingleLogDisplay;
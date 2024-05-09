// import React, { useEffect, useState } from 'react';
// import M from 'materialize-css/dist/js/materialize';
// import { useAuth } from '../../components/AuthContext';
// import 'react-datepicker/dist/react-datepicker.css';
// import Navbar from '../../components/Navbar';
// import CircularPreloader from '../../components/CircularPreloader';
// import moment from 'moment';

export const SingleLogDisplay = ({ log }) => {

    return (
        <div className="row log-display-row">
            <div className="col s5" style={{ textAlign: 'left' }}>
                <strong>{log.property_name}</strong>
                <br />
                <span className={`chip ${log.core_destination_flag ? 'error-red-light' : 'tb-grey lighten-3'}`}>{log.country_name}</span>
                <span className={`chip ${log.core_destination_flag ? 'error-red-light' : 'tb-grey lighten-4'}`}>{log.core_destination_name}</span>
                <br />
                <em className="tb-grey-text">{log.primary_traveler}</em>
            </div>

            {/* Date In and Date Out */}
            <div className="col s2">
                <span className={`chip ${log.date_in_flag ? 'error-red-light' : 'tb-grey lighten-4'}`}>{log.date_in}</span>
                <br />
                <span className={`chip ${log.date_out_flag ? 'error-red-light' : 'tb-grey lighten-4'}`}>{log.date_out}</span>
            </div>

            {/* Bed Nights and Pax */}
            <div className="col s2" style={{ textAlign: 'left', marginBottom: '0px' }}>
                <span className={`chip ${log.num_pax_flag ? 'error-red-light' : 'tb-teal lighten-3'}`} style={{ paddingLeft: '8px', paddingRight: '12px' }}>
                    <span className="material-symbols-outlined">
                        group
                    </span>
                    {log.num_pax}
                </span>
                <br />
                <span className="chip tb-teal darken-4 tb-grey-text text-lighten-4" style={{ paddingLeft: '8px', paddingRight: '12px' }}>
                    <span className="material-symbols-outlined">
                        dark_mode
                    </span>
                    {log.bed_nights}
                </span>
            </div>

            {/* Consultant Display Name */}
            <div className="col s2">
                <span className={`text-bold ${log.consultant_flag ? 'error-red-light-text' : 'tb-med-grey'}`}>
                    {log.consultant_display_name}
                </span>
            </div>
        </div >
    )

}

export default SingleLogDisplay;
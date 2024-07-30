import React, { useEffect, useState } from 'react';
// import M from 'materialize-css/dist/js/materialize';
import 'react-datepicker/dist/react-datepicker.css';
// import CircularPreloader from '../../components/CircularPreloader';
// import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
// import moment from 'moment';

// const currenciesToMultiply = ["AUD", "EUR", "GBP", "NZD", "ZAR"];

export const AddRates = () => {

    return (
        <>
            <header>
                <Navbar title="Add Daily Rates" />
            </header>
            <main className="tb-grey lighten-6">
                <div className="container" style={{ width: '70%' }}>
                    { /* Form to upload a CSV of daily rates 
                        class PatchDailyRateRequest(BaseModel):
                        """Data model for adding or updating currency conversion rates."""

                        base_currency: str = Field(..., min_length=3, max_length=3)
                        target_currency: str = Field(..., min_length=3, max_length=3)
                        currency_name: str
                        conversion_rate: Decimal
                        rate_date: date
                        rate_time: time
                        updated_by: str
                    */}
                </div>
            </main>
        </>
    )
}

export default AddRates;
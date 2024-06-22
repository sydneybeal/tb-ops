import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import ReactDatePicker from 'react-datepicker';
import Select from 'react-select';

const RatingSelect = ({ keyId, item, icon, rating, onRatingChange }) => {
    const handleChange = (e) => {
        onRatingChange((e.target.value));
    };

    return (
        <>
            <div className="rating-row">
                <div className="rating-item tb-teal-text text-darken-1 text-bold">
                    <span className="material-symbols-outlined">
                        {icon}
                    </span>
                    {item}
                </div>
                <div className="rating-options">
                    {['n/a', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((rate) => (
                        <label className="rating-option" key={`${keyId}-${rate}`}>
                            <input
                                name={`${keyId}-rating`}
                                type="radio"
                                value={rate}
                                checked={rating === rate}
                                onChange={handleChange}
                            />
                            <span className="text-bold">{rate}</span>
                        </label>
                    ))}
                </div>
            </div>
        </>
    )

    // return (
    //     <>
    //         <div className="row">
    //             <div className="col s12 l5 tb-teal-text text-darken-1 text-bold">
    //                 <span className="material-symbols-outlined">
    //                     {icon}
    //                 </span>
    //                 {item}
    //             </div>
    //             {['n/a', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((rate) => (
    //                 <div className="col s2 l1" key={`${keyId}-${rate}`}>
    //                     <label>
    //                         <input
    //                             name={`${keyId}-rating`}
    //                             type="radio"
    //                             value={rate}
    //                             checked={rating === rate}
    //                             onChange={handleChange}
    //                             style={{paddingLeft: '10px'}}
    //                         />
    //                         <span className="text-bold">{rate}</span>
    //                     </label>
    //                 </div>
    //             ))}
    //         </div>
    //     </>
    // )
}

export default RatingSelect;
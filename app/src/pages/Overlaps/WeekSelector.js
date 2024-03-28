import React, { useState, useEffect } from 'react';
import moment from 'moment';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const WeekSelector = ({ onWeekChange, initialDate }) => {
    const [selectedDate, setSelectedDate] = useState(new Date(initialDate));
    const [tempDate, setTempDate] = useState(initialDate);

    useEffect(() => {
        const startOfWeek = moment(selectedDate).startOf('week');
        onWeekChange(startOfWeek);
    }, [selectedDate, onWeekChange]);

    const handlePreviousWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    const handleNextWeek = () => {
        // Add one week to the selectedDate.
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    const confirmStartDateSelection = () => {
        const newStart = moment(tempDate).startOf('week');

        setSelectedDate(new Date(newStart));

        const endOfWeek = moment(newStart).endOf('week');
        onWeekChange(newStart, endOfWeek);
    };



    return (
        <div>
            <button
                className="btn btn-small tb-grey lighten-2"
                onClick={handlePreviousWeek}
                style={{ marginRight: '20px' }}
            >
                <span className="material-symbols-outlined">
                    fast_rewind
                </span>
            </button>
            <ReactDatePicker
                selected={selectedDate}
                onChange={(date) => setTempDate(date)}
                onBlur={confirmStartDateSelection}
                placeholderText="Select date"
                className="date-input date-input-week-selector"
                dateFormat="MM/dd/yyyy"
                minDate={new Date('2017-01-01')}
                maxDate={new Date('2100-12-31')}
                autoComplete="off"
            />
            <button
                className="btn btn-small tb-grey lighten-2"
                onClick={handleNextWeek}
                style={{ marginLeft: '20px' }}
            >
                <span className="material-symbols-outlined">
                    fast_forward
                </span>
            </button>
        </div>
    );
};

export default WeekSelector;
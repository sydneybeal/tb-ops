import React, { useState, useEffect } from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker'; // Assuming you're using react-datepicker for date selection
import 'react-datepicker/dist/react-datepicker.css';

const WeekSelector = ({ onWeekChange, initialDate }) => {
    const [selectedDate, setSelectedDate] = useState(initialDate);

    useEffect(() => {
        // Update the week range when selectedDate changes
        const startOfWeek = moment(selectedDate).startOf('week');
        const endOfWeek = moment(selectedDate).endOf('week');
        onWeekChange(startOfWeek, endOfWeek);
    }, [selectedDate, onWeekChange]);

    const handlePreviousWeek = () => {
        setSelectedDate(moment(selectedDate).subtract(1, 'weeks'));
    };

    const handleNextWeek = () => {
        setSelectedDate(moment(selectedDate).add(1, 'weeks'));
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
            <DatePicker
                selected={selectedDate.toDate()}
                onChange={(date) => setSelectedDate(moment(date))}
                placeholderText="mm/dd/yyyy"
                className="date-input-week-selector"
                dateFormat="MM/dd/yyyy"
                minDate={new Date('2000-01-01')}
                maxDate={new Date('2100-12-31')}
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
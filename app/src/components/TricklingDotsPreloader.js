import React from 'react';
import PropTypes from 'prop-types';

const TricklingDotsPreloader = ({ show }) => {
    if (!show) {
        return null;
    }
    return (
        <div className="trickling-dots-wrapper">
            <div className="dot dot1"></div>
            <div className="dot dot2"></div>
            <div className="dot dot3"></div>
        </div>
    );
};

TricklingDotsPreloader.propTypes = {
    show: PropTypes.bool,
};

export default TricklingDotsPreloader;

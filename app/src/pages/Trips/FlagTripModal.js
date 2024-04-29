import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import M from 'materialize-css';
// import moment from 'moment';

const FlagTripModal = ({ isOpen, onClose, onRefresh, potentialTripData = null, selectedTrips = new Set()}) => {
    const { userDetails } = useAuth();

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('flag-trip-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen) return;
    }, [isOpen, onClose, userDetails.token]);

    return (
        <div id="flag-trip-modal" className="modal add-log-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>
                <p>Hello world</p>
            </div>
        </div>
    );
};

export default FlagTripModal;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from './AuthContext';
import LoginModal from '../pages/Login';

const ProtectedRoute = ({ children, allowedRoles = ['admin', 'user', 'viewer'] }) => {
    const { userDetails } = useAuth();
    const [showModal, setShowModal] = useState(!userDetails);
    const navigate = useNavigate();

    useEffect(() => {
        M.AutoInit();
        if (userDetails && !allowedRoles.includes(userDetails.role)) {
            navigate('/daily_rates/', { replace: true });
        }
    }, [userDetails, navigate, allowedRoles]);

    if (!userDetails) {
        return (
            <>
                <LoginModal onClose={() => setShowModal(false)} />
            </>
        )
    }

    return children;
};

export default ProtectedRoute;

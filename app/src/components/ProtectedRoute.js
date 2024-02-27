import React, { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from './AuthContext';
import LoginModal from '../pages/Login';

const ProtectedRoute = ({ children }) => {
    const { userDetails } = useAuth();
    const [showModal, setShowModal] = useState(!userDetails);

    useEffect(() => {
        M.AutoInit();
    }, []);

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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from './AuthContext';
import LoginModal from '../pages/Login';

const ProtectedRoute = ({
        children,
        allowedRoles = ['admin', 'sales_support', 'consultant', 'accounting', 'leadership'],
        allowedUsers = []
    }) => {
    const { userDetails } = useAuth();
    const [showModal, setShowModal] = useState(!userDetails);
    const navigate = useNavigate();

    //TODO allow these 2 to also view the page
    //allowedUsers = [
    //     'amandab@abc.com',
    //     'samanthae@abc.com',
    // ];
    useEffect(() => {
        M.AutoInit();
        if (
            userDetails && 
            !allowedRoles.includes(userDetails.role) && 
            !allowedUsers.includes(userDetails.email)
        ) {
            M.toast({
                html: 'You do not have permission to view that page, redirecting to home page.',
                displayLength: 4000,
                classes: 'error-red',
            });
            navigate('/', { replace: true });
        }
    }, [userDetails, navigate, allowedRoles, allowedUsers]);

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

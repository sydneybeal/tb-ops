import React, { createContext, useState, useContext, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => useContext(RoleContext);

export const RoleProvider = ({ children }) => {
    // Attempt to load initial state from local storage
    const [role, setRole] = useState(localStorage.getItem('role') || 'admin'); // Default to 'admin' if nothing is stored
    const [userName, setUserName] = useState(localStorage.getItem('userName') || '');

    useEffect(() => {
        // Update local storage whenever the role changes
        localStorage.setItem('role', role);
    }, [role]);

    useEffect(() => {
        // Update local storage whenever the userName changes
        localStorage.setItem('userName', userName);
    }, [userName]);

    return (
        <RoleContext.Provider value={{ role, setRole, userName, setUserName }}>
            {children}
        </RoleContext.Provider>
    );
};

import React, { createContext, useState, useContext } from 'react';

const RoleContext = createContext();

export const useRole = () => useContext(RoleContext);

export const RoleProvider = ({ children }) => {
    const [role, setRole] = useState('admin'); // Default role
    const [userName, setUserName] = useState('');

    return (
        <RoleContext.Provider value={{ role, setRole, userName, setUserName }}>
            {children}
        </RoleContext.Provider>
    );
};

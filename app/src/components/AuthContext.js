import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [userDetails, setUserDetails] = useState(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const email = localStorage.getItem('email');
        return token ? { token, role, email } : null;
    });

    const login = async (email, password) => {
        // Perform the login request to your /token endpoint
        // On success, set the user details including token, role, and email
        // Don't forget to store these in local storage as well
        try {
            const response = await fetch(`${process.env.REACT_APP_API}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    email: email,
                    password: password,
                }),
            });
            // Check if the request was successful
            if (response.ok) {
                const data = await response.json(); // Extract the JSON body content from the response
                // Here you would update the user details state and local storage
                setUserDetails({
                    token: data['access token'],
                    role: data.role,
                    email: data.email,
                });
                return true; // Indicate success
            } else {
                // Handle errors, such as displaying a message to the user
                console.error('Login failed:', response.statusText);
                return false; // Indicate failure
            }
        } catch (error) {
            console.error('An error occurred:', error);
            return false; // Indicate failure in case of exception
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        setUserDetails(null);
    };

    useEffect(() => {
        if (userDetails) {
            localStorage.setItem('token', userDetails.token);
            localStorage.setItem('role', userDetails.role);
            localStorage.setItem('email', userDetails.email);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('email');
        }
    }, [userDetails]);

    return (
        <AuthContext.Provider value={{ userDetails, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

import React, { useState, useEffect } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../components/AuthContext';
import Navbar from '../components/Navbar';

const LoginModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (await login(email, password)) {
            onClose(); // Close the modal on successful login
        } else {
            alert('Login failed. Please check your credentials.'); // Implement better error handling
        }
    };

    useEffect(() => {
        M.AutoInit();
    }, []);

    return (
        <>
            <header>
                <Navbar title="" />
            </header>

            <main className="grey lighten-5">
                <div className="container center" style={{ width: '50%', height: '100%' }}>

                    {/* <div className="modal">
                        <div className="modal-content" style={{ zIndex: '1000' }}> */}
                    <h4 className="grey-text text-darken-2" style={{ marginTop: '20px', marginBottom: '30px' }}>
                        Login
                    </h4>
                    {/* <div className="login-modal"> */}
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="btn tb-teal darken-3" type="submit">Log In</button>
                    </form>
                </div>
                {/* </div>
                </div> */}
            </main>
        </>
    );
};

export default LoginModal;
import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';

export const Referrals = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        M.AutoInit();
        fetch(`${process.env.REACT_APP_API}/v1/referral_tree`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.detail && data.detail === "Could not validate credentials") {
                    // Session has expired or credentials are invalid
                    M.toast({
                        html: 'Your session has timed out, please log in again.',
                        displayLength: 4000,
                        classes: 'error-red',
                    });
                    logout();
                    return;
                }
                if (!Array.isArray(data)) {
                    console.error("Expected an array but got:", data);
                    data = []; // Set data to an empty array if it's not an array
                }
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setLoaded(true);
                console.error(err);
            });
    }, [userDetails.token, logout]);

    const sortedData = apiData.sort((a, b) => 
        b.total_associated_referral_spend - a.total_associated_referral_spend
    );

    console.log(sortedData);

    return (
        <>
            <header>
                <Navbar title="Referrals" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                    <div className="row">
                        {sortedData.map((referral, index) => (
                            <div className="col s12 m6 l4" key={referral.id}>
                                <div className="card">
                                    <div className="card-content">
                                        <span className="card-title">{referral.name}</span>
                                        <p>Spend + Referral Spend: <b>${referral.total_associated_referral_spend.toLocaleString()}</b></p>
                                        <p>Total Associated Referrals: <b>{referral.total_associated_referrals}</b></p>
                                    </div>
                                    {referral.children.length > 0 && (
                                        <div className="card-action">
                                            <button 
                                                className="btn tb-teal darken-2" 
                                                onClick={() => console.log(referral.children)}>
                                                View Referrals
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}

export default Referrals;
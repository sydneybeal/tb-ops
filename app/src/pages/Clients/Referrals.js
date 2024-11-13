import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';

export const Referrals = () => {
    const { userDetails, logout } = useAuth();
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [visibleReferralId, setVisibleReferralId] = useState(null);
    const allowedRoles = ['admin', 'leadership'];

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
        b.total_associated_referrals - a.total_associated_referrals
    );

    const rows = [];
    for (let i = 0; i < sortedData.length; i += 3) {
        rows.push(sortedData.slice(i, i + 1));
    }

    const renderChildReferrals = (children) => {
        // Function to determine the column size based on the number of children
        const getColumnSize = (count) => {
            switch(count) {
                case 1: return 'l12';
                case 2: return 'l6';
                case 3: return 'l4';
                case 4: return 'l6';  // Two rows of 2 (each l6)
                case 5: return 'l4';  // Special layout: 3 on the first row (each l4), 2 on the second (each l6)
                default: return 'l4';  // Default to three columns per row if more than 5
            }
        };
    
        let columnSize = getColumnSize(children.length);
    
        return (
            <div className="row">
                <ul>
                    {children.map((child, index) => {
                        // Adjust column size for specific case of 5 children when rendering the 4th child
                        if (children.length === 5 && index === 3) {
                            columnSize = 'l6';
                        }
    
                        return (
                            <div className={`col s12 m6 ${columnSize}`} key={child.id}>
                                <li className="card tb-grey lighten-5 tb-md-black-text referral-tree-card">
                                    <div className="card-content">
                                    <span className="tb-teal-text text-bold">{child.name}</span>
                                    <p>Age: {child.age}</p>
                                    <p className="text-bold">Total spend: ${child.total_spend.toLocaleString()}</p>
                                    <p className="text-bold">{child.num_trips} trip{child.num_trips > 1 && 's'}</p>
                                    {child.children && child.children.length > 0 && renderChildReferrals(child.children)}
                                    </div>
                                </li>
                            </div>
                        );
                    })}
                </ul>
            </div>
        );
    };

    // function formatAmount(amount, digits=2) {
    //     if (amount === null || amount === undefined) return "0.00";
    
    //     // Convert the number to a string with two decimal places
    //     return parseFloat(amount).toFixed(digits);
    // }

    const renderTreeSummary = (node) => {
        const travelRecency = Math.abs(node.travel_recency);
        const travelRecencyComment = node.travel_recency < 0 ?
            `has an upcoming trip booked for ${travelRecency} year${travelRecency > 1 ? 's' : ''} from now.` :
            node.travel_recency === 0 ?
            `last went on a trip this year.` :
            `last went on a trip ${travelRecency} year${(travelRecency > 1) ? 's' : ''} ago.`;
    
        const relationshipComment = node.relationship_length === travelRecency && node.travel_recency > 0 ?
            `Their first trip was ${node.relationship_length} years ago and they have not returned since, suggesting a one-time engagement` :
            `They are a ${node.relationship_length > travelRecency ? 'repeat' : 'relatively new'} customer who ${travelRecencyComment}`;
    
        const ageComment = node.age >= 80 ?
            `Given that ${node.name} is ${node.age} years old, they may be nearing the end of their active relationship with the company.` :
            `${node.name} is ${node.age} years old.`;
    
        // Check if direct referrals have made further referrals
        const hasDeepReferrals = node.children.some(child => child.children.length > 0);
        const referralDepthComment = hasDeepReferrals ?
            "Their referrals have also referred others, expanding their impact on our network." :
            "Their referrals have yet to refer others.";
    
        // Analyze the efficiency and depth of referrals
        const referralTotalComment = `They have referred ${node.total_associated_referrals} customers with a total spend of $${node.total_associated_referral_spend.toLocaleString()}, averaging $${node.avg_associated_referral_spend.toLocaleString()} per trip.`;

        // Calculate the average spend of direct referrals
        const directReferralAvgSpend = node.children.reduce((acc, child) => acc + child.avg_spend, 0) / (node.children.length || 1);
        const referralEfficiencyComment = directReferralAvgSpend > node.avg_spend ?
            "is bringing in higher-value customers compared to their own spending." :
            "is bringing in lower-value customers compared to their own spending.";

        // Calculate LTV Contribution
        function calculateTotalSpend(node) {
            return node.total_spend + node.children.reduce((total, child) => total + calculateTotalSpend(child), 0);
        }
        const ltvContribution = calculateTotalSpend(node);
    
        return (
            <div className="text-bold">
                <p>{ageComment}</p>
                <p>{relationshipComment}</p>
                <p>{referralTotalComment}</p>
                <p>{node.name} {referralEfficiencyComment} Their average referral spends ${directReferralAvgSpend.toLocaleString()} compared to their own average of ${node.avg_spend.toLocaleString()}.</p>
                <p>{referralDepthComment}</p>
                <p>The total lifetime contribution by {node.name} through spend & referrals is ${ltvContribution.toLocaleString()}.</p>
            </div>
        );
    }
    

    const toggleChildrenVisibility = (id) => {
        setVisibleReferralId(prevId => prevId === id ? null : id); // Toggle visibility
    };

    console.log(sortedData);

    return (
        <>
            <header>
                <Navbar title="Referral Trees" />
            </header>

            <main className="tb-grey lighten-6" style={{ paddingTop: '30px' }}>
                <div className="container center" style={{ width: '90%', paddingBottom: '100px' }}>
                {(!allowedRoles.includes(userDetails.role)) ? (
                        <div>
                            You do not have permission to view this page.
                        </div>
                    ) : (
                        <>
                    {rows.map((row, rowIndex) => (
                        <>
                            <div
                                className="row"
                                style={{ marginBottom: row.some(referral => referral.id === visibleReferralId) ? '0px' : '' }}
                            >
                                {row.map((referral, index) => (
                                    <div
                                        className="col s12"
                                        key={referral.id}
                                        style={{ marginBottom: row.some(referral => referral.id === visibleReferralId) ? '0px' : '' }}
                                    >
                                        <div
                                            className={`card referral-tree-card ${visibleReferralId === referral.id ? 'tb-teal darken-1 white-text' : ''}`}
                                            style={{
                                                marginBottom: row.some(referral => referral.id === visibleReferralId) ? '0px' : '',
                                                borderRadius: row.some(referral => referral.id === visibleReferralId) ? '10px 10px 0px 0px' : '' 
                                            }}
                                        >
                                            <div className="card-content">
                                                <span className="card-title">
                                                    {referral.name}
                                                </span>
                                                <div className="row" style={{ fontSize: '1.5rem'}}>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {referral.age}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            Age
                                                        </em>
                                                    </div>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {`${referral.relationship_length} year${(referral.relationship_length > 1 || referral.relationship_length === 0) ? 's' : ''}`}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            TB relationship length
                                                        </em>
                                                    </div>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {referral.travel_recency === 0 ? `This year` : referral.travel_recency < 0 ? 
                                                                `in ${Math.abs(referral.travel_recency)} year${Math.abs(referral.travel_recency) !== 1 ? 's' : ''}` : 
                                                                `${Math.abs(referral.travel_recency)} year${Math.abs(referral.travel_recency) !== 1 ? 's' : ''} ago`}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            Latest trip
                                                        </em>
                                                    </div>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {referral.num_trips}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            # Trips
                                                        </em>
                                                    </div>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {referral.total_associated_referrals}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            # Referrals
                                                        </em>
                                                    </div>
                                                    <div className="col s12 l2">
                                                        <span className="text-bold" style={{ fontSize: '1.2rem' }}>
                                                            {`$${referral.total_associated_referral_spend.toLocaleString()}`}
                                                        </span>
                                                        <br />
                                                        <em style={{ fontSize: '1rem' }}>
                                                            {/* <span className="material-symbols-outlined">
                                                                hotel
                                                            </span> */}
                                                            Spend + Referral Spend
                                                        </em>
                                                    </div>
                                                </div>
                                            </div>
                                            {referral.children.length > 0 && (
                                                <div className="card-action">
                                                    <button
                                                        className={`btn ${visibleReferralId === referral.id ? 'tb-teal lighten-1 white-text' : 'tb-teal darken-2'}`}
                                                        onClick={() => toggleChildrenVisibility(referral.id)}>
                                                        {visibleReferralId === referral.id ? 'Hide' : 'View'} Referrals
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {row.some(referral => referral.id === visibleReferralId) && (
                                <div className="row" style={{ marginTop: '0px', paddingTop: '0px'}}>
                                <div className="col s12">
                                    <div className="card tb-grey referral-details-card">
                                        <div className="card-content white-text">
                                            {renderTreeSummary(apiData.find(r => r.id === visibleReferralId))}
                                            {renderChildReferrals(apiData.find(r => r.id === visibleReferralId).children)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            )}
                        </>
                    ))}
                    </>
                    )}
                </div>
            </main>
        </>
    )
}

export default Referrals;
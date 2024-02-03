import React, { useEffect, useState } from 'react';


const Landing = () => {
    const [apiData, setApiData] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API}`)
            .then((res) => res.json())
            .then((data) => {
                setApiData(data);
                setLoaded(true);
            })
            .catch((err) => {
                setError(true);
                console.error(err);
            });
    }, []);

    return (
        <>
            {error ? (
                <p>Error loading data.</p>
            ) : !loaded ? (
                <p>Loading...</p>
            ) : Object.keys(apiData).length === 0 ? (
                <p>No results found.</p>
            ) : (
                Object.entries(apiData).map(([key, value]) => (
                    <p key={key}>{`${key} ${value}`}</p>
                ))
            )}
        </>
    );
};

export default Landing;
import React from 'react';

const LookerDashboard = ({ title, url }) => {

    return (
        <div className="container" style={{ width: '100%' }}>
            <iframe
                title={title}
                height="800"
                src={`https://lookerstudio.google.com/embed/reporting/${url}`}
                frameborder="0"
                style={{
                    border: "none",
                    width: '100%', // Set width to 100% to fill the container
                    maxWidth: '100%' // Ensure it doesn't overflow the parent container
                }}
                allowfullscreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            >
            </iframe>
        </div >
    )

};

export default LookerDashboard;
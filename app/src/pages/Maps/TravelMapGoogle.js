import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import M from 'materialize-css';
import moment from 'moment';

// Import the images
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Set the default icon's options for Leaflet
L.Icon.Default.prototype.options.iconRetinaUrl = iconRetinaUrl;
L.Icon.Default.prototype.options.iconUrl = iconUrl;
L.Icon.Default.prototype.options.shadowUrl = shadowUrl;


const TravelMapGoogle = ({ data }) => {
    const [position, setPosition] = useState([0, 0]);
    const [markers, setMarkers] = useState([]);
    console.log(data);
    console.log(data.length);

    useEffect(() => {
        M.AutoInit();
        if (data && Array.isArray(data) && data.length > 0) {
            const validData = data.filter(item => item.latitude != null && item.longitude != null);
            const markerElements = validData.map((item, index) => (
                <Marker key={index} position={[item.latitude, item.longitude]}>
                    <Popup>
                        {item.primary_traveler} at {item.property_name}<br />
                        {moment(item.date_in).format('MMM Do YYYY')} - {moment(item.date_out).format('MMM Do YYYY')}
                    </Popup>
                </Marker>
            ));
            setMarkers(markerElements);
            if (validData.length > 0) {
                setPosition([validData[0].latitude, validData[0].longitude]);
            }
        }
    }, [data]);

    return (
        <div style={{ height: '400px' }}>
            <MapContainer center={position || [0, 0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers}
            </MapContainer>
        </div>
    );
}

export default TravelMapGoogle;
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import M from 'materialize-css';
import moment from 'moment';

// Fix missing marker issue by setting the icons manually
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const TravelMap = ({ data }) => {
    const [position, setPosition] = useState([0, 0]);
    const [markers, setMarkers] = useState([]);
    const [map, setMap] = useState(null);

    useEffect(() => {
        M.AutoInit();
        if (data && Array.isArray(data) && data.length > 0) {
            const validData = data.filter(item => item.latitude != null && item.longitude != null);

            // Calculate clusters
            const clusters = validData.reduce((acc, item) => {
                const key = `${Math.round(item.latitude)}-${Math.round(item.longitude)}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(item);
                return acc;
            }, {});

            if (Object.keys(clusters).length === 0) {
                return;
            }

            // Find the densest cluster key
            const densestKey = Object.keys(clusters).reduce((a, b) => {
                // Ensure that both a and b are defined keys in clusters and have populated arrays
                return (clusters[a] && clusters[b] && clusters[a].length > clusters[b].length) ? a : b;
            });

            // Calculate the center of the densest cluster
            if (densestKey && clusters[densestKey] && clusters[densestKey].length > 0) {
                const sum = clusters[densestKey].reduce((acc, item) => ({
                    lat: acc.lat + item.latitude,
                    lng: acc.lng + item.longitude
                }), { lat: 0, lng: 0 });

                const centroid = {
                    lat: sum.lat / clusters[densestKey].length,
                    lng: sum.lng / clusters[densestKey].length
                };
                setPosition([centroid.lat, centroid.lng]);
            }

            // Set markers for all valid data
            // TODO make this pop up nicer
            const markerElements = validData.map((item, index) => (
                <Marker key={index} position={[item.latitude, item.longitude]}>
                    <Popup>
                        <span className="text-bold">{item.property_name}</span><br />
                        {moment(item.date_in).format('MMM Do YYYY')} - {moment(item.date_out).format('MMM Do YYYY')}<br />
                        {item.primary_traveler} x{item.num_pax}<br />
                        {item.consultant_display_name} <br />
                        {item.agency_name && item.agency_name !== "n/a" ? <>Agency: {item.agency_name}<br /></> : null}
                    </Popup>
                </Marker>
            ));
            setMarkers(markerElements);
        }
    }, [data]);

    // function to fly to most populated cluster
    // useEffect(() => {
    //     if (map) {
    //         map.flyTo(position, 5, {
    //             animate: true,
    //             duration: 2
    //         });
    //     }
    // }, [position, map]);

    return (
        <div className="travel-map" style={{ height: '400px' }}>
            <MapContainer
                center={position || [0, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%', borderRadius: '5px' }}
                ref={setMap}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers}
            </MapContainer>
        </div>
    );
}

export default TravelMap;

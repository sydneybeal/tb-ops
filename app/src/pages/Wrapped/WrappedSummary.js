import React, { useEffect, useState, useCallback } from 'react';
import TravelMap from '../../pages/Maps/TravelMap';
import moment from 'moment';

const WrappedSummary = ({ data, consultantName=null, isFiscal }) => {
    const [stats, setStats] = useState(null);
    const [expandProperties, setExpandProperties] = useState(false);
    const [expandCoreDestinations, setExpandCoreDestinations] = useState(false);
    // const [expandLocations, setExpandLocations] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g, 
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const summarizeAccommodationData = useCallback((records) => {
        if (records.length === 0) return {};
        // console.log(records[0]);
        const summary = records.reduce((acc, record) => {
            // Calculate total bed nights and total travelers
            acc.totalBedNights += record.bed_nights;
            acc.totalTravelers += record.num_pax;
    
            // Increment the count for total stays
            acc.totalStays++;
    
            // Count unique countries and properties
            acc.agencies.add(record.agency_name);
            acc.countries.add(record.country_name);
            acc.properties.add(record.property_name);
            acc.portfolios.add(record.property_portfolio);
            acc.locations.add(record.property_location);
    
            // Aggregate counts for top statistics
            if (record.property_location && record.property_location !== 'Unknown') {
                acc.locationCount[record.property_location] = (acc.locationCount[record.property_location] || 0) + record.bed_nights;
            }
            acc.countryCount[record.country_name] = (acc.countryCount[record.country_name] || 0) + record.bed_nights;
            acc.propertyCount[record.property_name] = (acc.propertyCount[record.property_name] || 0) + record.bed_nights;
            acc.travelerCount[record.primary_traveler] =  (acc.travelerCount[record.primary_traveler] || 0) + record.bed_nights;
            if (record.property_portfolio !== 'Unknown' && record.property_portfolio !== 'Independent') {
                acc.portfolioCount[record.property_portfolio] = (acc.portfolioCount[record.property_portfolio] || 0) + record.bed_nights;
            }
            acc.coreDestinationCount[record.core_destination_name] = (acc.coreDestinationCount[record.core_destination_name] || 0) + record.bed_nights;
            if (record.agency_name !== 'n/a') {
                acc.agencyCount[record.agency_name] = (acc.agencyCount[record.agency_name] || 0) + record.bed_nights;
            }

            // By property type
            if (record.property_type) {
                // Total bed nights per property type
                acc.propertyTypeCount[record.property_type] = 
                    (acc.propertyTypeCount[record.property_type] || 0) + record.bed_nights;

                // Nested breakdown: propertyType -> property -> bed_nights
                if (!acc.propertyTypePropertiesCount[record.property_type]) {
                    acc.propertyTypePropertiesCount[record.property_type] = {};
                }
                acc.propertyTypePropertiesCount[record.property_type][record.property_name] =
                    (acc.propertyTypePropertiesCount[record.property_type][record.property_name] || 0) + record.bed_nights;
            }

            // By property type
            if (record.core_destination_name && record.property_location) {
                // Nested breakdown: propertyType -> property -> bed_nights
                if (!acc.coreDestinationLocationsCount[record.core_destination_name]) {
                    acc.coreDestinationLocationsCount[record.core_destination_name] = {};
                }
                acc.coreDestinationLocationsCount[record.core_destination_name][record.property_location] =
                    (acc.coreDestinationLocationsCount[record.core_destination_name][record.property_location] || 0) + record.bed_nights;
            }

            // if (record.property_type) {
            //     acc.propertyTypeCount[record.property_type] = (acc.propertyTypeCount[record.property_type] || 0) + record.bed_nights;
            // }
            // Track check-ins per day
            acc.checkInCount[record.date_in] = (acc.checkInCount[record.date_in] || 0) + 1;
    
            // Consultant bed night breakdown
            if (!acc.consultantBedNights[record.consultant_display_name]) {
                acc.consultantBedNights[record.consultant_display_name] = 0;
            }
            acc.consultantBedNights[record.consultant_display_name] += record.bed_nights;

            // Consultant bed night breakdown
            if (!acc.propertyBedNights[record.property_name]) {
                acc.propertyBedNights[record.property_name] = 0;
            }
            acc.propertyBedNights[record.property_name] += record.bed_nights;
    
            return acc;
        }, {
            totalBedNights: 0,
            totalStays: 0,
            totalTravelers: 0,
            countries: new Set(),
            properties: new Set(),
            locations: new Set(),
            portfolios: new Set(),
            agencies: new Set(),
            locationCount: {},
            countryCount: {},
            portfolioCount: {},
            propertyCount: {},
            agencyCount: {},
            travelerCount: {},
            coreDestinationCount: {},
            checkInCount: {},
            consultantBedNights: {},
            propertyBedNights: {},
            propertyTypeCount: {},
            propertyTypePropertiesCount: {},
            coreDestinationLocationsCount: {}
        });
    
        // Convert sets to counts
        summary.countries = summary.countries.size;
        summary.properties = summary.properties.size;
        summary.locations = summary.locations.size;
        summary.portfolios = summary.portfolios.size;
        summary.agencies = summary.agencies.size;
    
        // Find top entries in each category
        summary.topLocation = findTopEntry(summary.locationCount);
        summary.topCountry = findTopEntry(summary.countryCount);
        summary.topPortfolio = findTopEntry(summary.portfolioCount);
        summary.topProperty = findTopEntry(summary.propertyCount);
        summary.topCoreDestination = findTopEntry(summary.coreDestinationCount);
    
        // Day with most check-ins
        summary.dayWithMostCheckIns = findTopEntry(summary.checkInCount);
    
        return summary;
    }, []);
    
    useEffect(() => {
        if (Array.isArray(data)) {
            const computedStats = summarizeAccommodationData(data);
            setStats(computedStats);
        } else {
            setStats(null);
        }
    }, [data, summarizeAccommodationData]);

    const findTopEntry = (entries) => {
        if (Object.entries(entries).length === 0) return ['', 0];
        return Object.entries(entries).reduce((top, current) => {
            return (top[1] > current[1] ? top : current);
        }, ['', 0]); // Initial value for comparison
    };

    const getSortedTopEntries = useCallback((statsObject, key, isExpanded) => {
        if (!statsObject || !statsObject[key]) {
            return [];
        }
        const sortedEntries = Object.entries(statsObject[key])
            .sort((a, b) => b[1] - a[1]); // Sort by descending order
        return isExpanded ? sortedEntries : sortedEntries.slice(0, 5);
    }, []);

    // const sortedConsultants = stats ? getSortedTopEntries(stats, 'consultantBedNights', expandConsultants) : [];
    const sortedCoreDestinations = stats ? getSortedTopEntries(stats, 'coreDestinationCount', expandCoreDestinations) : [];
    // const sortedLocations = stats ? getSortedTopEntries(stats, 'locationCount', expandLocations) : [];
    const sortedProperties = stats ? getSortedTopEntries(stats, 'propertyCount', expandProperties) : [];
    const sortedPortfolios = stats ? getSortedTopEntries(stats, 'portfolioCount', expandProperties) : [];
    const sortedAgencies = stats ? getSortedTopEntries(stats, 'agencyCount', expandProperties) : [];
    const sortedPropertyTypes = stats ? getSortedTopEntries(stats, 'propertyTypeCount', true) : [];
    const sortedTravelers = stats ? getSortedTopEntries(stats, 'travelerCount', expandProperties) : [];

    function getTopPropertiesForType(stats, propertyType, limit = 3) {
        if (!stats || !stats.propertyTypePropertiesCount || !stats.propertyTypePropertiesCount[propertyType]) return [];
        const entries = Object.entries(stats.propertyTypePropertiesCount[propertyType])
            .sort((a, b) => b[1] - a[1]); // sort by bed nights desc
        return entries.slice(0, limit);
    }

    function getTopLocationsForCoreDestination(stats, coreDestination, limit = 3) {
        if (!stats || !stats.coreDestinationLocationsCount || !stats.coreDestinationLocationsCount[coreDestination]) return [];
        const entries = Object.entries(stats.coreDestinationLocationsCount[coreDestination])
            .sort((a, b) => b[1] - a[1]); // sort by bed nights desc
        return entries.slice(0, limit);
    }

    // console.log(data[0]);
    
    
    return (
        // Example usage with your data array
        <div style={{ position: 'relative', width: '100%',  margin: '0 auto', padding: '0', textAlign: 'center' }}>
            {stats ? (
                (() => {
                    const pages = [
                        // Summmary
                        <div 
                            style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px', 
                                background: 'linear-gradient(135deg, #c2e59c 0%, #64b3f4 100%)', 
                                borderRadius: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h2 style={{ fontWeight: '900', fontSize: '3rem', margin: '20px 0', color: '#fff' }}>
                                In {isFiscal ? 'FY 2023' : '2024'}, You Booked {stats.totalBedNights.toLocaleString()} Bed Nights
                            </h2>
                            <p style={{ fontSize: '1.4rem',  color: '#fff', margin: '10px 0' }}>
                                <span style={{ fontSize: '2rem' }}>🌍</span><br/>
                                Locations: <strong>{stats.locations}</strong> | Countries: <strong>{stats.countries}</strong>
                            </p>
                            <p style={{ fontSize: '1.4rem', marginTop: '30px', color: '#fff' }}>
                                <span style={{ fontSize: '2rem' }}>🛎️</span><br/>
                                Segments: <strong>{stats.totalStays}</strong> | Portfolios: <strong>{stats.portfolios}</strong> | Properties: <strong>{stats.properties}</strong>
                            </p>
                            <p style={{ fontSize: '1.4rem', marginTop: '30px', color: '#fff' }}>
                                <span style={{ fontSize: '2rem' }}>🚀</span><br/>
                                Busiest Day: <strong>{moment(stats.dayWithMostCheckIns[0]).format("ddd, MMM D")}</strong> 
                                &nbsp;({stats.dayWithMostCheckIns[1]} Check-ins)
                            </p>
                        </div>,
                    
                        // Top Properties
                        <div 
                            style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px', 
                                background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', 
                                borderRadius: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                                Your Top Properties <span style={{ fontSize: '2rem' }}>🏨</span>
                            </h2>
                            {sortedProperties.map(([property, nights], index) => (
                                <div 
                                    key={index} 
                                    style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}>
                                    {index + 1}. <strong>{property}</strong> <span style={{ color: '#fff' }}>• {nights} bed nights</span>
                                </div>
                            ))}
                            <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '80px 0 0 0', color: '#fff' }}>
                                Property Type Breakdown <span style={{ fontSize: '2rem' }}>⛺</span>
                            </h2>
                            <div className="row">
                            {sortedPropertyTypes.map(([type, nights], index) => (
                                <div
                                    className={`col ${(index === 4) || (sortedPropertyTypes.length === 1) ? 'l12' : 'l6'}`}
                                    key={index} 
                                    style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}
                                >
                                    
                                    {/* Now show top 5 properties for this type */}
                                    <div style={{ fontSize: '1.3rem' }}>
                                        <h3 style={{ 
                                            fontWeight: '700', 
                                            fontSize: '1.8rem', 
                                            margin: '20px 0 10px', 
                                            fontFamily: "'Bodoni', sans-serif", 
                                            color: '#fff',
                                            // textDecoration: 'underline'
                                        }}>
                                            Top {toTitleCase(type)} Properties
                                        </h3>
                                        <h3 style={{ 
                                            fontWeight: '700', 
                                            fontSize: '1.4rem', 
                                            margin: '0px 0 20px', 
                                            fontFamily: "'Bodoni', sans-serif", 
                                            color: '#fff',
                                            // textDecoration: 'underline'
                                        }}>
                                            Total: {nights.toLocaleString()} nights
                                        </h3>
                                        {getTopPropertiesForType(stats, type, 5).map(([propName, propNights], i) => (
                                            <div key={i} style={{ margin: '8px 0', color: '#fff' }}>
                                                {i + 1}. <strong>{propName}</strong> • {propNights} bed nights
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>,
                    
                        // Top Portfolios
                        <div 
                            style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                borderRadius: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                                Your Top Portfolios <span style={{ fontSize: '2rem' }}>💼</span>
                            </h2>
                            {sortedPortfolios.map(([portfolio, nights], index) => (
                                <div 
                                    key={index} 
                                    style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}>
                                    {index + 1}. <strong>{portfolio}</strong> • {nights} bed nights
                                </div>
                            ))}
                        </div>,
                    
                        // Top Core Destinations
                        <div 
                            style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px', 
                                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', 
                                borderRadius: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                                Your Top Core Destinations <span style={{ fontSize: '2rem' }}>✈️</span>
                            </h2>
                            {sortedCoreDestinations.map(([coreDest, nights], index) => (
                                <div 
                                    key={index} 
                                    style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}>
                                    {index + 1}. <strong>{coreDest}</strong> • {nights} bed nights
                                </div>
                            ))}
                            <div className="row">
                            {sortedCoreDestinations.map(([core_dest, nights], index) => (
                                <div
                                    className={`col ${(index === 4 || (sortedCoreDestinations.length === 1)) ? 'l12' : 'l6'}`}
                                    key={index} 
                                    style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}
                                >
                                    
                                    {/* Now show top 5 properties for this type */}
                                    <div style={{ fontSize: '1.3rem' }}>
                                        <h3 style={{ 
                                            fontWeight: '700', 
                                            fontSize: '1.8rem', 
                                            margin: '20px 0 10px', 
                                            fontFamily: "'Bodoni', sans-serif", 
                                            color: '#fff',
                                            // textDecoration: 'underline'
                                        }}>
                                            Top {toTitleCase(core_dest)} Locations
                                        </h3>
                                        <h3 style={{ 
                                            fontWeight: '700', 
                                            fontSize: '1.4rem', 
                                            margin: '0px 0 20px', 
                                            fontFamily: "'Bodoni', sans-serif", 
                                            color: '#fff',
                                            // textDecoration: 'underline'
                                        }}>
                                            Total: {nights.toLocaleString()} nights
                                        </h3>
                                        {getTopLocationsForCoreDestination(stats, core_dest, 5).map(([locationName, locationNights], i) => (
                                            <div key={i} style={{ margin: '8px 0', color: '#fff' }}>
                                                {i + 1}. <strong>{locationName}</strong> • {locationNights} bed nights
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>,
                    
                        // Top Locations boxShadow: '0 4px 10px rgba(0,0,0,0.1)'

                        // Top Agencies
                        <div 
                        style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px', 
                            background: 'linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)', 
                            borderRadius: '15px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                        >
                        <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                            Your Top Agencies <span style={{ fontSize: '2rem' }}>🏷️</span>
                        </h2>
                        {sortedAgencies.map(([agency, nights], index) => (
                            <div 
                                key={index} 
                                style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}>
                                {index + 1}. <strong>{agency !== "null" ? agency : "Unknown"}</strong> • {nights} bed nights
                            </div>
                        ))}
                        </div>,

                        // Top Travelers
                        <div 
                        style={{ 
                            textAlign: 'center', 
                            padding: '40px 20px', 
                            background: 'linear-gradient(135deg, #7F7FD5 0%, #86A8E7 50%, #91EAE4 100%)', 
                            borderRadius: '15px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                        >
                        <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                            Your Top Travelers <span style={{ fontSize: '2rem' }}>🚶</span>
                        </h2>
                        {sortedTravelers.map(([client, nights], index) => (
                            <div 
                                key={index} 
                                style={{ fontSize: '1.6rem', margin: '15px 0', color: '#fff', fontWeight: '600' }}>
                                {index + 1}. <strong>{client !== "null" ? client : "Unknown"}</strong> • {nights} bed nights
                            </div>
                        ))}
                        </div>,
                    
                        // Traveler Map
                        <div 
                            style={{ 
                                textAlign: 'center', 
                                padding: '40px 20px', 
                                background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', 
                                borderRadius: '15px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h2 style={{ fontWeight: '900', fontSize: '2.5rem', margin: '20px 0', color: '#fff' }}>
                                2024 Traveler Map <span style={{ fontSize: '2rem' }}>🗺️</span>
                            </h2>
                            <p style={{ fontSize: '1.2rem', color: '#fff', margin: '10px 0 30px 0' }}>
                                Explore where your clients have been!
                            </p>
                            <div style={{ border: '5px solid #fff', borderRadius: '10px', overflow: 'hidden' }}>
                                <TravelMap data={data} />
                            </div>
                        </div>
                    ];
    
                    const totalPages = pages.length;

                    const handleNext = () => {
                        setCurrentPage((prev) => (prev + 1) % totalPages);
                    };
    
                    const handlePrev = () => {
                        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
                    };
    
                    return (
                        <>
                            <div
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                            >
                                <button 
                                    onClick={handlePrev} 
                                    style={{
                                        border: 'none', 
                                        background: '#ccc', 
                                        padding: '5px 10px', 
                                        borderRadius: '50px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    ←
                                </button>
                                <button 
                                    onClick={handleNext} 
                                    style={{
                                        border: 'none', 
                                        background: '#ccc', 
                                        padding: '5px 10px', 
                                        borderRadius: '50px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem'
                                    }}
                                >
                                    →
                                </button>
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        style={{
                                            width: '30px', 
                                            height: '5px', 
                                            background: i === currentPage ? '#000' : '#999', 
                                            borderRadius: '2px'
                                        }}
                                        onClick={() => setCurrentPage(i)}
                                    ></div>
                                ))}
                            </div>
                            <div
                                style={{ marginTop: '10px', marginBottom: '30px', minHeight: '300px', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <div className="scoreboard">
                                    <h5 style={{fontSize: '1.8rem'}}>
                                        {consultantName ? consultantName : 'All Consultants'}
                                    </h5>
                                </div>
                                {pages[currentPage]}
                            </div>
                        </>
                    );
                })()
            ) : (
                <p>Loading data or data format incorrect...</p> // Adjusted message to reflect potential issues
            )}
        </div>
    )
}

export default WrappedSummary;
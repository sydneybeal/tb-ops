import React, { useEffect, useState, useCallback } from 'react';
import moment from 'moment';

const TravelSummary = ({ data }) => {
    const [stats, setStats] = useState(null);
    const [expandConsultants, setExpandConsultants] = useState(false);
    const [expandCoreDestinations, setExpandCoreDestinations] = useState(false);
    const [expandLocations, setExpandLocations] = useState(false);

    console.log(JSON.stringify(stats,null,2));

    const summarizeAccommodationData = useCallback((records) => {
        if (records.length === 0) return {};
        const summary = records.reduce((acc, record) => {
            // Calculate total bed nights and total travelers
            acc.totalBedNights += record.bed_nights;
            acc.totalTravelers += record.num_pax;
    
            // Increment the count for total stays
            acc.totalStays++;
    
            // Count unique countries and properties
            acc.countries.add(record.country_name);
            acc.properties.add(record.property_name);
    
            // Aggregate counts for top statistics
            acc.locationCount[record.property_location] = (acc.locationCount[record.property_location] || 0) + record.bed_nights;
            acc.countryCount[record.country_name] = (acc.countryCount[record.country_name] || 0) + record.bed_nights;
            acc.portfolioCount[record.property_portfolio] = (acc.portfolioCount[record.property_portfolio] || 0) + record.bed_nights;
            acc.coreDestinationCount[record.core_destination_name] = (acc.coreDestinationCount[record.core_destination_name] || 0) + record.bed_nights;
    
            // Track check-ins per day
            acc.checkInCount[record.date_in] = (acc.checkInCount[record.date_in] || 0) + 1;
    
            // Consultant bed night breakdown
            if (!acc.consultantBedNights[record.consultant_display_name]) {
                acc.consultantBedNights[record.consultant_display_name] = 0;
            }
            acc.consultantBedNights[record.consultant_display_name] += record.bed_nights;
    
            return acc;
        }, {
            totalBedNights: 0,
            totalStays: 0,
            totalTravelers: 0,
            countries: new Set(),
            properties: new Set(),
            locationCount: {},
            countryCount: {},
            portfolioCount: {},
            coreDestinationCount: {},
            checkInCount: {},
            consultantBedNights: {}
        });
    
        // Convert sets to counts
        summary.countries = summary.countries.size;
        summary.properties = summary.properties.size;
    
        // Find top entries in each category
        summary.topLocation = findTopEntry(summary.locationCount);
        summary.topCountry = findTopEntry(summary.countryCount);
        summary.topPortfolio = findTopEntry(summary.portfolioCount);
        summary.topCoreDestination = findTopEntry(summary.coreDestinationCount);
    
        // Day with most check-ins
        summary.dayWithMostCheckIns = findTopEntry(summary.checkInCount);
    
        return summary;
    }, []);
    
    useEffect(() => {
        if (Array.isArray(data)) {
            const computedStats = summarizeAccommodationData(data);
            setStats(computedStats);
            console.log(computedStats ? JSON.stringify(computedStats, null, 2) : 'No data to display');
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
        return isExpanded ? sortedEntries : sortedEntries.slice(0, 3);
    }, []);

    // Example usage for consultantBedNights and coreDestinationCount
    const sortedConsultants = stats ? getSortedTopEntries(stats, 'consultantBedNights', expandConsultants) : [];
    const sortedCoreDestinations = stats ? getSortedTopEntries(stats, 'coreDestinationCount', expandCoreDestinations) : [];
    const sortedLocations = stats ? getSortedTopEntries(stats, 'locationCount', expandLocations) : [];
    
    return (
        // Example usage with your data array
        <div>
            {stats ? (
                <>
                    <div className="row" style={{ width: '90%', marginTop: '0px', paddingTop: '0px'}}>
                        <div className="col s6 l2">
                            <span className="text-bold" style={{ fontSize: '1.6rem' }}>
                                {stats.totalBedNights}
                            </span>
                            <br />
                            <em className="tb-grey-text text-darken-2" style={{ fontSize: '1.2rem' }}>
                                <span className="material-symbols-outlined">
                                    dark_mode
                                </span>
                                # Bed Nights
                            </em>
                        </div>
                        <div className="col s6 l2">
                            <span className="text-bold" style={{ fontSize: '1.6rem' }}>
                                {stats.totalTravelers}
                            </span>
                            <br />
                            <em className="tb-grey-text text-darken-2" style={{ fontSize: '1.2rem' }}>
                                <span className="material-symbols-outlined">
                                    group
                                </span>
                                # Travelers
                            </em>
                        </div>
                        <div className="col s6 l2">
                            <span className="text-bold" style={{ fontSize: '1.6rem' }}>
                                {stats.totalStays}
                            </span>
                            <br />
                            <em className="tb-grey-text text-darken-2" style={{ fontSize: '1.2em' }}>
                                <span className="material-symbols-outlined">
                                    hotel
                                </span>
                                # Segments
                            </em>
                        </div>
                        <div className="col s6 l2">
                            <span className="text-bold" style={{ fontSize: '1.6rem' }}>
                                {stats.countries}
                            </span>
                            <br />
                            <em className="tb-grey-text text-darken-2" style={{ fontSize: '1.2rem' }}>
                                <span className="material-symbols-outlined">
                                    globe
                                </span>
                                # Countries
                            </em>
                        </div>
                        <div className="col s6 l4">
                            <span className="text-bold" style={{ fontSize: '1.6rem' }}>
                                {moment(stats.dayWithMostCheckIns[0]).format("ddd, MMM D")} ({stats.dayWithMostCheckIns[1]} Check-ins)
                            </span>
                            <br />
                            <em className="tb-grey-text text-darken-2" style={{ fontSize: '1.2rem' }}>
                                <span className="material-symbols-outlined">
                                    event
                                </span>
                                Busiest Day
                            </em>
                        </div>
                    </div>
                    <div className="row" style={{ width: '90%', marginTop: '0px', paddingTop: '0px'}}>
                        <div className="col s12 l4">
                            <h5>Top Consultants</h5>
                            {sortedConsultants.map(([consultant, nights], index) => (
                                <div key={index}>
                                    <span className="text-bold">{consultant} </span>
                                    <span>({nights} bed nights)</span>
                                </div>
                            ))}
                            {Object.keys(stats.consultantBedNights).length > 3 &&
                                <button className="btn btn-small btn-floating tb-teal darken-2" onClick={() => setExpandConsultants(!expandConsultants)}>
                                    <span className="material-symbols-outlined" style={{marginLeft: '2px'}}>
                                        {expandConsultants ? 'collapse_all' : 'expand_all'}
                                    </span>
                                </button>
                            }
                        </div>
                        <div className="col s12 l4">
                            <h5>Top Core Destinations</h5>
                            {sortedCoreDestinations.map(([coreDest, nights], index) => (
                                <div key={index}>
                                    <span className="text-bold">{coreDest} </span>
                                    <span>({nights} bed nights)</span>
                                </div>
                            ))}
                            {Object.keys(stats.coreDestinationCount).length > 3 &&
                                <button className="btn btn-small btn-floating tb-teal darken-2" onClick={() => setExpandCoreDestinations(!expandCoreDestinations)}>
                                    <span className="material-symbols-outlined" style={{marginLeft: '2px'}}>
                                        {expandCoreDestinations ? 'collapse_all' : 'expand_all'}
                                    </span>
                                </button>
                            }
                        </div>
                        <div className="col s12 l4">
                            <h5>Top Locations</h5>
                            {sortedLocations.map(([location, nights], index) => (
                                <div key={index}>
                                    <span className="text-bold">{location !== "null" ? location : "Unknown"} </span>
                                    <span>({nights} bed nights)</span>
                                </div>
                            ))}
                            {Object.keys(stats.locationCount).length > 3 &&
                                <button className="btn btn-small btn-floating tb-teal darken-2" onClick={() => setExpandLocations(!expandLocations)}>
                                    <span className="material-symbols-outlined" style={{marginLeft: '2px'}}>
                                        {expandCoreDestinations ? 'collapse_all' : 'expand_all'}
                                    </span>
                                </button>
                            }
                        </div>
                    </div>
                </>
            ) : (
                <p>Loading data or data format incorrect...</p> // Adjusted message to reflect potential issues
            )}
        </div>
    )
}

export default TravelSummary;
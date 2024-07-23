import { Link } from 'react-router-dom';
export const TripReportCard = ({ tripReport, summary = false }) => {
    const uniqueCountries = new Set();

    // Check if tripReport.properties exists and has length before iterating
    if (tripReport.properties && tripReport.properties.length > 0) {
        tripReport.properties.forEach(segment => {
            const countryName = segment.property_details?.country_name || segment.country_name;
            if (countryName) {
                uniqueCountries.add(countryName);
            }
        });
    }

    const toTitleCase = str => str ? str.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) : '';

    const getRatingAverage = (segment) => {
        if (!segment.ratings) {
            return "n/a";
        }
        
        const overallRating = segment.ratings.find(rating => rating.attribute === "overall_rating");
        
        if (overallRating && overallRating.rating !== "n/a") {
            return overallRating.rating;
        } else {
            return "n/a";
        }
    };
    
    // console.log(tripReport);
    return (
        <div
            key={tripReport.id}
            className={!summary ? "card potential-trip-card" : "container"}
            style={summary ? { marginTop: '20px', width: '90%' } : {}}
        >
            <div className={!summary ? "card-content" : "row"}>
                <div className="row">
                    <h4 className="center report-title">{tripReport.trip_name}</h4>
                </div>
                <div className="row">
                    <div className="col s4">
                        <p className="text-bold">Travelers</p>
                        {tripReport.travelers.map(traveler => (
                            <p
                                style={{ fontSize: '1.1rem' }}
                                key={`traveler-${tripReport.id}-${traveler.id}`}
                                className=""
                            >
                                {traveler.email.split('@')[0]}
                            </p>
                        ))}
                    </div>
                    <div className="col s4">
                        <p className="text-bold">Status</p>
                        {tripReport.review_status === 'final' ? (
                            <div
                                className="chip success-green tb-off-white-text text-bold"
                                style={{ marginRight: '0px'}}
                            >
                                PUBLISHED
                            </div>
                        ) : (
                            <div
                                className="chip tb-teal tb-off-white-text text-bold"
                                style={{ marginRight: '0px'}}
                            >
                                DRAFT
                            </div>
                        )
                        }
                    </div>
                    <div className="col s4">
                        <p className="text-bold">Countries</p>
                        {[...uniqueCountries].map(country => (
                            <p
                                style={{ fontSize: '1.1rem' }}
                                key={`country-${country}`}
                                className=""
                            >
                                {country}
                            </p>
                        ))}
                    </div>
                </div>
                {(tripReport.properties.length > 0 | tripReport.activities.length > 0) && 
                    <hr
                    style={{
                        border: '1px solid #8c8782',
                        borderRadius: '1px',
                        width: '80%',
                        margin: '30px auto'
                    }}
                />
                }
                {tripReport.properties.length > 0 &&
                <>
                    <div style={{marginBottom: '30px'}}>
                        <h5>Properties</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Property Name</th>
                                    <th>Location</th>
                                    <th>Date In</th>
                                    <th>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                            {tripReport.properties.map((segment) => {
                                const rating = getRatingAverage(segment);  // Call the function once per iteration
                                return (
                                    <tr key={`segment-${tripReport.id}-${segment.property_id}`}>
                                        <td>
                                            {segment.property_details?.name || segment.name}
                                            <br/>
                                            <span className="chip tb-grey lighten-3">{segment.property_details?.country_name || segment.country_name}</span>
                                        </td>
                                        <td>
                                            {segment.property_details?.location ?
                                                segment.property_details.location
                                                :
                                                "unknown"
                                            }
                                        </td>
                                        <td>
                                            {segment.date_in}
                                        </td>
                                        <td>
                                            {rating !== "n/a" ? `${rating} / 10` : "n/a"}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </>
                }
                {tripReport.activities.length > 0 &&
                    <div style={{ marginTop: '50px'}}>
                        <h5>Activities</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Activity Name</th>
                                    <th>Rating</th>
                                    <th>Date</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                            {tripReport.activities.map((activity) => (
                                <tr key={`activity-${tripReport.id}-${activity.name}`}>
                                    <td>
                                        {activity.name}
                                        <br/>
                                        <span className="chip tb-grey lighten-3">{toTitleCase(activity.type)}</span>
                                    </td>
                                    <td>
                                        {activity.rating && activity.rating !== "n/a" ? `${activity.rating} / 10` : "n/a"}
                                    </td>
                                    <td>
                                        {activity.visit_date}
                                    </td>
                                    <td>
                                        {activity.location}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                }
                {!summary &&
                    <div className="row" style={{ marginTop: '30px'}}>
                        <Link
                            to={`/trip_reports/edit/${tripReport.id}`}
                            className="btn waves-effect waves-light warning-yellow tb-md-black-text"
                        >
                            <span className="material-symbols-outlined">
                                edit
                            </span>
                            Edit Report
                        </Link>
                    </div>
                }
            </div>
        </div>
    )

}

export default TripReportCard;
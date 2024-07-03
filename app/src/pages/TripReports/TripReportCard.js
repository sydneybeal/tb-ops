import { Link } from 'react-router-dom';
export const TripReportCard = ({ tripReport, summary = false }) => {

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
            console.log("Overall rating: " + overallRating.rating);
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
                {!summary &&
                    <div className="row">
                        {tripReport.review_status === 'final' ? (
                            <div className="chip success-green tb-off-white-text text-bold">
                                PUBLISHED
                            </div>
                        ) : (
                            <div className="chip tb-teal tb-off-white-text text-bold">
                                DRAFT
                            </div>
                        )
                        }
                        <Link
                            to={`/trip_reports/edit/${tripReport.id}`}
                            className="btn btn-small btn-floating waves-effect waves-light warning-yellow tb-md-black-text"
                        >
                            <span className="material-symbols-outlined">
                                edit
                            </span>
                        </Link>
                    </div>
                }
                <span className="text-bold">Travelers: </span>
                {tripReport.travelers.map(traveler => (
                    <span
                        style={{ paddingLeft: '12px' }}
                        key={`traveler-${tripReport.id}-${traveler.id}`}
                        className="chip tb-teal darken-3 tb-off-white-text"
                    >
                        <span style={{ fontSize: '1.1rem'}} >{traveler.email.split('@')[0]} </span>
                    </span>
                ))}
                {tripReport.properties.length > 0 &&
                    <div style={{marginBottom: '30px'}}>
                        <h5>Properties</h5>
                        <table>
                            <thead>
                                <tr>
                                    <th>Property Name</th>
                                    <th>Rating</th>
                                    <th>Date In</th>
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
                                            {rating !== "n/a" ? `${rating} / 10` : "n/a"}
                                        </td>
                                        <td>
                                            {segment.date_in}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                }
                {tripReport.activities.length > 0 &&
                    <>
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
                    </>
                }
            </div>
        </div>
    )

}

export default TripReportCard;
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import M from 'materialize-css';
import moment from 'moment';

const ReportDashboard = ({ id = "reportData", reportData, showPieCharts = true, showMonthly = true, maxProps = 10 }) => {
    useEffect(() => {
        M.AutoInit();
    }, [reportData]);

    if (!reportData || Object.keys(reportData).length === 0) {
        return <div>Sorry, could not generate a report for that.</div>;
    }

    const { report_inputs, calculations } = reportData;
    const formatValue = (key, value) => {
        if (key === 'start_date' || key === 'end_date') {
            return value == null ? "n/a" : value; // Only show "N/A" for null/undefined start_date or end_date
        }
        return value || "ALL"; // For all other keys, fallback to "ALL" for falsy values
    };

    const colorPalette = [
        '#00626e',
        // '#02707d',
        '#057e8c',
        // '#098c9c',
        '#0e9bac',
        // '#2eabba',
        '#56bfcc',
        // '#7fd3dc',
        '#b2ebee',
    ];

    // Bed Nights by Country Chart Data
    const countryPieSeries = calculations.by_country.map(item => item.bed_nights);
    const countryPieLabels = calculations.by_country.map(item => item.name);

    // Bed Nights by Country Chart Options
    const countryPieOptions = {
        colors: colorPalette,
        labels: countryPieLabels,
        legend: {
            position: 'bottom', // Positions legend at the bottom
            horizontalAlign: 'center', // Centers the legend horizontally
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    // Bed Nights by Portfolio Chart Data
    const portfolioPieSeries = calculations.by_portfolio.map(item => item.bed_nights);
    const portfolioPieLabels = calculations.by_portfolio.map(item => item.name);

    // Bed Nights by Portfolio Chart Options
    const portfolioPieOptions = {
        colors: colorPalette,
        labels: portfolioPieLabels,
        legend: {
            position: 'bottom', // Positions legend at the bottom
            horizontalAlign: 'center', // Centers the legend horizontally
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };


    // Function to fill in missing months with 0s
    const fillMissingMonths = (byMonthData) => {
        if (!byMonthData || byMonthData.length === 0) return [];

        // Sort by month to ensure correct order
        const sortedByMonth = byMonthData.sort((a, b) => a.name.localeCompare(b.name));

        const start = moment(sortedByMonth[0].name, "YYYY-MM");
        const end = moment(sortedByMonth[sortedByMonth.length - 1].name, "YYYY-MM");
        const filledMonths = [];

        while (start <= end) {
            const monthStr = start.format("YYYY-MM");
            const existingMonth = sortedByMonth.find(m => m.name === monthStr);

            filledMonths.push({
                name: start.format("MMM YY"), // Format for display
                bed_nights: existingMonth ? existingMonth.bed_nights : 0
            });

            start.add(1, 'month');
        }

        return filledMonths;
    };

    // Use the function to prepare data for the "Bed Nights by Month" chart
    const filledByMonth = fillMissingMonths(calculations.by_month);

    // Bed Nights by Month Chart Data
    const barSeries = [{
        name: "Bed Nights",
        data: filledByMonth.map(item => item.bed_nights)
    }];

    const barOptions = {
        chart: {
            type: 'bar',
            height: 350
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
            },
        },
        colors: ['#0e9bac'], // Replace with your desired regular color
        states: {
            hover: {
                filter: {
                    type: 'darken', // You can use 'none', 'lighten', 'darken'
                    value: 0.75, // Brightness of the hover effect (0 to 1, where 1 is original color)
                }
            }
        },
        xaxis: {
            categories: filledByMonth.map(item => item.name),
            labels: {
                rotate: -45,
                rotateAlways: true,
            },
        }
    };

    const formatPropertyValue = (propertyNames) => {
        if (!propertyNames || propertyNames.length === 0) {
            return 'ALL';
        } else if (propertyNames.length === 1) {
            // If there's only one property, return its name
            return propertyNames[0];
        } else if (propertyNames.length <= 3) {
            // If there are two or three properties, return the count (e.g., "2 properties")
            return `${propertyNames.length} properties`;
        } else {
            // If there are more than three properties, return "3+ properties"
            return '3+ properties';
        }
    };

    const shouldShowCountries = () => {
        return !report_inputs.country_name || calculations.by_country.length > 1;
    };

    const shouldShowPortfolios = () => {
        return !report_inputs.portfolio_name; // Only show if no specific portfolio is selected
    };

    const shouldShowProperties = () => {
        // Show if no properties are specified, or if multiple are specified.
        // If one is specified and it's the only one for the selected country, still show.
        if (!report_inputs.property_names || report_inputs.property_names.length > 1) {
            return true;
        } else if (report_inputs.country_name && calculations.by_country.find(c => c.name === report_inputs.country_name)?.properties?.length === 1) {
            return true;
        }
        return false;
    };


    const showCountries = shouldShowCountries();
    const showPortfolios = shouldShowPortfolios();
    const showProperties = shouldShowProperties();

    const sectionsToShow = [
        showCountries ? 'countries' : null,
        showPortfolios ? 'portfolios' : null,
        showProperties ? 'properties' : null,
    ].filter(Boolean);

    const totalSectionsToShow = 1 + sectionsToShow.length;
    const needSecondRow = totalSectionsToShow === 4;

    // const totalSectionsToShow = ['by_country', 'by_portfolio', 'by_property'].reduce((acc, key) => {
    //     return acc + (calculations[key].length > 1 ? 1 : 0);
    // }, 1);

    let gridClass, totalsGridClass;
    switch (totalSectionsToShow) {
        case 2:
            totalsGridClass = "s12 m6";
            gridClass = "s12 m6";
            break;
        case 3:
            totalsGridClass = "s12 m4";
            gridClass = "s12 m4";
            break;
        case 4:
            totalsGridClass = "s12 m6";
            gridClass = "s12 m6";
            break;
        default:
            totalsGridClass = "s12";
            gridClass = "s12";
    }

    return (
        <div className="container" style={{ width: '90%' }}>
            <div className="card" id={id}>
                <div className="card-content">
                    <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                        <h3 style={{ marginBottom: '30px' }} className="report-title">Bed Night Report</h3>
                        {/* <img
                            id="front-page-logo"
                            src={`${process.env.PUBLIC_URL}/tblogo.png`}
                            alt="roam & report"
                            style={{
                                maxWidth: '20%',
                                height: 'auto', // Ensures the height scales in proportion to the width
                                objectFit: 'contain', // Keeps the aspect ratio and fits the content within the bounds of its container
                                display: 'block',
                                margin: '20px auto'
                            }} /> */}
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Start Date:</span> {formatValue('start_date', report_inputs.start_date)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">End Date:</span> {formatValue('end_date', report_inputs.end_date)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Consultant:</span> {formatValue('consultant_name', report_inputs.consultant_name)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Country:</span> {formatValue('country_name', report_inputs.country_name)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Portfolio:</span> {formatValue('portfolio_name', report_inputs.portfolio_name)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Property:</span> {formatPropertyValue(report_inputs.property_names)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Agency:</span> {formatValue('agency', report_inputs.agency)}
                        </div>
                        <div className="chip tb-teal tb-grey-text text-lighten-5">
                            <span className="text-bold">Booking Channel:</span> {formatValue('booking_channel', report_inputs.booking_channel)}
                        </div>
                    </div>
                    <div className="row" id="overviewRow">
                        <div className={`col ${totalsGridClass} vertically-centered`} style={{ marginBottom: '30px' }}>
                            <div className="container vertically-centered">
                                <h5>Total Bed Nights</h5>
                                <span className="chip tb-grey lighten-2 large-chip text-bold">{calculations.total_bed_nights}</span>
                            </div>
                            {calculations.by_property.length > 1 &&
                                <div className="container vertically-centered">
                                    <h5>Total Countries</h5>
                                    <span className="chip tb-grey lighten-2 large-chip text-bold">{calculations.by_country.length}</span>
                                </div>
                            }
                            {calculations.by_property.length > 1 &&
                                <div className="container vertically-centered">
                                    <h5>Total Properties</h5>
                                    <span className="chip tb-grey lighten-2 large-chip text-bold">{calculations.by_property.length}</span>
                                </div>
                            }
                        </div>
                        {sectionsToShow.includes('countries') && (
                            <div className={`col ${gridClass}`} style={{ marginBottom: '30px' }}>
                                <h5>Top Countries</h5>
                                <table>
                                    <tbody>
                                        {calculations.by_country
                                            .sort((a, b) => b.bed_nights - a.bed_nights)
                                            .slice(0, maxProps === "all" ? undefined : Number(maxProps))
                                            .map((item, index) => (
                                                <tr key={index}>
                                                    <td className="text-bold">{item.name}</td>
                                                    <td className="right-align">{item.bed_nights} nights</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!needSecondRow && sectionsToShow.includes('portfolios') && (
                            <div className={`col ${gridClass}`} style={{ marginBottom: '30px' }}>
                                <h5>Top Portfolios</h5>
                                <table>
                                    <tbody>
                                        {calculations.by_portfolio
                                            .sort((a, b) => b.bed_nights - a.bed_nights)
                                            .slice(0, maxProps === "all" ? undefined : Number(maxProps))
                                            .map((item, index) => (
                                                <tr key={index}>
                                                    <td className="text-bold">{item.name}</td>
                                                    <td className="right-align">{item.bed_nights} nights</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!needSecondRow && sectionsToShow.includes('properties') && (
                            <div className={`col ${gridClass}`} style={{ marginBottom: '30px' }}>
                                <h5>Top Properties</h5>
                                <table>
                                    <tbody>
                                        {calculations.by_property
                                            .sort((a, b) => b.bed_nights - a.bed_nights)
                                            .slice(0, maxProps === "all" ? undefined : Number(maxProps))
                                            .map((item, index) => (
                                                <tr key={index}>
                                                    <td className="text-bold">{item.name}</td>
                                                    <td className="right-align">{item.bed_nights} nights</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {needSecondRow && (
                        <div className="row">
                            {sectionsToShow.includes('portfolios') && (
                                <div className={`col ${gridClass}`} style={{ marginBottom: '30px' }}>
                                    <h5>Top Portfolios</h5>
                                    <table>
                                        <tbody>
                                            {calculations.by_portfolio
                                                .sort((a, b) => b.bed_nights - a.bed_nights)
                                                .slice(0, maxProps === "all" ? undefined : Number(maxProps))
                                                .map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="text-bold">{item.name}</td>
                                                        <td className="right-align">{item.bed_nights} nights</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {sectionsToShow.includes('properties') && (
                                <div className={`col ${gridClass}`} style={{ marginBottom: '30px' }}>
                                    <h5>Top Properties</h5>
                                    <table>
                                        <tbody>
                                            {calculations.by_property
                                                .sort((a, b) => b.bed_nights - a.bed_nights)
                                                .slice(0, maxProps === "all" ? undefined : Number(maxProps))
                                                .map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="text-bold">{item.name}</td>
                                                        <td className="right-align">{item.bed_nights} nights</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                            )}
                        </div>
                    )}
                    {showMonthly && (
                        <>
                            <div className="row" id="monthlyRow">
                                <div className="col s12">
                                    <h5>By Month</h5>
                                    <Chart options={barOptions} series={barSeries} type="bar" height={350} />
                                </div>
                            </div>
                            <br />
                            <br />
                        </>
                    )}
                    {showPieCharts && (
                        <div className="row center" id="pieChartRow">
                            <div className="col s12 m6 center">
                                <h5>By Country</h5>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chart className="center" options={countryPieOptions} series={countryPieSeries} type="pie" width="380" />
                                </div>
                            </div>
                            <div className="col s12 m6 center">
                                <h5>By Portfolio</h5>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Chart className="center" options={portfolioPieOptions} series={portfolioPieSeries} type="pie" width="380" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ReportDashboard;

import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import M from 'materialize-css';
import moment from 'moment';

const ReportDashboard = ({ reportData }) => {
    // States for toggling visibility of charts
    const [showPieCharts, setShowPieCharts] = useState(true);

    useEffect(() => {
        M.AutoInit();
    }, [reportData]);

    if (!reportData || Object.keys(reportData).length === 0) {
        return <div>Sorry, could not generate a report for that.</div>;
    }

    const { report_inputs, calculations } = reportData;
    const formatValue = (value) => value || "ALL";

    const colorPalette = [
        '#b2dfdb',
        '#80cbc4',
        '#4db6ac',
        '#26a69a',
        '#009688',
        '#00897b',
        '#00796b',
        '#00695c',
        '#004d40',
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
        colors: ['#26a69a'], // Replace with your desired regular color
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
        }
    };

    return (
        <div className="container" style={{ width: '90%' }}>
            <div className="row report-toggles">
                <span>
                    <label>
                        <input type="checkbox" checked={showPieCharts} onChange={() => setShowPieCharts(!showPieCharts)} />
                        <span>Show Pie Charts</span>
                    </label>
                </span>
            </div>
            <div className="card">
                <div className="card-content">
                    <h4>Bed Night Report</h4>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">Start Date:</span> {formatValue(report_inputs.start_date)}
                    </div>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">End Date:</span> {formatValue(report_inputs.end_date)}
                    </div>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">Consultant:</span> {formatValue(report_inputs.consultant_name)}
                    </div>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">Country:</span> {formatValue(report_inputs.country_name)}
                    </div>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">Portfolio:</span> {formatValue(report_inputs.portfolio_name)}
                    </div>
                    <div className="chip teal lighten-4">
                        <span className="text-bold">Property:</span> {formatValue(report_inputs.property_name)}
                    </div>
                    <br />
                    <br />

                    <div className="row">
                        <div className="col s12 m6 vertically-centered">
                            <div className="container vertically-centered">
                                <h5>Total Bed Nights</h5>
                                <span className="chip large-chip text-bold">{calculations.total_bed_nights}</span>
                            </div>
                            <div className="container vertically-centered">
                                <h5>Total Countries</h5>
                                <span className="chip large-chip text-bold">{calculations.by_country.length}</span>
                            </div>
                            <div className="container vertically-centered">
                                <h5>Total Properties</h5>
                                <span className="chip large-chip text-bold">{calculations.by_property.length}</span>
                            </div>
                        </div>
                        <div className="col s12 m6">
                            <h5>Top Countries</h5>
                            <table>
                                <tbody>
                                    {calculations.by_country
                                        .sort((a, b) => b.bed_nights - a.bed_nights)
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <tr key={index}>
                                                <td className="text-bold">{item.name}</td>
                                                <td className="right-align">{item.bed_nights} nights</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <br />
                    <br />

                    <div className="row">
                        <div className="col s12 m6">
                            <h5>Top Portfolios</h5>
                            <table>
                                <tbody>
                                    {calculations.by_portfolio
                                        .sort((a, b) => b.bed_nights - a.bed_nights)
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <tr key={index}>
                                                <td className="text-bold">{item.name}</td>
                                                <td className="right-align">{item.bed_nights} nights</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="col s12 m6">
                            <h5>Top Properties</h5>
                            <table>
                                <tbody>
                                    {calculations.by_property
                                        .sort((a, b) => b.bed_nights - a.bed_nights)
                                        .slice(0, 5)
                                        .map((item, index) => (
                                            <tr key={index}>
                                                <td className="text-bold">{item.name}</td>
                                                <td className="right-align">{item.bed_nights} nights</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <br />
                    <br />

                    <div className="row">
                        <div className="col s12">
                            <h5>By Month</h5>
                            <Chart options={barOptions} series={barSeries} type="bar" height={350} />
                        </div>
                    </div>
                    <br />
                    <br />
                    {showPieCharts && (
                        <div className="row center">
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

import React, { useEffect, useState } from 'react';
import M from 'materialize-css/dist/js/materialize';
import ReportDashboard from './ReportDashboard';
import BedNightTable from '../AccommodationLogs/BedNightTable';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportPreviewModal = ({ reportData, filteredData, onClose, isOpen }) => {
    const [showPieCharts, setShowPieCharts] = useState(true);
    const [showMonthly, setShowMonthly] = useState(true);
    const [maxProps, setMaxProps] = useState(10);

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose();
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('add-log-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen) return;
    }, [isOpen, onClose]);

    const handleDownloadPdf = async () => {
        M.toast({
            html: 'Feature not available at this time.',
            displayLength: 2000,
            classes: 'warning-yellow tb-md-black-text',
        });
        // const elementOne = document.getElementById('reportData');
        // const elementTwo = document.getElementById('bedNightTable');
        // if (!elementOne || !elementTwo) {
        //     console.error('Element not found');
        //     return;
        // }

        // const canvasOne = await html2canvas(elementOne);
        // const dataUrlOne = canvasOne.toDataURL('image/png');
        // const canvasTwo = await html2canvas(elementTwo);
        // const dataUrlTwo = canvasTwo.toDataURL('image/png');

        // const pdf = new jsPDF('p', 'mm', 'a4');
        // const margin = 25.4; // 1 inch margin
        // const pageWidth = 210 - (margin * 2); // Page width minus margins

        // // Define a variable to decide if we need to add a new page before adding the second element
        // let addNewPageForSecondElement = true; // Default to true as a safe fallback

        // // Helper function to add content and manage pagination, keeping aspect ratio
        // const addContentToPDF = (dataUrl, canvas, isFirstElement = false) => {
        //     let yPos = margin; // Start position for each new element
        //     const imgWidth = pageWidth; // Full width available for content
        //     const imgHeight = (canvas.height * imgWidth) / canvas.width; // Scale height to maintain aspect ratio

        //     let remainingHeight = imgHeight;

        //     while (remainingHeight > 0) {
        //         const drawHeight = Math.min(remainingHeight, 297 - (margin * 2) - yPos);
        //         const sourceY = (canvas.height * (imgHeight - remainingHeight)) / imgHeight;
        //         const sourceHeight = (canvas.height * drawHeight) / imgHeight;

        //         pdf.addImage(dataUrl, 'PNG', margin, yPos, imgWidth, drawHeight, undefined, 'FAST', 0, sourceY, canvas.width, sourceHeight);

        //         remainingHeight -= drawHeight;
        //         yPos += drawHeight + margin; // Add margin after each page's content

        //         if (remainingHeight > 0) {
        //             pdf.addPage();
        //             yPos = margin; // Reset Y position after adding a new page
        //         }
        //     }

        //     // For the first element, decide if we need a new page based on the remaining space
        //     if (isFirstElement) {
        //         addNewPageForSecondElement = (297 - (margin * 2) - yPos) < margin;
        //     }
        // };

        // // Add first element content and determine if a new page is needed for the second element
        // addContentToPDF(dataUrlOne, canvasOne, true);

        // // If there's not enough space left on the current page, add a new page before the second element
        // if (addNewPageForSecondElement) {
        //     pdf.addPage();
        // }

        // // Add second element content
        // addContentToPDF(dataUrlTwo, canvasTwo);

        // // Download the PDF
        // pdf.save('report.pdf');
        // // Instead of saving the PDF directly, convert it to a Blob
        // // pdf.output('blob').then((blob) => {
        // //     // Create a URL for the Blob
        // //     const pdfUrl = URL.createObjectURL(blob);

        // //     // Open the PDF in a new window or tab
        // //     window.open(pdfUrl, '_blank');
        // // });
    };

    return (
        <div id="add-log-modal" className="modal download-report-modal" style={{ zIndex: '1000', position: 'fixed' }}>
            <div className="modal-content" style={{ zIndex: '1000' }}>

                <div className="row report-toggles" style={{ marginTop: '40px' }}>
                    <span style={{ marginRight: '20px' }}>
                        <label>
                            <input type="checkbox" checked={showPieCharts} onChange={() => setShowPieCharts(!showPieCharts)} />
                            <span>Show Pie Charts</span>
                        </label>
                    </span>
                    <span style={{ marginLeft: '20px', marginRight: '20px' }}>
                        <label>
                            <input type="checkbox" checked={showMonthly} onChange={() => setShowMonthly(!showMonthly)} />
                            <span>Show Monthly</span>
                        </label>
                    </span>
                    <span style={{ marginLeft: '20px', display: 'inline-block', width: '100px' }}>
                        <select
                            value={maxProps}
                            onChange={(e) => setMaxProps(e.target.value)}
                            style={{ textAlign: 'center' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value="all">All</option>
                        </select>
                        {/* </label> */}
                    </span>
                </div>
                <div className="row" style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <button className="btn error-red" style={{ marginRight: '20px' }} onClick={onClose}>Close</button>
                    <button className="btn tb-teal darken-2" style={{ marginLeft: '20px' }} onClick={handleDownloadPdf}>Download</button>
                </div>
                <div className="container">
                    <ReportDashboard reportData={reportData} id="reportData" showPieCharts={showPieCharts} showMonthly={showMonthly} maxProps={maxProps} />
                    <br />
                    <div style={{ marginBottom: '30px' }}>
                        <h5>Matching Bed Nights Preview</h5>
                        <em><span className="text-bold tb-teal-text">{filteredData.length}</span> total results, sample records below.</em>
                    </div>

                    <BedNightTable
                        filteredData={filteredData}
                        isEditable={false}
                        pageSize={10}
                        id="bedNightTable"
                        forReport={true}
                    />
                </div>
            </div>
        </div >
    );
};

export default ReportPreviewModal;

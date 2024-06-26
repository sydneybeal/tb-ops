import React, { useEffect } from 'react';
import M from 'materialize-css';
import TripReportCard from './TripReportCard';

const SaveModal = ({ onClose, isOpen, formData, onSaveAsDraft, onSaveAsFinal }) => {

    useEffect(() => {
        const options = {
            onCloseEnd: () => {
                onClose(); // This will be called when the modal closes
            },
        };
        // if (!isOpen) return;
        const modalElement = document.getElementById('save-report-modal');
        const instance = M.Modal.init(modalElement, options);
        if (isOpen) {
            instance.open();
        } else {
            if (instance) {
                instance.close();
            }
        }
        if (!isOpen) return;
    }, [onClose, isOpen]);

    return (

        <div id="save-report-modal" className="modal add-edit-modal center" style={{ zIndex: '1000', position: 'fixed' }}>
                <div className="modal-content" style={{ zIndex: '1000' }}>
                    <h4>Save Trip Report</h4>
                    <button className="btn btn-small modal-close waves-effect waves-light error-red" onClick={onClose}>
                        Cancel
                    </button>
                    <TripReportCard tripReport={formData} summary={true}/>
                    <div className="row" style={{marginTop: '40px'}}>
                        <div className="col l6">
                            <button className="btn btn-large modal-close waves-effect waves-light tb-teal lighten-2" onClick={onSaveAsDraft}>
                                Save as Draft
                            </button>
                        </div>
                        <div className="col l6">
                            <button className="btn btn-large modal-close waves-effect waves-light tb-teal darken-2" onClick={onSaveAsFinal}>
                                Publish Report
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    );
};

export default SaveModal;
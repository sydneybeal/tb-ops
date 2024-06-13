import React, { useEffect } from 'react';
import M from 'materialize-css';

const SaveModal = ({ onClose, isOpen, formData, onSaveAsDraft, onSaveAsFinal }) => {
    console.log("In saveModal, isOpen is " + isOpen)

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
                    <div className="row">
                        <h5>Travelers</h5>
                        {formData.travelers.map(traveler => (
                            <>
                                <p key={traveler.id} className="tb-grey-text" style={{ fontSize: '1.1rem' }}>
                                    {traveler.email.split('@')[0]}
                                </p>
                            </>
                        ))}
                    </div>
                    <div className="row">
                        <h5>Properties</h5>
                        {formData.properties?.map(property => (
                            (property.property_name || property.new_property_name) && (
                                <p key={property.property_id || property.new_property_name} className="tb-grey-text" style={{ fontSize: '1.1rem' }}>
                                    {property.property_name || property.new_property_name}
                                </p>
                            )
                        ))}
                    </div>
                    <div className="row">
                        <h5>Activities</h5>
                        {formData.activities?.map(activity => (
                            activity.name && (
                                <p key={activity.name} className="tb-grey-text" style={{ fontSize: '1.1rem' }}>
                                    {activity.name}
                                </p>
                            )
                        ))}
                    </div>
                    <div className="row">
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
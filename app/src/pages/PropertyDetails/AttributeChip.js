import React from 'react';

const AttributeChip = ({attribute, icon, label}) => {
    return (
        <div className="prop-chip-wrapper">
            <span className={`chip prop-chip ${attribute === null ? 'tb-grey lighten-4' : attribute ? 'tb-teal lighten-2' : 'tb-grey lighten-3'}`}>                                                                                <span className="text-bold">
                <span className="material-symbols-outlined">
                    {icon}
                </span>
            </span>
                <span className="text-bold">{attribute === null ? "?" : attribute ? 'YES' : 'NO'}</span>
            </span>
            <label className="tb-grey-text text-darken-2">{label}</label>
        </div>
    )
};

export default AttributeChip;
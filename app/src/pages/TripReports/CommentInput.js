import React from 'react';

const CommentInput = ({ item, placeholder, comment, onCommentChange }) => {
    const handleChange = (e) => {
        onCommentChange((e.target.value));
    };

    return (
        <>
            <div className="">
                <div className="input-field col s12">
                    <textarea
                        name={`${item}-comments`}
                        id={`${item}-comments`}
                        value={comment || ''}
                        placeholder={placeholder}
                        onChange={handleChange}
                        // style={{paddingLeft: '10px'}}
                        className="materialize-textarea input-placeholder-dark trip-report-comments"
                    />
                    <label htmlFor={`${item}-comments`}></label>
                </div>
            </div>
        </>
    )
}

export default CommentInput;
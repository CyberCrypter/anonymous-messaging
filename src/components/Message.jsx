import React from 'react';

const Message = ({ message, isSent }) => {
    const { type, content, timestamp } = message;

    const formatTime = (ts) => {
        const date = new Date(ts);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`message ${isSent ? 'sent' : 'received'}`}>
            <div className="message-content">
                {type === 'text' ? (
                    <p className="message-text">{content}</p>
                ) : type === 'photo' ? (
                    <div className="message-photo">
                        <img src={content} alt="Shared photo" />
                    </div>
                ) : null}
                <span className="message-time">{formatTime(timestamp)}</span>
            </div>
        </div>
    );
};

export default Message;

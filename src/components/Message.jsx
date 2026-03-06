import React from 'react';

const Message = ({ message, isSent, senderLabel }) => {
    const { type, content, timestamp } = message;
    const msgType = type === 'photo' ? 'photo' : 'text';

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
                {senderLabel && (
                    <span className="sender-label">{senderLabel}</span>
                )}
                {msgType === 'text' ? (
                    <p className="message-text">{content}</p>
                ) : msgType === 'photo' ? (
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

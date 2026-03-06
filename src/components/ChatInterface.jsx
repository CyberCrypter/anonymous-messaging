import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';

const ChatInterface = ({
    remotePeerId,
    messages,
    remoteTypingText,
    onSendMessage,
    onTypingUpdate,
    onDisconnect
}) => {
    const [inputText, setInputText] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, remoteTypingText]);

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInputText(text);
        onTypingUpdate(text);
    };

    const handleSendText = () => {
        if (inputText.trim()) {
            const messageData = {
                type: 'text',
                content: inputText.trim(),
                timestamp: Date.now(),
            };
            onSendMessage(messageData);
            setInputText('');
            onTypingUpdate(''); // Clear typing status
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendPhoto = () => {
        if (photoPreview) {
            const messageData = {
                type: 'photo',
                content: photoPreview,
                timestamp: Date.now(),
            };
            onSendMessage(messageData);
            setPhotoPreview(null);
            fileInputRef.current.value = '';
        }
    };

    const handleCancelPhoto = () => {
        setPhotoPreview(null);
        fileInputRef.current.value = '';
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <div className="header-info">
                    <div className="status-indicator"></div>
                    <div>
                        <h2>Connected</h2>
                        <p className="peer-id">Peer: {remotePeerId.substring(0, 12)}...</p>
                    </div>
                </div>
                <button className="disconnect-btn" onClick={onDisconnect}>
                    Disconnect
                </button>
            </div>

            <div className="messages-container">
                {messages.length === 0 && !remoteTypingText ? (
                    <div className="empty-state">
                        <div className="empty-icon">💬</div>
                        <p>No messages yet</p>
                        <p className="empty-hint">Send a message to start chatting!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <Message key={index} message={msg} isSent={msg.isSent} />
                        ))}
                        {remoteTypingText && (
                            <div className="message received typing-preview">
                                <div className="message-content">
                                    <p className="message-text typing-text">{remoteTypingText}<span className="cursor">|</span></p>
                                    <span className="message-time">Typing...</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {photoPreview && (
                <div className="photo-preview-container">
                    <div className="photo-preview">
                        <img src={photoPreview} alt="Preview" />
                        <div className="preview-actions">
                            <button className="cancel-btn" onClick={handleCancelPhoto}>
                                Cancel
                            </button>
                            <button className="send-photo-btn" onClick={handleSendPhoto}>
                                Send Photo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="input-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <button
                    className="photo-btn"
                    onClick={() => fileInputRef.current.click()}
                    title="Send photo"
                >
                    📷
                </button>
                <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                />
                <button
                    className="send-btn"
                    onClick={handleSendText}
                    disabled={!inputText.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;

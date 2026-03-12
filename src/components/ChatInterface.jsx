import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import VoiceCallInterface from './VoiceCallInterface';
import { useVoiceCall } from '../hooks/useVoiceCall';

const ChatInterface = ({
    remotePeerId,
    messages,
    remoteTypingText,
    onSendMessage,
    onTypingUpdate,
    onDisconnect,
    peerInstance
}) => {
    const [inputText, setInputText] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [callStatus, setCallStatus] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Voice call functionality
    const {
        callState,
        isAudioEnabled,
        callDuration,
        callerInfo,
        localAudioRef,
        remoteAudioRef,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        toggleAudio,
        isCallActive,
        isIncomingCall,
        isOutgoingCall,
    } = useVoiceCall(peerInstance, (status, peerId) => {
        console.log('Call status changed:', status, peerId);
        setCallStatus(status);
    });

    // Debug logging
    useEffect(() => {
        console.log('ChatInterface Debug:', { 
            peerInstance: !!peerInstance, 
            remotePeerId, 
            callState, 
            isCallActive 
        });
    }, [peerInstance, remotePeerId, callState, isCallActive]);

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
                        {callStatus && callStatus !== 'idle' && (
                            <p className="call-status-text">Call: {callStatus}</p>
                        )}
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="voice-call-btn" 
                        onClick={() => {
                            console.log('Voice call button clicked!', { peerInstance, remotePeerId, callState });
                            if (peerInstance && remotePeerId) {
                                try {
                                    initiateCall(remotePeerId);
                                } catch (error) {
                                    console.error('Failed to initiate call:', error);
                                    alert('Failed to start call. Please check microphone permissions.');
                                }
                            } else {
                                console.error('Missing peerInstance or remotePeerId');
                                alert('Connection not ready for calling');
                            }
                        }}
                        title="Start voice call"
                        style={{ 
                            display: 'flex',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        📞 Call
                    </button>
                    <button className="disconnect-btn" onClick={onDisconnect}>
                        Disconnect
                    </button>
                </div>
            </div>

            <VoiceCallInterface
                callState={callState}
                isAudioEnabled={isAudioEnabled}
                callDuration={callDuration}
                callerInfo={callerInfo}
                remotePeerId={remotePeerId}
                localAudioRef={localAudioRef}
                remoteAudioRef={remoteAudioRef}
                onAnswerCall={answerCall}
                onRejectCall={rejectCall}
                onEndCall={endCall}
                onToggleAudio={toggleAudio}
            />

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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
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

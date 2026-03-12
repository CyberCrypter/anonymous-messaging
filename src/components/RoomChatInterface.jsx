import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import VoiceCallInterface from './VoiceCallInterface';
import { useVoiceCall } from '../hooks/useVoiceCall';

const RoomChatInterface = ({
    peerId,
    roomId,
    isHost,
    messages,
    members,
    remoteTypingTexts,
    onSendMessage,
    onTypingUpdate,
    onLeaveRoom,
    peerInstance,
}) => {
    const [inputText, setInputText] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [copied, setCopied] = useState(false);
    const [voiceChannelMembers, setVoiceChannelMembers] = useState([]);
    const [callStatus, setCallStatus] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Voice call functionality for room
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
        setCallStatus(status);
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, remoteTypingTexts]);

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInputText(text);
        onTypingUpdate(text);
    };

    const handleSendText = () => {
        if (inputText.trim()) {
            const messageData = {
                content: inputText.trim(),
                timestamp: Date.now(),
            };
            onSendMessage(messageData);
            setInputText('');
            onTypingUpdate('');
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

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const activeTypers = Object.entries(remoteTypingTexts).filter(([, text]) => text);

    return (
        <div className="chat-interface">
            <div className="chat-header room-header">
                <div className="header-info">
                    <div className="status-indicator"></div>
                    <div>
                        <h2>
                            Secure Room
                            {isHost && <span className="host-badge">HOST</span>}
                        </h2>
                        <div className="room-meta">
                            <span
                                className="room-id-display"
                                onClick={copyRoomId}
                                title="Click to copy Room ID"
                            >
                                🔑 {roomId.substring(0, 10)}... {copied ? '✓' : '📋'}
                            </span>
                            <span className="member-count">👥 {members.length + 1}</span>
                            {voiceChannelMembers.length > 0 && (
                                <span className="voice-count">🔊 {voiceChannelMembers.length}</span>
                            )}
                        </div>
                        {callStatus && callStatus !== 'idle' && (
                            <p className="call-status-text">Voice: {callStatus}</p>
                        )}
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="voice-channel-btn" 
                        onClick={() => {
                            console.log('Voice channel button clicked!', { peerInstance, members, callState });
                            // For room calls, we'll call the first available member
                            const targetMember = members[0];
                            if (targetMember && peerInstance) {
                                try {
                                    initiateCall(targetMember);
                                } catch (error) {
                                    console.error('Failed to initiate call:', error);
                                    alert('Failed to start call. Please check microphone permissions.');
                                }
                            } else {
                                alert('No members available to call or connection not ready');
                            }
                        }}
                        title="Join voice channel"
                        style={{ 
                            display: members.length > 0 ? 'flex' : 'none',
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
                        🔊 Voice
                    </button>
                    <button className="disconnect-btn" onClick={onLeaveRoom}>
                        {isHost ? 'Destroy Room' : 'Leave Room'}
                    </button>
                </div>
            </div>

            <VoiceCallInterface
                callState={callState}
                isAudioEnabled={isAudioEnabled}
                callDuration={callDuration}
                callerInfo={callerInfo}
                remotePeerId={members[0]} // For simplicity, using first member
                localAudioRef={localAudioRef}
                remoteAudioRef={remoteAudioRef}
                onAnswerCall={answerCall}
                onRejectCall={rejectCall}
                onEndCall={endCall}
                onToggleAudio={toggleAudio}
            />

            <div className="messages-container">
                {messages.length === 0 && activeTypers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🏠</div>
                        <p>Secure Room Active</p>
                        <p className="empty-hint">
                            {isHost
                                ? 'Share the Room ID for others to join!'
                                : 'Send a message to start chatting!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => (
                            <Message
                                key={`${msg.timestamp}-${index}`}
                                message={msg}
                                isSent={msg.isSent}
                                senderLabel={
                                    !msg.isSent && msg.from
                                        ? msg.from.substring(0, 6)
                                        : null
                                }
                            />
                        ))}
                        {activeTypers.map(([typerId, text]) => (
                            <div key={typerId} className="message received typing-preview">
                                <div className="message-content">
                                    <span className="sender-label">{typerId.substring(0, 6)}</span>
                                    <p className="message-text typing-text">
                                        {text}<span className="cursor">|</span>
                                    </p>
                                    <span className="message-time">Typing...</span>
                                </div>
                            </div>
                        ))}
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

export default RoomChatInterface;

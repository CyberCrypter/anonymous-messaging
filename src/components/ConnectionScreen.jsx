import React, { useState } from 'react';

const ConnectionScreen = ({ peerId, onConnect, onCreateRoom, onJoinRoom }) => {
    const [inputPeerId, setInputPeerId] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [copied, setCopied] = useState(false);

    const handleConnect = () => {
        if (inputPeerId.trim()) {
            onConnect(inputPeerId.trim());
        }
    };

    const handleJoinRoom = () => {
        if (roomIdInput.trim()) {
            onJoinRoom(roomIdInput.trim());
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(peerId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="connection-screen">
            <div className="connection-card">
                <div className="logo-section">
                    <div className="logo-icon">🔒</div>
                    <h1>SecureChat P2P</h1>
                    <p className="tagline">End-to-end encrypted peer-to-peer messaging</p>
                </div>

                <div className="id-section">
                    <label>Your Peer ID</label>
                    <div className="id-display">
                        <code>{peerId || 'Generating...'}</code>
                        {peerId && (
                            <button
                                className="copy-btn"
                                onClick={copyToClipboard}
                                title="Copy to clipboard"
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                        )}
                    </div>
                    <p className="help-text">Share this ID with your peer to connect</p>
                </div>

                <div className="divider">
                    <span>1-on-1 CHAT</span>
                </div>

                <div className="connect-section">
                    <label>Connect to Peer</label>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Enter peer ID"
                            value={inputPeerId}
                            onChange={(e) => setInputPeerId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            disabled={!peerId}
                        />
                        <button
                            className="connect-btn"
                            onClick={handleConnect}
                            disabled={!peerId || !inputPeerId.trim()}
                        >
                            Connect
                        </button>
                    </div>
                </div>

                <div className="divider">
                    <span>SECURE ROOM</span>
                </div>

                <div className="room-section">
                    <div className="room-options">
                        <div className="room-create">
                            <label>Host a Room</label>
                            <p className="help-text">Create a room and share the ID. Room is destroyed when you leave.</p>
                            <button
                                className="create-room-btn"
                                onClick={onCreateRoom}
                                disabled={!peerId}
                            >
                                🏠 Create Secure Room
                            </button>
                        </div>

                        <div className="room-join">
                            <label>Join a Room</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Enter room ID"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                    disabled={!peerId}
                                />
                                <button
                                    className="connect-btn"
                                    onClick={handleJoinRoom}
                                    disabled={!peerId || !roomIdInput.trim()}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="privacy-notice">
                    <p>🔐 All messages are sent directly peer-to-peer</p>
                    <p>🗑️ No data is stored - everything is deleted when you close this window</p>
                    <p>🏠 Secure rooms are destroyed when the host leaves</p>
                </div>
            </div>
        </div>
    );
};

export default ConnectionScreen;

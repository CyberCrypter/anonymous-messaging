import React, { useState } from 'react';

const ConnectionScreen = ({ peerId, onConnect }) => {
    const [inputPeerId, setInputPeerId] = useState('');
    const [copied, setCopied] = useState(false);

    const handleConnect = () => {
        if (inputPeerId.trim()) {
            onConnect(inputPeerId.trim());
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
                    <span>OR</span>
                </div>

                <div className="connect-section">
                    <label>Connect to Peer</label>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Enter peer ID"
                            value={inputPeerId}
                            onChange={(e) => setInputPeerId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
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

                <div className="privacy-notice">
                    <p>🔐 All messages are sent directly peer-to-peer</p>
                    <p>🗑️ No data is stored - everything is deleted when you close this window</p>
                </div>
            </div>
        </div>
    );
};

export default ConnectionScreen;

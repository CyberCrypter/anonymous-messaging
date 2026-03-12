import React from 'react';

const VoiceCallInterface = ({
  callState,
  isAudioEnabled,
  callDuration,
  callerInfo,
  remotePeerId,
  localAudioRef,
  remoteAudioRef,
  onAnswerCall,
  onRejectCall,
  onEndCall,
  onToggleAudio,
}) => {
  const renderCallStatus = () => {
    switch (callState) {
      case 'calling':
        return (
          <div className="call-status calling">
            <div className="call-info">
              <div className="avatar">📞</div>
              <div className="call-details">
                <h3>Calling...</h3>
                <p>Peer: {remotePeerId?.substring(0, 12)}...</p>
              </div>
            </div>
            <div className="call-actions">
              <button className="end-call-btn" onClick={onEndCall}>
                <span className="call-icon">📞</span>
                End Call
              </button>
            </div>
          </div>
        );
        
      case 'receiving':
        return (
          <div className="call-status receiving">
            <div className="call-info">
              <div className="avatar">📞</div>
              <div className="call-details">
                <h3>Incoming Call</h3>
                <p>From: {callerInfo?.peerId?.substring(0, 12)}...</p>
              </div>
            </div>
            <div className="call-actions">
              <button 
                className="answer-btn" 
                onClick={() => {
                  console.log('Answer button clicked');
                  onAnswerCall();
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="call-icon">📞</span>
                Answer
              </button>
              <button 
                className="reject-btn" 
                onClick={() => {
                  console.log('Reject button clicked');
                  onRejectCall();
                }}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="call-icon">📵</span>
                Decline
              </button>
            </div>
          </div>
        );
        
      case 'connected':
        return (
          <div className="call-status connected">
            <div className="call-info">
              <div className="avatar active">🔊</div>
              <div className="call-details">
                <h3>Voice Call Active</h3>
                <p>Duration: {callDuration}</p>
                <p className="peer-info">
                  With: {(remotePeerId || callerInfo?.peerId)?.substring(0, 12)}...
                </p>
              </div>
            </div>
            <div className="call-actions">
              <button 
                className={`mute-btn ${!isAudioEnabled ? 'muted' : ''}`}
                onClick={onToggleAudio}
                title={isAudioEnabled ? 'Mute' : 'Unmute'}
              >
                <span className="call-icon">
                  {isAudioEnabled ? '🎤' : '🔇'}
                </span>
                {isAudioEnabled ? 'Mute' : 'Unmute'}
              </button>
              <button className="end-call-btn" onClick={onEndCall}>
                <span className="call-icon">📞</span>
                End Call
              </button>
            </div>
          </div>
        );
        
      case 'ending':
        return (
          <div className="call-status ending">
            <div className="call-info">
              <div className="avatar">📞</div>
              <div className="call-details">
                <h3>Ending Call...</h3>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (callState === 'idle') {
    return null;
  }

  return (
    <div className="voice-call-interface">
      <div className="call-overlay">
        {renderCallStatus()}
        
        {/* Audio elements for playing streams */}
        <audio 
          ref={localAudioRef} 
          autoPlay 
          muted 
          style={{ display: 'none' }}
          onLoadedMetadata={() => console.log('Local audio loaded')}
          onError={(e) => console.error('Local audio error:', e)}
        />
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          style={{ display: 'none' }}
          onLoadedMetadata={() => console.log('Remote audio loaded')}
          onPlaying={() => console.log('Remote audio playing')}
          onError={(e) => console.error('Remote audio error:', e)}
        />
        
        {/* Visual indicators */}
        <div className="audio-visualizer">
          <div className={`sound-bar ${callState === 'connected' ? 'active' : ''}`}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallInterface;
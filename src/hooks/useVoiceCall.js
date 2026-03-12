import { useState, useRef, useCallback, useEffect } from 'react';

export const useVoiceCall = (peerInstance, onCallStatusChange) => {
  const [callState, setCallState] = useState('idle'); // 'idle', 'calling', 'receiving', 'connected', 'ending'
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentCall, setCurrentCall] = useState(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState(null);
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callerInfo, setCallerInfo] = useState(null);
  
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callTimerRef = useRef(null);

  // Initialize call event listeners
  useEffect(() => {
    if (!peerInstance) {
      console.log('No peerInstance available for voice calls');
      return;
    }

    const handleIncomingCall = (call) => {
      console.log('Incoming call from:', call.peer);
      setCurrentCall(call);
      setCallState('receiving');
      setCallerInfo({ peerId: call.peer });
      
      // Set up call event listeners immediately
      call.on('stream', (remoteStream) => {
        console.log('Received remote stream in incoming call:', remoteStream);
        setRemoteAudioStream(remoteStream);
      });

      call.on('close', () => {
        console.log('Incoming call closed');
        endCall();
      });

      call.on('error', (error) => {
        console.error('Incoming call error:', error);
        endCall();
      });
      
      // Notify parent component about incoming call
      if (onCallStatusChange) {
        onCallStatusChange('receiving', call.peer);
      }
    };

    console.log('Setting up call event listener on peerInstance');
    peerInstance.on('call', handleIncomingCall);

    return () => {
      peerInstance.off('call', handleIncomingCall);
    };
  }, [peerInstance, onCallStatusChange]);

  // Update audio refs when streams change
  useEffect(() => {
    if (localAudioRef.current && localAudioStream) {
      localAudioRef.current.srcObject = localAudioStream;
      localAudioRef.current.muted = true; // Prevent echo
    }
  }, [localAudioStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteAudioStream) {
      remoteAudioRef.current.srcObject = remoteAudioStream;
    }
  }, [remoteAudioStream]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected' && !callTimerRef.current) {
      callStartTimeRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else if (callState !== 'connected' && callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callState]);

  const getUserMedia = useCallback(async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }, 
        video: false 
      });
      console.log('Microphone access granted, stream:', stream);
      setLocalAudioStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please enable microphone permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Failed to access microphone: ' + error.message);
      }
      throw error;
    }
  }, []);

  const initiateCall = useCallback(async (remotePeerId) => {
    console.log('Initiating call to:', remotePeerId);
    if (!peerInstance || !remotePeerId) {
      console.error('Invalid peerInstance or remote peer ID:', { peerInstance: !!peerInstance, remotePeerId });
      throw new Error('Invalid peer instance or remote peer ID');
    }

    try {
      setCallState('calling');
      console.log('Getting user media for outgoing call...');
      const stream = await getUserMedia();
      
      console.log('Calling peer with stream:', stream);
      const call = peerInstance.call(remotePeerId, stream);
      setCurrentCall(call);

      if (onCallStatusChange) {
        onCallStatusChange('calling', remotePeerId);
      }

      call.on('stream', (remoteStream) => {
        console.log('Received remote audio stream in outgoing call:', remoteStream);
        setRemoteAudioStream(remoteStream);
        setCallState('connected');
        
        if (onCallStatusChange) {
          onCallStatusChange('connected', remotePeerId);
        }
      });

      call.on('close', () => {
        console.log('Outgoing call closed');
        endCall();
      });

      call.on('error', (error) => {
        console.error('Outgoing call error:', error);
        endCall();
      });

      console.log('Call initiated successfully');
      return call;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setCallState('idle');
      throw error;
    }
  }, [peerInstance, getUserMedia, onCallStatusChange]);

  const answerCall = useCallback(async () => {
    console.log('Attempting to answer call...');
    if (!currentCall) {
      console.error('No incoming call to answer');
      throw new Error('No incoming call to answer');
    }

    try {
      console.log('Getting user media for answer...');
      const stream = await getUserMedia();
      
      console.log('Answering call with stream:', stream);
      // Answer the call with our audio stream
      currentCall.answer(stream);
      
      // Wait a bit for the connection to establish
      setTimeout(() => {
        setCallState('connected');
        console.log('Call state set to connected');
      }, 500);

      if (onCallStatusChange) {
        onCallStatusChange('connected', currentCall.peer);
      }

      // Note: Stream and close/error listeners are already set up in the incoming call handler
      console.log('Call answered successfully');
    } catch (error) {
      console.error('Failed to answer call:', error);
      alert('Failed to answer call. Please check your microphone permissions.');
      endCall();
      throw error;
    }
  }, [currentCall, getUserMedia, onCallStatusChange]);

  const rejectCall = useCallback(() => {
    if (currentCall) {
      currentCall.close();
    }
    endCall();
  }, [currentCall]);

  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    // Close the current call
    if (currentCall && currentCall.open) {
      currentCall.close();
    }

    // Stop local audio stream
    if (localAudioStream) {
      localAudioStream.getTracks().forEach(track => track.stop());
      setLocalAudioStream(null);
    }

    // Clear remote stream
    setRemoteAudioStream(null);
    
    // Reset state
    setCurrentCall(null);
    setCallState('idle');
    setCallerInfo(null);
    setCallDuration(0);

    if (onCallStatusChange) {
      onCallStatusChange('idle', null);
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, [currentCall, localAudioStream, onCallStatusChange]);

  const toggleAudio = useCallback(() => {
    if (localAudioStream) {
      const audioTrack = localAudioStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localAudioStream]);

  const formatCallDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    callState,
    isAudioEnabled,
    callDuration: formatCallDuration(callDuration),
    callerInfo,
    localAudioRef,
    remoteAudioRef,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    isCallActive: callState === 'connected',
    isIncomingCall: callState === 'receiving',
    isOutgoingCall: callState === 'calling',
  };
};
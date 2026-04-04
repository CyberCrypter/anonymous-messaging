import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

const TOKEN_TTL_MS = 5 * 60 * 1000;

const generateOneTimeToken = () => {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
};

export const usePeerConnection = () => {
  const [peerId, setPeerId] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0);
  const [remotePeerId, setRemotePeerId] = useState('');
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteTypingText, setRemoteTypingText] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [peerObject, setPeerObject] = useState(null);
  const peerInstance = useRef(null);
  const inviteTokenRef = useRef('');
  const tokenExpiresAtRef = useRef(0);

  const refreshInviteToken = () => {
    setInviteToken(generateOneTimeToken());
    setTokenExpiresAt(Date.now() + TOKEN_TTL_MS);
  };

  function setupConnection(conn) {
    conn.on('open', () => {
      console.log('Connection established');
      setConnection(conn);
      setIsConnected(true);
      setRemotePeerId(conn.peer);
      setConnectionError('');
    });

    conn.on('data', (data) => {
      if (data.type === 'typing') {
        setRemoteTypingText(data.content);
      } else {
        console.log('Received data:', data);
        setMessages((prev) => [...prev, { ...data, isSent: false }]);
        // Clear typing text when a message is received
        setRemoteTypingText('');
      }
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setIsConnected(false);
      setConnection(null);
      setRemotePeerId('');
      setMessages([]);
      setRemoteTypingText('');
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }

  useEffect(() => {
    inviteTokenRef.current = inviteToken;
  }, [inviteToken]);

  useEffect(() => {
    tokenExpiresAtRef.current = tokenExpiresAt;
  }, [tokenExpiresAt]);

  useEffect(() => {
    // Initialize PeerJS instance
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
      setPeerObject(peer);
      refreshInviteToken();
      console.log('My peer ID is: ' + id);
    });

    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);

      const providedToken = conn.metadata?.authToken;
      const isTokenValid =
        !!providedToken &&
        providedToken === inviteTokenRef.current &&
        Date.now() <= tokenExpiresAtRef.current;

      if (!isTokenValid) {
        console.warn('Rejected connection: invalid or expired one-time token');
        conn.close();
        return;
      }

      // Rotate immediately so this token cannot be reused.
      refreshInviteToken();
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    peerInstance.current = peer;

    // Cleanup on unmount
    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!peerId || isConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      if (Date.now() > tokenExpiresAtRef.current) {
        refreshInviteToken();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [peerId, isConnected]);

  const parseSecureConnectCode = (rawInput) => {
    const value = rawInput.trim();
    const separatorIndex = value.indexOf('+');

    if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
      return null;
    }

    const targetPeerId = value.slice(0, separatorIndex).trim();
    const authToken = value.slice(separatorIndex + 1).trim();

    if (!targetPeerId || !authToken) {
      return null;
    }

    return { targetPeerId, authToken };
  };

  const connectToPeer = (remotePeerIdInput) => {
    if (!peerInstance.current || !remotePeerIdInput) {
      console.error('Invalid peer instance or remote peer ID');
      setConnectionError('Connection is not ready yet. Please try again.');
      return;
    }

    const parsedCode = parseSecureConnectCode(remotePeerIdInput);

    if (!parsedCode) {
      setConnectionError('Use the full secure code in the format: peerId+token');
      return;
    }

    if (parsedCode.targetPeerId === peerId) {
      const selfConnectError = 'You cannot connect to yourself';
      window.alert(selfConnectError);
      setConnectionError(selfConnectError);
      return;
    }

    const conn = peerInstance.current.connect(parsedCode.targetPeerId, {
      metadata: {
        authToken: parsedCode.authToken,
      },
    });

    conn.on('error', () => {
      setConnectionError('Connection rejected. Token may be invalid or already used.');
    });

    setupConnection(conn);
  };

  const sendMessage = (messageData) => {
    if (connection && connection.open) {
      connection.send(messageData);
      setMessages((prev) => [...prev, { ...messageData, isSent: true }]);
      return true;
    }
    return false;
  };

  const sendTypingUpdate = (text) => {
    if (connection && connection.open) {
      connection.send({
        type: 'typing',
        content: text
      });
    }
  };

  const disconnect = () => {
    if (connection) {
      connection.close();
    }
    setIsConnected(false);
    setConnection(null);
    setRemotePeerId('');
    setMessages([]);
    setRemoteTypingText('');
    setConnectionError('');
  };

  const inviteCode = peerId && inviteToken ? `${peerId}+${inviteToken}` : '';

  return {
    peerId,
    inviteCode,
    remotePeerId,
    isConnected,
    messages,
    remoteTypingText,
    connectionError,
    connectToPeer,
    sendMessage,
    sendTypingUpdate,
    disconnect,
    peerInstance: peerObject,
  };
};

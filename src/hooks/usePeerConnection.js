import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export const usePeerConnection = () => {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteTypingText, setRemoteTypingText] = useState('');
  const peerInstance = useRef(null);

  useEffect(() => {
    // Initialize PeerJS instance
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
      console.log('My peer ID is: ' + id);
    });

    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
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

  const setupConnection = (conn) => {
    conn.on('open', () => {
      console.log('Connection established');
      setConnection(conn);
      setIsConnected(true);
      setRemotePeerId(conn.peer);
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
  };

  const connectToPeer = (remotePeerIdInput) => {
    if (!peerInstance.current || !remotePeerIdInput) {
      console.error('Invalid peer instance or remote peer ID');
      return;
    }

    const conn = peerInstance.current.connect(remotePeerIdInput);
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
  };

  return {
    peerId,
    remotePeerId,
    isConnected,
    messages,
    remoteTypingText,
    connectToPeer,
    sendMessage,
    sendTypingUpdate,
    disconnect,
  };
};

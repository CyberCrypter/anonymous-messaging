import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export const usePeerRoom = () => {
  const [peerId, setPeerId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [remoteTypingTexts, setRemoteTypingTexts] = useState({});
  const peerInstance = useRef(null);
  const connections = useRef(new Map()); // peerId -> connection
  const hostConnection = useRef(null); // guest's connection to host

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('connection', (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    peerInstance.current = peer;

    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  const handleIncomingConnection = (conn) => {
    conn.on('open', () => {
      const remotePeerId = conn.peer;
      connections.current.set(remotePeerId, conn);

      // Only host accepts incoming connections for room
      setMembers((prev) => {
        const updated = [...prev, remotePeerId];
        // Notify all existing peers about the updated member list
        broadcastToAll({
          type: 'room-members',
          members: updated,
        }, null);
        return updated;
      });

      conn.on('data', (data) => {
        handleRoomData(data, remotePeerId);
      });

      conn.on('close', () => {
        connections.current.delete(remotePeerId);
        setMembers((prev) => {
          const updated = prev.filter((id) => id !== remotePeerId);
          broadcastToAll({
            type: 'room-members',
            members: updated,
          }, null);
          return updated;
        });
        setRemoteTypingTexts((prev) => {
          const next = { ...prev };
          delete next[remotePeerId];
          return next;
        });
      });
    });
  };

  const handleRoomData = (data, fromPeerId) => {
    if (data.type === 'typing') {
      setRemoteTypingTexts((prev) => ({
        ...prev,
        [fromPeerId]: data.content,
      }));
      // Host relays typing to everyone except sender
      broadcastToAll({ ...data, from: fromPeerId }, fromPeerId);
    } else if (data.type === 'room-message') {
      // Host received a message from a guest
      const messageWithSender = { ...data, from: fromPeerId, isSent: false };
      setMessages((prev) => [...prev, messageWithSender]);
      setRemoteTypingTexts((prev) => {
        const next = { ...prev };
        delete next[fromPeerId];
        return next;
      });
      // Relay to all other peers
      broadcastToAll({ ...data, from: fromPeerId }, fromPeerId);
    } else if (data.type === 'room-members') {
      // Guest receiving member list from host
      setMembers(data.members);
    } else if (data.type === 'room-broadcast') {
      // Guest receiving relayed message from host
      setMessages((prev) => [...prev, { ...data, isSent: false }]);
      setRemoteTypingTexts((prev) => {
        const next = { ...prev };
        delete next[data.from];
        return next;
      });
    } else if (data.type === 'room-typing-relay') {
      setRemoteTypingTexts((prev) => ({
        ...prev,
        [data.from]: data.content,
      }));
    } else if (data.type === 'room-destroyed') {
      // Host destroyed the room
      cleanupRoom();
    }
  };

  const broadcastToAll = (data, excludePeerId) => {
    connections.current.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        // Re-tag message type for guests
        if (data.type === 'room-message') {
          conn.send({ ...data, type: 'room-broadcast' });
        } else if (data.type === 'typing') {
          conn.send({ type: 'room-typing-relay', from: data.from, content: data.content });
        } else {
          conn.send(data);
        }
      }
    });
  };

  const createRoom = useCallback(() => {
    if (!peerInstance.current) return;
    setIsHost(true);
    setIsInRoom(true);
    setRoomId(peerId);
    setMembers([]);
  }, [peerId]);

  const joinRoom = useCallback((hostPeerId) => {
    if (!peerInstance.current || !hostPeerId) return;

    const conn = peerInstance.current.connect(hostPeerId);

    conn.on('open', () => {
      hostConnection.current = conn;
      setIsHost(false);
      setIsInRoom(true);
      setRoomId(hostPeerId);

      conn.on('data', (data) => {
        handleRoomData(data, hostPeerId);
      });

      conn.on('close', () => {
        // Host disconnected - room destroyed
        cleanupRoom();
      });
    });

    conn.on('error', (err) => {
      console.error('Failed to join room:', err);
    });
  }, []);

  const sendRoomMessage = useCallback((messageData) => {
    const taggedMessage = {
      ...messageData,
      type: 'room-message',
      from: peerId,
    };

    if (isHost) {
      // Host sends to all connected peers
      setMessages((prev) => [...prev, { ...taggedMessage, isSent: true }]);
      connections.current.forEach((conn) => {
        if (conn.open) {
          conn.send({ ...taggedMessage, type: 'room-broadcast' });
        }
      });
    } else if (hostConnection.current?.open) {
      // Guest sends to host (host will relay)
      setMessages((prev) => [...prev, { ...taggedMessage, isSent: true }]);
      hostConnection.current.send(taggedMessage);
    }
  }, [isHost, peerId]);

  const sendRoomTypingUpdate = useCallback((text) => {
    const typingData = { type: 'typing', content: text, from: peerId };

    if (isHost) {
      // Broadcast typing to all peers
      connections.current.forEach((conn) => {
        if (conn.open) {
          conn.send({ type: 'room-typing-relay', from: peerId, content: text });
        }
      });
    } else if (hostConnection.current?.open) {
      hostConnection.current.send(typingData);
    }
  }, [isHost, peerId]);

  const leaveRoom = useCallback(() => {
    if (isHost) {
      // Notify all peers that room is destroyed
      connections.current.forEach((conn) => {
        if (conn.open) {
          conn.send({ type: 'room-destroyed' });
          conn.close();
        }
      });
    } else if (hostConnection.current?.open) {
      hostConnection.current.close();
    }
    cleanupRoom();
  }, [isHost]);

  const cleanupRoom = () => {
    connections.current.clear();
    hostConnection.current = null;
    setIsInRoom(false);
    setIsHost(false);
    setRoomId('');
    setMessages([]);
    setMembers([]);
    setRemoteTypingTexts({});
  };

  return {
    peerId,
    roomId,
    isHost,
    isInRoom,
    messages,
    members,
    remoteTypingTexts,
    createRoom,
    joinRoom,
    sendRoomMessage,
    sendRoomTypingUpdate,
    leaveRoom,
    peerInstance: peerInstance.current, // Expose peerInstance for voice calls
  };
};

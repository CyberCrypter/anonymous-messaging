import React from 'react';
import { usePeerConnection } from './hooks/usePeerConnection';
import { usePeerRoom } from './hooks/usePeerRoom';
import ConnectionScreen from './components/ConnectionScreen';
import ChatInterface from './components/ChatInterface';
import RoomChatInterface from './components/RoomChatInterface';
import './App.css';

function App() {
  const {
    peerId,
    remotePeerId,
    isConnected,
    messages,
    remoteTypingText,
    connectToPeer,
    sendMessage,
    sendTypingUpdate,
    disconnect,
    peerInstance,
  } = usePeerConnection();

  const {
    peerId: roomPeerId,
    roomId,
    isHost,
    isInRoom,
    messages: roomMessages,
    members,
    remoteTypingTexts,
    createRoom,
    joinRoom,
    sendRoomMessage,
    sendRoomTypingUpdate,
    leaveRoom,
    peerInstance: roomPeerInstance,
  } = usePeerRoom();

  const activePeerId = peerId || roomPeerId;

  return (
    <div className="app">
      {isInRoom ? (
        <RoomChatInterface
          peerId={roomPeerId}
          roomId={roomId}
          isHost={isHost}
          messages={roomMessages}
          members={members}
          remoteTypingTexts={remoteTypingTexts}
          onSendMessage={sendRoomMessage}
          onTypingUpdate={sendRoomTypingUpdate}
          onLeaveRoom={leaveRoom}
          peerInstance={roomPeerInstance}
        />
      ) : !isConnected ? (
        <ConnectionScreen
          peerId={activePeerId}
          onConnect={connectToPeer}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      ) : (
        <ChatInterface
          remotePeerId={remotePeerId}
          messages={messages}
          remoteTypingText={remoteTypingText}
          onSendMessage={sendMessage}
          onTypingUpdate={sendTypingUpdate}
          onDisconnect={disconnect}
          peerInstance={peerInstance}
        />
      )}
    </div>
  );
}

export default App;

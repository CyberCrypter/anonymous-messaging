import React from 'react';
import { usePeerConnection } from './hooks/usePeerConnection';
import ConnectionScreen from './components/ConnectionScreen';
import ChatInterface from './components/ChatInterface';
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
  } = usePeerConnection();

  return (
    <div className="app">
      {!isConnected ? (
        <ConnectionScreen peerId={peerId} onConnect={connectToPeer} />
      ) : (
        <ChatInterface
          remotePeerId={remotePeerId}
          messages={messages}
          remoteTypingText={remoteTypingText}
          onSendMessage={sendMessage}
          onTypingUpdate={sendTypingUpdate}
          onDisconnect={disconnect}
        />
      )}
    </div>
  );
}

export default App;

# SecureChat P2P

A real-time, peer-to-peer chat application built with React and PeerJS. No server stores your messages — all communication happens directly between browsers using WebRTC.

## Features

- **1-on-1 Chat** — Connect directly to another peer using their Peer ID and exchange messages in real time.
- **Group Rooms** — Create or join a room to chat with multiple people simultaneously. The room host manages membership and relays messages.
- **Voice Calls** — Make and receive audio calls within a 1-on-1 chat session, with mute/unmute support and a live call duration timer.
- **Typing Indicators** — See when the other person is typing, in both 1-on-1 and room chats.
- **Serverless** — All data is transmitted directly peer-to-peer via WebRTC. No backend, no message storage.
- **Copy Peer ID** — One-click copy of your Peer ID to share with others.

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI framework |
| [PeerJS](https://peerjs.com/) | WebRTC peer-to-peer abstraction |
| [Vite](https://vitejs.dev/) | Build tool and dev server |

## Project Structure

```
src/
├── App.jsx                    # Root component, manages active view
├── components/
│   ├── ConnectionScreen.jsx   # Landing screen: enter Peer ID, create/join room
│   ├── ChatInterface.jsx      # 1-on-1 chat view
│   ├── RoomChatInterface.jsx  # Group room chat view
│   ├── Message.jsx            # Individual message bubble
│   └── VoiceCallInterface.jsx # Voice call overlay (calling/receiving/connected)
└── hooks/
    ├── usePeerConnection.js   # Logic for 1-on-1 peer connections
    ├── usePeerRoom.js         # Logic for multi-peer room sessions
    └── useVoiceCall.js        # Logic for WebRTC audio calls
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/chat-web-app.git
cd chat-web-app

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

To test the chat, open the app in two separate browser tabs (or on two different devices). Copy the Peer ID from one tab and paste it into the other to connect.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder and can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

### Preview Production Build

```bash
npm run preview
```

## Usage

### 1-on-1 Chat
1. Open the app — your **Peer ID** is generated automatically.
2. Share your Peer ID with the person you want to chat with.
3. Enter their Peer ID and click **Connect**.
4. Start chatting. You can also start a **voice call** from within the chat.

### Group Room
1. One person clicks **Create Room** — they become the host. Share the displayed Room ID.
2. Others enter the Room ID and click **Join Room**.
3. All members can send messages to everyone in the room.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## How It Works

PeerJS wraps the browser's WebRTC API. When two peers connect:
- A **data channel** is opened for chat messages and typing events.
- For voice calls, a **media stream** is negotiated directly between peers.
- In rooms, the **host acts as a relay hub** — guests connect to the host, and the host broadcasts messages to all other members.

PeerJS uses a public signalling server only to exchange the initial connection metadata (ICE candidates). After that, all traffic is direct peer-to-peer.

## License

MIT

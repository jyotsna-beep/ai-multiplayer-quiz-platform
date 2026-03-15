import { Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import CreateRoom from "./pages/CreateRoom"
import JoinRoom from "./pages/JoinRoom"
import Lobby from "./pages/Lobby"
import PlayerLobby from "./pages/PlayerLobby"
import Quiz from "./pages/Quiz"
import Winner from "./pages/Winner"
import Profile from "./pages/Profile"

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/create-room" element={<CreateRoom />} />

      <Route path="/join-room" element={<JoinRoom />} />

      <Route path="/lobby/:roomCode" element={<Lobby />} />

      <Route path="/player-lobby/:roomCode" element={<PlayerLobby />} />

      <Route path="/quiz/:roomCode" element={<Quiz />} />

      <Route path="/winner" element={<Winner />} />
      <Route path="/profile" element={<Profile />} />

    </Routes>
  )
}

export default App
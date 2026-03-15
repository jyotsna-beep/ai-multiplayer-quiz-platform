import { Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import CreateRoom from "./pages/CreateRoom"
import JoinRoom from "./pages/JoinRoom"
import Lobby from "./pages/Lobby"
import Quiz from "./pages/Quiz"
import Result from "./pages/Result"

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/create-room" element={<CreateRoom />} />

      <Route path="/join-room" element={<JoinRoom />} />

      <Route path="/lobby" element={<Lobby />} />

      <Route path="/quiz" element={<Quiz />} />

      <Route path="/result" element={<Result />} />

    </Routes>
  )
}

export default App
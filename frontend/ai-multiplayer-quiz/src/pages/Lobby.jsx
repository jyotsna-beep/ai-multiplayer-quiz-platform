import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"

export default function Lobby() {

  const { roomCode } = useParams()
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const [isHost, setIsHost] = useState(false)

  const wsRef = useRef(null)

  useEffect(() => {

    const token = localStorage.getItem("token")
    const user = JSON.parse(localStorage.getItem("user"))

    if (!token || !user) {
      navigate("/")
      return
    }

    // ✅ WebSocket with JWT
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws"
    const ws = new WebSocket(
      `${wsProtocol}://127.0.0.1:8000/ws/${roomCode}?token=${token}`
    )

    wsRef.current = ws

    ws.onopen = () => {
      setConnectionError(null)
    }

    ws.onerror = () => {
      setConnectionError("WebSocket connection failed")
    }

    ws.onclose = () => {
      setConnectionError((prev) => prev || "Connection closed")
    }

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data)

      // 👥 Players update
      if (data.type === "players") {
        setPlayers(data.players)

        // ✅ Check host
        if (data.players[0] === user.name) {
          setIsHost(true)
        }
      }

      // 🚀 New quiz start → first question arrives
      if (data.type === "question") {
        navigate(`/quiz/${roomCode}`)
      }

    }

    return () => ws.close()

  }, [roomCode])

  const startQuiz = () => {

    const ws = wsRef.current

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert("Connection not ready")
      return
    }

    ws.send(JSON.stringify({
      event: "start_quiz"
    }))
  }

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <Navbar />

      <div className="flex flex-col items-center mt-16 px-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow-card w-[500px] text-center mb-10"
        >
          <p className="text-gray-500 mb-2">Room Code</p>

          <h1 className="text-4xl font-bold tracking-widest text-[#C1121F]">
            {roomCode}
          </h1>
        </motion.div>

        {/* Players */}
        <div className="grid grid-cols-3 gap-6 max-w-[700px]">

          {players.map((player, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-4 text-center"
            >
              <div className="text-4xl mb-2">🧑</div>
              <p className="font-semibold">{player}</p>
            </motion.div>
          ))}

        </div>

        {connectionError && (
          <div className="mt-6 p-4 bg-red-50 border text-red-700 rounded-lg">
            {connectionError}
          </div>
        )}

        {/* Host Controls */}
        {isHost ? (
          <button
            onClick={startQuiz}
            className="mt-12 bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-14 py-3 rounded-xl text-lg font-semibold"
          >
            Start Quiz
          </button>
        ) : (
          <p className="mt-12 text-gray-600 text-lg">
            Waiting for host to start...
          </p>
        )}

      </div>

    </div>
  )
}
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

    const token = sessionStorage.getItem("token")
    const user = JSON.parse(sessionStorage.getItem("user"))

    if (!token || !user) {
      navigate("/")
      return
    }

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
      setConnectionError(prev => prev || "Connection closed")
    }

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data)

      // 👥 Players update + Host detection (FIXED)
      if (data.type === "players") {

        setPlayers(data.players)

        if (data.host === user.name) {
          setIsHost(true)
        } else {
          setIsHost(false)
        }
      }

      // 🚀 Quiz start
      if (data.type === "question") {
        navigate(`/quiz/${roomCode}`)
      }

    }

    return () => {
      ws.close()
    }

  }, [roomCode, navigate])

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

        {/* Room Code */}
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
              className="bg-white rounded-xl shadow-lg p-4 text-center relative"
            >

              <div className="text-4xl mb-2">🧑</div>

              <p className="font-semibold">{player}</p>

              {/* 👑 Host badge */}
              {isHost && player === JSON.parse(sessionStorage.getItem("user"))?.name && (
                <span className="absolute top-2 right-2 text-xs bg-yellow-400 px-2 py-1 rounded">
                  HOST
                </span>
              )}

            </motion.div>

          ))}

        </div>

        {/* Error */}
        {connectionError && (
          <div className="mt-6 p-4 bg-red-50 border text-red-700 rounded-lg">
            {connectionError}
          </div>
        )}

        {/* Controls */}
        {isHost ? (
          <button
            onClick={startQuiz}
            disabled={players.length < 1}
            className="mt-12 bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-14 py-3 rounded-xl text-lg font-semibold hover:opacity-90"
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
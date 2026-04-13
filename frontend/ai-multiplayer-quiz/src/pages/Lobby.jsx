import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { Wifi, WifiOff, AlertCircle, Copy, Check } from "lucide-react"

export default function Lobby() {

  const { roomCode } = useParams()
  const navigate = useNavigate()

  const [players, setPlayers] = useState([])
  const [connectionError, setConnectionError] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    const user = JSON.parse(sessionStorage.getItem("user"))

    if (!token || !user) {
      navigate("/")
      return
    }

    connectWebSocket(token)

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [roomCode])

  const connectWebSocket = (token) => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
      const ws = new WebSocket(`${wsUrl}/ws/${roomCode}?token=${token}`)

      ws.onopen = () => {
        console.log("✅ Connected to lobby")
        setConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setConnected(false)
        setConnectionError("Connection error - retrying...")
      }

      ws.onclose = () => {
        setConnected(false)
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          setConnectionError(`Disconnected. Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`)
          setTimeout(() => {
            connectWebSocket(token)
          }, 2000)
        } else {
          setConnectionError("Unable to maintain connection. Please refresh the page.")
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "players") {
            setPlayers(data.players)
            
            const user = JSON.parse(sessionStorage.getItem("user"))
            if (data.host === user.name) {
              setIsHost(true)
            } else {
              setIsHost(false)
            }
          }

          if (data.type === "question") {
            navigate(`/quiz/${roomCode}`)
          }
        } catch (err) {
          console.error("Message parsing error:", err)
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error("WebSocket connection error:", err)
      setConnectionError("Failed to connect to server")
    }
  }

  const startQuiz = () => {
    const ws = wsRef.current

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setConnectionError("Connection not ready. Please wait...")
      return
    }

    if (players.length < 1) {
      setConnectionError("Need at least 1 player to start")
      return
    }

    ws.send(JSON.stringify({
      event: "start_quiz"
    }))
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      <Background />
      <Navbar />

      {/* Connection Status Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50"
      >
        <div className={`flex items-center justify-center gap-2 py-3 px-4 ${
          connected
            ? "bg-gradient-to-r from-green-500 to-emerald-500"
            : "bg-gradient-to-r from-yellow-500 to-orange-500"
        }`}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {connected ? (
              <Wifi size={18} className="text-white" />
            ) : (
              <WifiOff size={18} className="text-white" />
            )}
          </motion.div>
          <span className="text-white font-semibold text-sm">
            {connected ? `Connected • ${players.length} player${players.length !== 1 ? 's' : ''} in room` : "Connecting..."}
          </span>
        </div>
      </motion.div>

      <div className="flex flex-col items-center mt-16 px-6 pb-12">

        {/* Room Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-8 w-full max-w-[600px] mb-12"
        >
          <p className="text-gray-600 text-center text-sm font-medium mb-4">ROOM CODE</p>

          <div className="flex items-center justify-center gap-4">
            <h1 className="text-5xl font-black tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {roomCode}
            </h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={copyRoomCode}
              className="p-3 rounded-lg bg-blue-100 hover:bg-blue-200 transition"
            >
              {copied ? (
                <Check size={20} className="text-green-600" />
              ) : (
                <Copy size={20} className="text-blue-600" />
              )}
            </motion.button>
          </div>

          <p className="text-gray-500 text-center text-sm mt-4">
            Share this code with friends to join the quiz
          </p>
        </motion.div>

        {/* Players Section */}
        <div className="w-full max-w-[700px] mb-12">
          <p className="text-gray-700 font-bold text-lg mb-6">Players ({players.length})</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player, index) => {
              const currentUser = JSON.parse(sessionStorage.getItem("user"))
              const playerIsHost = isHost && player === currentUser?.name

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    relative rounded-xl p-6 text-center
                    transition-all duration-300
                    ${playerIsHost
                      ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-lg"
                      : "bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md hover:shadow-lg"
                    }
                  `}
                >
                  <div className="text-5xl mb-3">🧑</div>
                  <p className="font-bold text-gray-800">{player}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {playerIsHost ? "Host" : "Player"}
                  </p>

                  {playerIsHost && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-black shadow-lg"
                    >
                      👑
                    </motion.div>
                  )}
                </motion.div>
              )
            })}

            {/* Add more players placeholder */}
            {players.length < 4 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: players.length * 0.1 }}
                className="relative rounded-xl p-6 text-center border-2 border-dashed border-gray-300 bg-gray-50"
              >
                <div className="text-5xl mb-3">+</div>
                <p className="font-bold text-gray-600">Waiting...</p>
                <p className="text-xs text-gray-500 mt-1">for players</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {connectionError && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-full max-w-[700px] mb-8"
          >
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md flex gap-3 items-start">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 font-semibold text-sm">{connectionError}</p>
            </div>
          </motion.div>
        )}

        {/* Start Button or Waiting Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-[700px]"
        >
          {isHost ? (
            <motion.button
              whileHover={connected && players.length >= 1 ? { scale: 1.05, y: -4 } : {}}
              whileTap={connected && players.length >= 1 ? { scale: 0.95 } : {}}
              onClick={startQuiz}
              disabled={!connected || players.length < 1}
              className={`
                w-full py-4 rounded-xl text-lg font-bold transition-all
                flex items-center justify-center gap-3

                ${connected && players.length >= 1
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <span className="text-2xl">🚀</span>
              Start Quiz
            </motion.button>
          ) : (
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 text-center"
            >
              <p className="text-gray-700 font-semibold">Waiting for host to start...</p>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="inline-block mt-4"
              >
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full"></div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
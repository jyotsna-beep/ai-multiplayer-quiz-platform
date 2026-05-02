import { motion } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { Wifi, WifiOff, AlertCircle, Copy, Check, Users, Shield } from "lucide-react"
import Layout from "../components/Layout"

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
      if (wsRef.current) wsRef.current.close()
    }
  }, [roomCode, navigate])

  const connectWebSocket = (token) => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
      const ws = new WebSocket(`${wsUrl}/ws/${roomCode}?token=${token}`)

      ws.onopen = () => {
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
          setTimeout(() => connectWebSocket(token), 2000)
        } else {
          setConnectionError("Unable to maintain connection. Please refresh.")
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "players") {
            setPlayers(data.players)
            const user = JSON.parse(sessionStorage.getItem("user"))
            setIsHost(data.host === user.name)
          }
          if (data.type === "question") navigate(`/quiz/${roomCode}`)
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ event: "start_quiz" }))
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header Status */}
        <div className={`mb-8 p-4 rounded-2xl flex items-center justify-between transition-colors ${connected ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
            <span className={`font-bold ${connected ? 'text-green-700' : 'text-orange-700'}`}>
              {connected ? "Connected to Server" : "Attempting Connection..."}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-500">
            {players.length} Player{players.length !== 1 ? 's' : ''} in Room
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Room Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-panel p-6 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Room Code</p>
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">{roomCode}</h1>
                <button onClick={copyRoomCode} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-400" />}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4 italic">Invite players by sharing this code.</p>
            </div>

            {isHost ? (
              <div className="card-panel p-6 bg-blue-600 text-white border-none shadow-xl shadow-blue-200">
                <Shield className="mx-auto mb-4" size={32} />
                <h3 className="text-lg font-bold mb-2">You are the Host</h3>
                <p className="text-blue-100 text-sm mb-6">Once everyone has joined, you can start the quiz for all players.</p>
                <button
                  onClick={startQuiz}
                  disabled={!connected || players.length < 1}
                  className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition disabled:opacity-50"
                >
                  Start Game
                </button>
              </div>
            ) : (
              <div className="card-panel p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900">Waiting for Host</h3>
                <p className="text-sm text-gray-500">The game will begin automatically once the host starts it.</p>
              </div>
            )}
          </div>

          {/* Right Column: Players List */}
          <div className="lg:col-span-2">
            <div className="card-panel p-6 min-h-[400px]">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Users size={20} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Players List</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {players.map((player, idx) => (
                  <motion.div
                    key={player}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xl">👤</div>
                      <span className="font-bold text-gray-800">{player}</span>
                    </div>
                    {player === players[0] && <span className="badge badge-runner-up">Host</span>}
                  </motion.div>
                ))}
                {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="p-4 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 font-medium italic">
                    Waiting for player...
                  </div>
                ))}
              </div>

              {connectionError && (
                <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{connectionError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Background from "../components/Background"
import QuizNavbar from "../components/QuizNavbar"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, Wifi, WifiOff, RotateCcw } from "lucide-react"

export default function Quiz() {

  const { roomCode } = useParams()
  const navigate = useNavigate()

  const wsRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const [question, setQuestion] = useState(null)
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(10)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [currentQuestionNum, setCurrentQuestionNum] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)

  // Initialize quiz session
  useEffect(() => {
    let token = sessionStorage.getItem("token")
    const user = sessionStorage.getItem("user")

    // 🔄 If sessionStorage was cleared but localStorage has token, restore it
    if (!token && !user) {
      const savedToken = localStorage.getItem("token")
      if (savedToken) {
        sessionStorage.setItem("token", savedToken)
        token = savedToken
      }
    }

    if (!token || !user) {
      navigate("/")
      return
    }

    connectWebSocket(token)

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      clearInterval(timerRef.current)
    }
  }, [roomCode])

  const connectWebSocket = (token) => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
      const ws = new WebSocket(
        `${wsUrl}/ws/${roomCode}?token=${token}`
      )

      ws.onopen = () => {
        console.log("✅ WebSocket connected")
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (err) {
          console.error("Error parsing message:", err)
        }
      }

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
        setConnected(false)
        setError("Connection error. Attempting to reconnect...")
      }

      ws.onclose = () => {
        console.log("⚠️ WebSocket closed")
        setConnected(false)
        
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          setTimeout(() => {
            console.log(`Reconnecting... (Attempt ${reconnectAttempts.current})`)
            connectWebSocket(token)
          }, 2000)
        } else {
          setError("Connection lost. Unable to reconnect. Please rejoin the room.")
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error("WebSocket connection failed:", err)
      setError("Failed to connect to quiz server")
    }
  }

  const handleMessage = (data) => {
    // 🧠 NEW QUESTION
    if (data.type === "question") {
      setQuestion(data.question)
      setSelected(null)
      setAnswered(false)
      setCurrentQuestionNum(data.question_number)
      setTotalQuestions(data.total_questions)

      const t = data.timer || 10
      setTotalTime(t)
      setTimeLeft(t)
      startTimeRef.current = Date.now()

      // Start countdown timer
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    // 🏆 LEADERBOARD UPDATE
    if (data.type === "leaderboard") {
      setPlayers(data.scores || [])
    }

    // 🎉 GAME OVER
    if (data.type === "game_over") {
      clearInterval(timerRef.current)
      setTimeout(() => {
        navigate("/winner", {
          state: { leaderboard: data.scores }
        })
      }, 500)
    }

    // 👥 PLAYERS UPDATE
    if (data.type === "players") {
      console.log("Players in room:", data.players)
    }
  }

  const sendAnswer = (option) => {
    if (!connected) {
      setError("Not connected to server. Please wait for reconnection.")
      return
    }

    if (selected || timeLeft === 0 || answered) return

    setSelected(option)
    setAnswered(true)

    const timeTaken = (Date.now() - startTimeRef.current) / 1000

    try {
      wsRef.current.send(JSON.stringify({
        event: "answer",
        answer: option,
        time_taken: timeTaken
      }))
    } catch (err) {
      console.error("Failed to send answer:", err)
      setError("Failed to submit answer. Retrying...")
    }
  }

  const handleReconnect = () => {
    let token = sessionStorage.getItem("token")
    
    // 🔄 Try localStorage if sessionStorage doesn't have it
    if (!token) {
      token = localStorage.getItem("token")
      if (token) {
        sessionStorage.setItem("token", token)
      }
    }
    
    if (token) {
      reconnectAttempts.current = 0
      connectWebSocket(token)
    }
  }

  const colors = [
    "bg-blue-500 hover:bg-blue-600",
    "bg-purple-500 hover:bg-purple-600",
    "bg-green-500 hover:bg-green-600",
    "bg-orange-500 hover:bg-orange-600"
  ]

  const icons = ["A", "B", "C", "D"]

  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0
  const isUrgent = timeLeft <= 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">
      <Background />
      <QuizNavbar />

      {/* Connection Status Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50"
      >
        <div className={`flex items-center justify-center gap-2 py-3 px-4 ${
          connected 
            ? "bg-gradient-to-r from-green-500 to-emerald-500" 
            : "bg-gradient-to-r from-red-500 to-orange-500"
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
            {connected ? "Connected" : `Disconnected - Reconnecting...`}
          </span>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ x: -400 }}
          animate={{ x: 0 }}
          className="fixed top-20 left-6 z-50 max-w-md"
        >
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg flex gap-4 items-start">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-semibold text-sm">{error}</p>
              {!connected && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReconnect}
                  className="mt-2 text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Retry Now
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center mt-8 px-6 pb-6">
        <div className="flex gap-8 w-full max-w-7xl">

          {/* MAIN QUIZ AREA */}
          <div className="flex-1">

            {/* Question Progress */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Question {currentQuestionNum} of {totalQuestions}</p>
                <div className="w-64 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <motion.div
                    layoutId="progress"
                    initial={{ width: 0 }}
                    animate={{ width: currentQuestionNum > 0 ? `${(currentQuestionNum / totalQuestions) * 100}%` : 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
              </div>
              <div className="text-right">
                <span className={`text-4xl font-bold ${isUrgent ? "text-red-500" : "text-blue-600"}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestionNum}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-blue-100"
            >
              <h2 className="text-2xl font-bold text-gray-800 text-center leading-relaxed">
                {question?.question || "Loading question..."}
              </h2>
            </motion.div>

            {/* Timer Bar */}
            <div className="w-full h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full mb-8 overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
                className={`h-full transition-all ${
                  isUrgent
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-blue-500 to-purple-600"
                }`}
              />
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-4">
              {question?.options?.map((option, index) => {
                const isSelected = selected === option
                const isDisabled = answered || !connected || timeLeft === 0

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!isDisabled ? { scale: 1.05, y: -4 } : {}}
                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                    onClick={() => sendAnswer(option)}
                    disabled={isDisabled}
                    className={`
                      relative overflow-hidden
                      p-6 rounded-xl
                      text-lg font-bold
                      transition-all duration-300
                      flex items-center gap-4
                      shadow-md hover:shadow-xl
                      
                      ${colors[index]}
                      ${isSelected ? "ring-4 ring-offset-2 ring-yellow-400 scale-105" : ""}
                      ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                      ${!connected ? "opacity-40" : ""}
                    `}
                  >
                    <span className="text-2xl font-black bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center">
                      {icons[index]}
                    </span>
                    <span className="text-white flex-1 text-left">{option}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl">✓</motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

          </div>

          {/* LEADERBOARD SIDEBAR */}
          <div className="w-80">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100 sticky top-24">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Leaderboard
              </h2>

              <div className="space-y-3">
                {players.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Waiting for scores...</p>
                ) : (
                  players.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        p-4 rounded-xl transition-all
                        ${index === 0 
                          ? "bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 shadow-lg" 
                          : index === 1
                          ? "bg-gradient-to-r from-gray-100 to-slate-100 border-2 border-gray-400"
                          : index === 2
                          ? "bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300"
                          : "bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`text-2xl font-black w-10 h-10 flex items-center justify-center rounded-lg
                              ${index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-gray-300"}
                              text-white
                            `}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </motion.span>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{player.name}</p>
                            <p className="text-xs text-gray-600">Player</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.p
                            key={player.score}
                            initial={{ scale: 1.2, color: "#fbbf24" }}
                            animate={{ scale: 1, color: "#000000" }}
                            className="text-2xl font-black"
                          >
                            {player.score}
                          </motion.p>
                          <p className="text-xs text-gray-600">points</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
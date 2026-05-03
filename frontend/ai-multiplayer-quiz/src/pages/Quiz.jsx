import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { 
  AlertCircle, Wifi, WifiOff, RotateCcw, Timer, Users, 
  Trophy, CheckCircle2, XCircle, LogOut, Copy, ArrowRight
} from "lucide-react"
import "../Dashboard.css"

export default function Quiz() {
  const { roomCode } = useParams()
  const navigate = useNavigate()

  const wsRef = useRef(null)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const [question, setQuestion] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(10)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const [currentQuestionNum, setCurrentQuestionNum] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showExitModal, setShowExitModal] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    const userStr = sessionStorage.getItem("user")
    if (!token || !userStr) {
      navigate("/")
      return
    }

    connectWebSocket(token)

    return () => {
      if (wsRef.current) wsRef.current.close()
      clearInterval(timerRef.current)
    }
  }, [roomCode])

  const connectWebSocket = (token) => {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000"
      const ws = new WebSocket(`${wsUrl}/ws/${roomCode}?token=${token}`)

      ws.onopen = () => {
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

      ws.onerror = () => {
        setConnected(false)
        setError("Connection error. Attempting to reconnect...")
      }

      ws.onclose = () => {
        setConnected(false)
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++
          setTimeout(() => connectWebSocket(token), 2000)
        } else {
          setError("Connection lost. Please refresh or rejoin.")
        }
      }

      wsRef.current = ws
    } catch (err) {
      setError("Failed to connect to quiz server")
    }
  }

  useEffect(() => {
    if (timeLeft === 0 && selected && !isLocked) {
      lockInAnswer()
    }
  }, [timeLeft, selected, isLocked])

  const handleMessage = (data) => {
    console.log("[WS RECEIVED]", data.type, data)
    
    if (data.type === "error") {
      setError(data.message)
      return
    }

    if (data.type === "question") {
      setQuestion(data.question)
      setSelected(null)
      setIsLocked(false)
      setCurrentQuestionNum(data.question_number)
      setTotalQuestions(data.total_questions)

      const t = data.timer || 10
      setTotalTime(t)
      setTimeLeft(t)
      startTimeRef.current = Date.now()

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

    if (data.type === "leaderboard") {
      console.log("Leaderboard Sync:", data.scores)
      setLeaderboard(data.scores || [])
    }

    if (data.type === "players") {
      setAllPlayers(data.players || [])
    }

    if (data.type === "game_over") {
      clearInterval(timerRef.current)
      setTimeout(() => {
        navigate("/winner", { state: { leaderboard: data.scores } })
      }, 1000)
    }
  }

  const lockInAnswer = () => {
    if (!connected || !selected || timeLeft === 0 || isLocked) return

    setIsLocked(true)
    const timeTaken = (Date.now() - startTimeRef.current) / 1000
    
    try {
      wsRef.current.send(JSON.stringify({
        event: "answer",
        answer: selected,
        time_taken: timeTaken
      }))
    } catch (err) {
      setError("Failed to submit answer.")
      setIsLocked(false)
    }
  }

  const selectOption = (option) => {
    if (isLocked || timeLeft === 0) return
    setSelected(option)
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert("Room code copied!")
  }

  const progressPercentage = (timeLeft / totalTime) * 100
  const isUrgent = timeLeft <= 3

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowExitModal(true)}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Trophy size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">QuizAI</span>
            </div>
            <div className="h-6 w-[1px] bg-gray-200" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Room Code</span>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="font-mono font-bold text-blue-600 tracking-widest">{roomCode}</span>
                <button onClick={copyRoomCode} className="text-gray-400 hover:text-blue-600 transition">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                {connected ? "Live Connection" : "Disconnected"}
              </span>
            </div>
            <button 
              onClick={() => setShowExitModal(true)}
              className="btn-action btn-secondary text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Exit Quiz
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Players */}
          <div className="lg:col-span-2 hidden lg:block">
            <div className="card-panel h-fit sticky top-32 p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users size={14} />
                Players ({allPlayers.length})
              </h3>
              <div className="space-y-3">
                {allPlayers.map((player) => (
                  <div key={player} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {player[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-gray-700 truncate">{player}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Quiz Logic */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Question Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Question {currentQuestionNum}</h2>
                  <p className="text-gray-500 font-medium">Out of {totalQuestions} total questions</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className={`p-3 rounded-xl ${isUrgent ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                    <Timer size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Time Remaining</p>
                    <p className={`text-2xl font-black ${isUrgent ? "text-red-600" : "text-gray-900"}`}>
                      {timeLeft} <span className="text-sm text-gray-400">sec</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  className={`h-full ${isUrgent ? "bg-red-500" : "bg-blue-600"}`}
                />
              </div>

              {/* Question Card */}
              <div className="card-panel p-10 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Trophy size={120} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 text-center leading-tight relative z-10">
                  {question?.question || "Preparing the next challenge..."}
                </h1>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question?.options?.map((option, idx) => {
                  const isSelected = selected === option
                  const isDisabled = isLocked || timeLeft === 0 || !connected
                  const colors = [
                    "border-blue-200 hover:bg-blue-50",
                    "border-purple-200 hover:bg-purple-50",
                    "border-emerald-200 hover:bg-emerald-50",
                    "border-amber-200 hover:bg-amber-50"
                  ]

                  return (
                    <motion.button
                      key={idx}
                      whileHover={!isDisabled ? { y: -2 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      onClick={() => selectOption(option)}
                      disabled={isDisabled}
                      className={`
                        p-6 rounded-2xl border-2 text-left transition-all relative group h-full
                        ${isSelected ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100" : colors[idx]}
                        ${isDisabled && !isSelected ? "opacity-50" : ""}
                        ${isLocked && isSelected ? "border-green-600 bg-green-50 ring-green-100" : ""}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                          ${isSelected ? (isLocked ? "bg-green-600" : "bg-blue-600") + " text-white" : "bg-white text-gray-400 border border-gray-200"}
                        `}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`text-xl font-bold ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                          {option}
                        </span>
                        {isLocked && isSelected && (
                          <CheckCircle2 size={24} className="ml-auto text-green-600" />
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Action Area */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <AnimatePresence mode="wait">
                  {selected && !isLocked && timeLeft > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onClick={lockInAnswer}
                      className="btn-action btn-primary w-full max-w-md h-16 text-xl justify-center shadow-blue-200 shadow-xl"
                    >
                      Confirm Selection
                      <ArrowRight size={24} className="ml-2" />
                    </motion.button>
                  )}

                  {isLocked && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg"
                    >
                      <CheckCircle2 size={24} />
                      Answer Locked! Waiting for round to end...
                    </motion.div>
                  )}

                  {!selected && !isLocked && timeLeft > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-400 font-bold uppercase tracking-widest text-sm"
                    >
                      Choose an option to continue
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Leaderboard */}
          <div className="lg:col-span-3">
            <div className="card-panel sticky top-32">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" />
                  Live Standings
                </h3>
                <span className="text-xs font-bold text-gray-400">REALTIME</span>
              </div>
              <div className="p-4 space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <motion.div 
                      key={entry.name}
                      layout
                      className={`
                        p-4 rounded-xl flex items-center justify-between
                        ${idx === 0 ? "bg-yellow-50 border border-yellow-200" : "bg-white border border-gray-100 shadow-sm"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs
                          ${idx === 0 ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-500"}
                        `}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-gray-700">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900">{entry.score}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">PTS</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Trophy size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waiting for round 1</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setShowExitModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Leave Quiz?</h3>
            <p className="text-gray-500 text-center mb-8">You'll lose your current score and progress in this session.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowExitModal(false)}
                className="btn-action btn-secondary flex-1 justify-center"
              >
                Cancel
              </button>
              <button 
                onClick={() => navigate("/dashboard")}
                className="btn-action btn-primary bg-red-600 hover:bg-red-700 flex-1 justify-center"
              >
                Yes, Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md"
          >
            <AlertCircle size={24} />
            <div className="flex-1">
              <p className="font-bold">Connection Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <RotateCcw size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Trash2, History, CheckCircle } from "lucide-react"

function formatDate(value) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default function QuizHistory() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingHistory, setDeletingHistory] = useState(null)

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }
    fetchHistory(token)
  }, [navigate])

  const fetchHistory = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/quiz-history?token=${token}`)
      const data = await response.json()
      if (response.ok) setHistory(data)
    } catch (error) {
      console.error("Failed to load quiz history:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteHistoryEntry = async (roomCode) => {
    if (!window.confirm("Delete this history entry from your account?")) {
      return
    }

    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }

    setDeletingHistory(roomCode)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/quiz-history/${roomCode}?token=${token}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setHistory((prev) => prev.filter((game) => game.room_code !== roomCode))
      }
    } catch (error) {
      console.error("Failed to delete history entry:", error)
    } finally {
      setDeletingHistory(null)
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="welcome-title">Quiz History</h1>
        <p className="welcome-subtitle">Your past performance and generated questions.</p>
      </div>

      <div className="space-y-6">
        {history.map((game) => (
          <div key={`${game.room_code}-${game.created_at}`} className="card-panel">
            <div className="card-header">
              <div>
                <h3 className="card-title">Room {game.room_code}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(game.created_at)} • {game.total_questions} questions • {game.difficulty || "medium"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Winner: <span className="text-blue-600">{game.leaderboard?.[0] ? `${game.leaderboard[0].name} (${game.leaderboard[0].score})` : "N/A"}</span>
                </span>
                <button
                  onClick={() => deleteHistoryEntry(game.room_code)}
                  disabled={deletingHistory === game.room_code}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Questions Review */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                      Questions Review
                    </h4>
                    <span className="badge badge-runner-up bg-blue-50 text-blue-600 border-blue-100">
                      {game.questions?.length || 0} Total
                    </span>
                  </div>

                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {(game.questions || []).map((q, idx) => (
                      <div key={idx} className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:border-blue-100 transition shadow-sm">
                        <div className="flex items-start gap-4 mb-4">
                          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-lg font-bold text-gray-800 leading-snug">{q.question}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                          {q.options?.map((opt, optIdx) => {
                            const isCorrect = opt === q.answer
                            return (
                              <div 
                                key={optIdx}
                                className={`
                                  p-3 rounded-xl border text-sm font-medium transition
                                  ${isCorrect 
                                    ? "bg-green-50 border-green-200 text-green-700 shadow-sm" 
                                    : "bg-white border-gray-100 text-gray-500"}
                                `}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{opt}</span>
                                  {isCorrect && <CheckCircle size={14} className="text-green-600 flex-shrink-0" />}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {(!game.questions || game.questions.length === 0) && (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm font-medium italic">Detailed question data not available for this session.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Standings */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                    Final Standings
                  </h4>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                    {(game.leaderboard || []).map((score, idx) => (
                      <div key={score.name} className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs
                            ${idx === 0 ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-400"}
                          `}>
                            {idx + 1}
                          </div>
                          <span className="text-sm font-bold text-gray-700">{score.name}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{score.score} <span className="text-[10px] text-gray-400">PTS</span></span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">Session Stats</p>
                    <div className="flex justify-between text-xs font-medium text-blue-700">
                      <span>Room Code</span>
                      <span className="font-mono font-black">{game.room_code}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="p-8 text-center text-gray-500">Loading history...</div>}
      {!loading && history.length === 0 && (
        <div className="card-panel p-12 text-center">
          <History size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No quiz history found yet. Host a game to get started!</p>
        </div>
      )}
    </Layout>
  )
}


function EmptyState({ message }) {
  return <div className="rounded-md border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

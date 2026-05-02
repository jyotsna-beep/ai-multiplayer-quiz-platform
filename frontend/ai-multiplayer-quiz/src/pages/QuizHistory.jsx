import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import Background from "../components/Background"
import Navbar from "../components/Navbar"

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
      const response = await fetch(`${apiUrl}/user/quiz-history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) setHistory(data.history || [])
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
      const response = await fetch(`${apiUrl}/user/quiz-history/${roomCode}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setHistory((prev) => prev.filter((game) => game.room_code !== roomCode))
      } else {
        const data = await response.json()
        alert(data.detail || data.message || "Failed to delete history entry")
      }
    } catch (error) {
      console.error("Failed to delete history entry:", error)
      alert("Failed to delete history entry")
    } finally {
      setDeletingHistory(null)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      <Background />
      <Navbar />

      <main className="px-4 pb-10 pt-24 lg:ml-64 lg:px-6">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-gray-950">Quiz history</h1>
          <p className="mt-1 text-sm text-gray-600">Completed quiz rooms with the generated questions and score history.</p>
        </div>

        <div className="space-y-4">
          {history.map((game) => (
            <section key={`${game.room_code}-${game.created_at}`} className="rounded-md border border-gray-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-950">Room {game.room_code}</h2>
                  <p className="mt-1 text-sm text-gray-600">{formatDate(game.created_at)} · {game.total_questions} questions · {game.difficulty || "difficulty not recorded"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-700">
                    Winner: <span className="font-semibold text-gray-950">{game.winner ? `${game.winner.name} (${game.winner.score})` : "Not recorded"}</span>
                  </div>
                  <button
                    onClick={() => deleteHistoryEntry(game.room_code)}
                    disabled={deletingHistory === game.room_code}
                    className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingHistory === game.room_code ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
                <div className="divide-y divide-gray-100">
                  {(game.questions || []).map((question, index) => (
                    <div key={`${game.room_code}-q-${index}`} className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-950">{index + 1}. {question.question}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(question.options || []).map((option) => (
                          <span key={option} className={`rounded border px-3 py-2 text-sm ${option === question.answer ? "border-green-200 bg-green-50 font-semibold text-green-700" : "border-gray-200 text-gray-600"}`}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!game.questions || game.questions.length === 0) && <div className="px-5 py-8 text-sm text-gray-500">No saved questions found for this room.</div>}
                </div>

                <aside className="border-t border-gray-200 p-5 lg:border-l lg:border-t-0">
                  <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Scores</h3>
                  <div className="space-y-2">
                    {(game.scores || []).map((score) => (
                      <div key={score.name} className="flex justify-between text-sm">
                        <span className="text-gray-700">{score.name}</span>
                        <span className="font-semibold text-gray-950">{score.score}</span>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          ))}
        </div>

        {!loading && history.length === 0 && <EmptyState message="No completed quiz history found yet." />}
        {loading && <EmptyState message="Loading quiz history..." />}
      </main>
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="rounded-md border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

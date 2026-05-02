import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Upload, Settings, Clock, HelpCircle, Sparkles } from "lucide-react"

export default function CreateRoom() {
  const [file, setFile] = useState(null)
  const [questions, setQuestions] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")
  const [timePerQuestion, setTimePerQuestion] = useState(10)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")
    const token = sessionStorage.getItem("token")
    if (!storedUser || !token) {
      navigate("/")
      return
    }
    setUser(JSON.parse(storedUser))
  }, [navigate])

  const handleCreateRoom = async () => {
    if (!file) {
      alert("Please upload study material first.")
      return
    }

    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const roomResponse = await fetch(`${apiUrl}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host_name: user.name })
      })

      const roomData = await roomResponse.json()
      if (!roomResponse.ok) throw new Error("Failed to create room")

      const roomCode = roomData.room_code
      const formData = new FormData()
      formData.append("file", file)
      formData.append("questions", questions)
      formData.append("difficulty", difficulty)
      formData.append("room_code", roomCode)
      formData.append("time_per_question", timePerQuestion)

      const quizResponse = await fetch(`${apiUrl}/generate-quiz`, {
        method: "POST",
        body: formData
      })

      if (!quizResponse.ok) throw new Error("Quiz generation failed")

      sessionStorage.setItem("room_code", roomCode)
      navigate(`/lobby/${roomCode}`)
    } catch (err) {
      console.error(err)
      alert(err.message || "Error generating quiz")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="welcome-title">Host a Quiz</h1>
          <p className="welcome-subtitle">Configure your session and let AI generate the questions.</p>
        </div>

        <div className="card-panel p-8">
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 transition cursor-pointer bg-gray-50/50">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.txt,.docx"
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{file ? file.name : "Upload Study Material"}</h3>
                <p className="text-sm text-gray-500 mt-1">PDF, TXT or DOCX (Max 10MB)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Question Count */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <HelpCircle size={16} /> Number of Questions
                </label>
                <input
                  type="number"
                  value={questions}
                  onChange={(e) => setQuestions(Number(e.target.value))}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  min="1" max="50"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Settings size={16} /> Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Timer */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock size={16} /> Time Per Question (sec)
                </label>
                <input
                  type="number"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
                  min="5" max="60"
                />
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.[0]}
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Hosting As</p>
                  <p className="font-bold text-gray-900">{user?.name}</p>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleCreateRoom}
              className={`btn-action btn-primary w-full justify-center py-4 text-lg shadow-xl shadow-blue-200 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Quiz...</span>
                </div>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Quiz with AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { KeyRound, Users } from "lucide-react"

export default function JoinRoom() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef([])
  const navigate = useNavigate()
  const user = JSON.parse(sessionStorage.getItem("user"))

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!user || !token) {
      navigate("/")
    }
  }, [navigate, user])

  const handleChange = (value, index) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    if (value && index < 5) {
      inputs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1].focus()
    }
  }

  const handleJoinRoom = async () => {
    const roomCode = code.join("")
    if (roomCode.length !== 6) {
      alert("Please enter a valid 6-character room code.")
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/join-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_code: roomCode, player_name: user.name })
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        alert("Room not found or game has already started.")
        return
      }

      sessionStorage.setItem("room_code", roomCode)
      navigate(`/lobby/${roomCode}`)
    } catch (err) {
      console.error(err)
      alert("Failed to join room")
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="welcome-title">Join a Game</h1>
          <p className="welcome-subtitle">Enter the 6-character room code shared by your host.</p>
        </div>

        <div className="card-panel p-10">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
              <KeyRound size={32} />
            </div>

            <div className="flex justify-center gap-3 mb-10">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputs.current[index] = el)}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-16 sm:w-16 sm:h-20 text-center text-3xl font-bold border-2 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-gray-50"
                />
              ))}
            </div>

            <div className="w-full space-y-6">
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <Users size={18} className="text-gray-400" />
                <p className="text-sm text-gray-600">Joining as <span className="font-bold text-gray-900">{user?.name}</span></p>
              </div>

              <button
                onClick={handleJoinRoom}
                className="btn-action btn-primary w-full justify-center py-4 text-lg shadow-xl shadow-blue-200"
              >
                Join Game Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
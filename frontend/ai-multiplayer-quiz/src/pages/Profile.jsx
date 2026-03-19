import Background from "../components/Background"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Profile() {

  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {

    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (!token || !storedUser) {
      navigate("/")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    // 🔥 (future backend API)
    // For now fallback dummy dynamic style
    setStats({
      quizzes: Math.floor(Math.random() * 20) + 5,
      wins: Math.floor(Math.random() * 10),
      accuracy: `${Math.floor(Math.random() * 40) + 60}%`
    })

  }, [])

  return (

    <div className="min-h-screen bg-[#FFF6F3] flex justify-center pt-20 relative">

      <Background />

      <div className="glow-card w-[600px] text-center">

        <div className="text-6xl mb-4">🧑</div>

        <h2 className="text-2xl font-bold mb-1">
          {user?.name}
        </h2>

        <p className="text-gray-500 mb-8">
          {user?.email || "User"}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">

          <div>
            <p className="text-2xl font-bold text-[#C1121F]">
              {stats?.quizzes ?? 0}
            </p>
            <p className="text-gray-500">Quizzes</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-[#C1121F]">
              {stats?.wins ?? 0}
            </p>
            <p className="text-gray-500">Wins</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-[#C1121F]">
              {stats?.accuracy ?? "0%"}
            </p>
            <p className="text-gray-500">Accuracy</p>
          </div>

        </div>

      </div>

    </div>
  )
}
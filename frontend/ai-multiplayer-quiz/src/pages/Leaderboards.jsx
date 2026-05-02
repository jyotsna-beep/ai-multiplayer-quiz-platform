import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Medal, Trophy, Users } from "lucide-react"
import Layout from "../components/Layout"
import { StatCard } from "../components/DashboardComponents"

export default function Leaderboards() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  const stats = useMemo(() => {
    const topScore = leaderboard[0]?.points || 0
    const totalPoints = leaderboard.reduce((sum, p) => sum + p.points, 0)

    return [
      { label: "Total Players", value: leaderboard.length, trend: "Active now", icon: <Users size={17} /> },
      { label: "Total Points", value: totalPoints, trend: "Community total", icon: <Trophy size={17} /> },
      { label: "Top Score", value: topScore, trend: "Record high", icon: <Medal size={17} /> },
    ]
  }, [leaderboard])

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }
    fetchLeaderboard(token)
  }, [navigate])

  const fetchLeaderboard = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/leaderboards?token=${token}`)
      const data = await response.json()
      if (response.ok) setLeaderboard(data)
    } catch (error) {
      console.error("Failed to load leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="welcome-title">Leaderboards</h1>
        <p className="welcome-subtitle">Global rankings based on performance across all quizzes.</p>
      </div>

      <div className="stats-grid mb-8">
        {stats.map((s, idx) => (
          <StatCard key={idx} label={s.label} value={s.value} trend={s.trend} trendType="neutral" />
        ))}
      </div>

      <div className="card-panel">
        <div className="card-header">
          <h3 className="card-title">Global Ranking</h3>
          <span className="badge badge-runner-up">{loading ? "Syncing..." : "Live"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="games-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Rank</th>
                <th>Player</th>
                <th>Total Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={player.name}>
                  <td>
                    <span className="badge badge-runner-up font-bold">#{index + 1}</span>
                  </td>
                  <td className="font-semibold text-gray-900">{player.name}</td>
                  <td className="font-bold text-blue-600">{player.points} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading rankings...</div>}
        {!loading && leaderboard.length === 0 && (
          <div className="p-12 text-center text-gray-500">No rankings available.</div>
        )}
      </div>
    </Layout>
  )
}


function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

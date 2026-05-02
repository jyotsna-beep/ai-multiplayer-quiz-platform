import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Plus, Code, Upload, Trophy } from "lucide-react"
import Layout from "../components/Layout"
import { StatCard, RecentGamesTable, ActivityTimeline } from "../components/DashboardComponents"
import "../Dashboard.css"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }

    fetchStats(token)
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-GB', options));
  }, [navigate])

  const fetchStats = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/stats?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Activity data (still partially mock or can be derived from recent games)
  const activities = stats?.recentGames?.map(game => ({
    color: game.score > 1000 ? "green" : "blue",
    text: `Played quiz with <strong>${game.opponents}</strong> opponents. Score: <strong>${game.score}</strong>`,
    time: game.date
  })) || []

  const formattedRecentGames = stats?.recentGames?.map((game, index) => ({
    name: "Quiz Game", // API doesn't return room name in stats, using generic
    date: game.date,
    score: game.score,
    rank: "N/A", // API doesn't return rank in stats
    status: game.score > 0 ? "Won" : "Placed" // Simplified status
  })) || []

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="welcome-section">
        <h1 className="welcome-title">Dashboard</h1>
        <p className="welcome-subtitle">{currentDate} - Welcome back, {stats?.name || "User"}</p>
      </div>

      <div className="action-buttons">
        <button className="btn-action btn-primary" onClick={() => navigate("/create-room")}>
          <Plus size={18} />
          Host a quiz
        </button>
        <button className="btn-action btn-secondary" onClick={() => navigate("/join-room")}>
          <Code size={18} />
          Join by code
        </button>
        <button className="btn-action btn-secondary" onClick={() => navigate("/pdf-library")}>
          <Upload size={18} />
          Upload PDF
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Games" value={stats?.quizzesPlayed || 0} trend="All time" trendType="neutral" />
        <StatCard label="Win Rate" value={`${stats?.winRate || 0}%`} trend="Success ratio" trendType="up" />
        <StatCard label="Avg Score" value={stats?.averageScore || 0} trend="Per game" trendType="neutral" />
        <StatCard label="Best Streak" value={stats?.longestStreak || 0} trend="Wins in a row" trendType="up" />
      </div>

      <div className="dashboard-grid">
        <RecentGamesTable games={formattedRecentGames} />
        <ActivityTimeline activities={activities.length > 0 ? activities : [
          { color: "orange", text: "No recent activity found. Start a quiz!", time: "Today" }
        ]} />
      </div>
    </Layout>
  )
}


import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Edit3, Trophy, Target, Zap, TrendingUp, Award, Clock, Flame, User } from "lucide-react"
import Layout from "../components/Layout"
import { StatCard } from "../components/DashboardComponents"

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "" })

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    const storedUser = sessionStorage.getItem("user")

    if (!token || !storedUser) {
      navigate("/")
      return
    }

    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)
    setEditForm({ name: parsedUser.name, email: parsedUser.email })

    fetchUserStats(token)
  }, [navigate])

  const fetchUserStats = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/stats?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate("/")
  }

  const handleEditSave = () => {
    const updatedUser = { ...user, ...editForm }
    setUser(updatedUser)
    sessionStorage.setItem("user", JSON.stringify(updatedUser))
    setIsEditing(false)
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading profile...</div></Layout>

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="welcome-title">My Profile</h1>
          <p className="welcome-subtitle">Manage your account and view your achievements.</p>
        </div>
        <button onClick={handleLogout} className="btn-action btn-secondary text-red-600">
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card-panel p-8 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!isEditing ? (
              <>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 mb-6">{user?.email}</p>
                <button onClick={() => setIsEditing(true)} className="btn-action btn-secondary w-full justify-center">
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="btn-action btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={handleEditSave} className="btn-action btn-primary flex-1 justify-center">Save</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          <div className="stats-grid">
            <StatCard label="Quizzes Played" value={stats?.quizzesPlayed || 0} trend="Total" trendType="neutral" />
            <StatCard label="Total Wins" value={stats?.totalWins || 0} trend="First place" trendType="up" />
            <StatCard label="Global Rank" value={`#${stats?.ranking || 'N/A'}`} trend="Position" trendType="neutral" />
          </div>

          <div className="card-panel p-6">
            <h3 className="card-title mb-6 flex items-center gap-2">
              <Award className="text-blue-600" size={20} />
              Achievements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Achievement icon="🎯" label="First Step" />
              <Achievement icon="⭐" label="Rising Star" />
              <Achievement icon="🔥" label="Streak Master" />
              <Achievement icon="👑" label="Champion" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Achievement({ icon, label }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center hover:bg-white hover:shadow-md transition cursor-default">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-xs font-bold text-gray-700">{label}</p>
    </div>
  )
}
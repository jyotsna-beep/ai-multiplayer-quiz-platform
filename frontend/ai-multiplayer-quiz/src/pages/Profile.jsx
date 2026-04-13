import Background from "../components/Background"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Edit3, Trophy, Target, Zap, TrendingUp, Star, Award, Clock, Flame, Home, Settings } from "lucide-react"
import Navbar from "../components/Navbar"

export default function Profile() {

  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "" })
  const [profileCompletion, setProfileCompletion] = useState(0)

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
    setProfileCompletion(80) // 80% complete by default

    fetchUserStats(token)
  }, [])

  const fetchUserStats = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/stats?token=${token}`)

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    navigate("/")
  }

  const handleEditSave = () => {
    const updatedUser = { ...user, ...editForm }
    setUser(updatedUser)
    sessionStorage.setItem("user", JSON.stringify(updatedUser))
    setIsEditing(false)
  }

  const badges = [
    { name: "First Step", icon: "🎯", description: "Completed first quiz" },
    { name: "Rising Star", icon: "⭐", description: "Won 5 games" },
    { name: "Streak Master", icon: "🔥", description: "5+ win streak" },
    { name: "Quiz Champion", icon: "👑", description: "Top 10 ranking" }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative">
        <Background />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      <Background />

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition font-medium"
          >
            <Home size={18} />
            Back to Dashboard
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium shadow-lg hover:shadow-xl"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </div>

        {/* Profile Header Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 opacity-10 bg-pattern"></div>
            </div>

            <div className="px-8 pb-8 relative">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-6">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl shadow-xl border-4 border-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>

                {!isEditing ? (
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{user?.name}</h1>
                        <p className="text-blue-600 font-medium mt-1">{user?.email}</p>
                        <p className="text-gray-500 text-sm mt-2">Joined {stats?.joinDate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1"></div>
                )}
              </div>

              {/* Profile Completion Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Profile Completion</p>
                  <p className="text-sm font-bold text-blue-600">{profileCompletion}%</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  />
                </div>
              </div>

              {/* Edit/Save Section */}
              <AnimatePresence>
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-blue-50 rounded-xl p-6 border border-blue-200"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">Edit Profile Information</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-medium"
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Email Address"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition font-medium"
                      />
                      <div className="flex gap-3 justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleEditSave}
                          className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                        >
                          Save Changes
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Stat Card 1 */}
          <StatCard
            icon={<Zap size={24} />}
            color="from-blue-500 to-blue-600"
            label="Quizzes Played"
            value={stats?.quizzesPlayed || 0}
            subtext="Total games"
            delay={0.1}
          />

          {/* Stat Card 2 */}
          <StatCard
            icon={<Trophy size={24} />}
            color="from-yellow-500 to-orange-600"
            label="Total Wins"
            value={stats?.totalWins || 0}
            subtext="Victory count"
            delay={0.2}
          />

          {/* Stat Card 3 */}
          <StatCard
            icon={<Target size={24} />}
            color="from-green-500 to-emerald-600"
            label="Win Rate"
            value={`${stats?.winRate || 0}%`}
            subtext="Success ratio"
            delay={0.3}
          />

          {/* Stat Card 4 */}
          <StatCard
            icon={<TrendingUp size={24} />}
            color="from-purple-500 to-pink-600"
            label="Global Rank"
            value={`#${stats?.ranking || "N/A"}`}
            subtext="Player ranking"
            delay={0.4}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance Metrics */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Flame size={20} />
              </div>
              Performance Metrics
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <MetricBox label="Avg Score" value={stats?.averageScore || 0} unit="pts" gradient="from-red-50 to-orange-50" textColor="text-orange-600" />
              <MetricBox label="Best Streak" value={stats?.longestStreak || 0} unit="games" gradient="from-blue-50 to-indigo-50" textColor="text-blue-600" />
              <MetricBox label="Total Points" value={stats?.totalPoints || 0} unit="pts" gradient="from-green-50 to-emerald-50" textColor="text-green-600" />
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <QuickStat label="Games Today" value={Math.floor(Math.random() * 5) + 1} />
              <QuickStat label="Current Streak" value={stats?.longestStreak || 0} />
              <QuickStat label="This Month" value={stats?.quizzesPlayed || 0} />
            </div>
          </motion.div>
        </div>

        {/* Achievements Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
              <Award size={20} />
            </div>
            Badges & Achievements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 text-center border border-gray-200 hover:border-blue-300 transition cursor-pointer"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{badge.name}</p>
                <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Games */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Games</h3>
          <div className="space-y-3">
            {stats?.recentGames?.map((game, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-gray-200 hover:border-blue-300 transition">
                <div>
                  <p className="font-semibold text-gray-900">{game.date}</p>
                  <p className="text-sm text-gray-600">{game.opponents} opponents</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{game.score}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, color, label, value, subtext, delay }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    </motion.div>
  )
}

// Metric Box Component
function MetricBox({ label, value, unit, gradient, textColor }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-center border border-gray-200`}>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{unit}</p>
    </div>
  )
}

// Quick Stat Component
function QuickStat({ label, value }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition">
      <p className="text-gray-700 font-medium">{label}</p>
      <p className="text-2xl font-bold text-blue-600">{value}</p>
    </div>
  )
}
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LogOut, Edit3, Trophy, Target, Zap, TrendingUp, 
  Award, Clock, Flame, User, Shield, Activity,
  Mail, Key, CheckCircle, AlertCircle, Loader2
} from "lucide-react"
import Layout from "../components/Layout"
import { StatCard } from "../components/DashboardComponents"

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("account")
  
  // Forms
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "" })
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" })
  const [passStatus, setPassStatus] = useState({ loading: false, error: null, success: false })

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

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passForm.new !== passForm.confirm) {
      setPassStatus({ ...passStatus, error: "Passwords do not match" })
      return
    }

    setPassStatus({ loading: true, error: null, success: false })
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const token = sessionStorage.getItem("token")
      const response = await fetch(`${apiUrl}/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          old_password: passForm.old,
          new_password: passForm.new
        })
      })

      if (response.ok) {
        setPassStatus({ loading: false, error: null, success: true })
        setPassForm({ old: "", new: "", confirm: "" })
        setTimeout(() => setPassStatus(p => ({ ...p, success: false })), 3000)
      } else {
        const data = await response.json()
        throw new Error(data.detail || "Failed to update password")
      }
    } catch (error) {
      setPassStatus({ loading: false, error: error.message, success: false })
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate("/")
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading your profile...</div></Layout>

  const tabs = [
    { id: "account", label: "Account", icon: <User size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
    { id: "stats", label: "Statistics", icon: <Activity size={18} /> },
  ]

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-blue-100 border-4 border-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user?.name}</h1>
              <p className="text-gray-500 font-medium flex items-center gap-2">
                <Mail size={14} /> {user?.email}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-action btn-secondary text-red-600 border-red-100 hover:bg-red-50">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 mb-8 gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-2 text-sm font-bold transition relative
                ${activeTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}
              `}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="wait">
            {activeTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card-panel p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Personal Information</h3>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="btn-action btn-secondary py-2 px-4">
                      <Edit3 size={16} /> Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-lg font-bold text-gray-800">{user?.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                    <p className="text-lg font-bold text-gray-800">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                      <CheckCircle size={10} /> Verified
                    </span>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex gap-3 pt-8 border-t border-gray-50">
                    <button onClick={() => setIsEditing(false)} className="btn-action btn-secondary flex-1 justify-center">Cancel</button>
                    <button onClick={() => { setIsEditing(false); setUser({...user, name: editForm.name}); }} className="btn-action btn-primary flex-1 justify-center">Save Changes</button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card-panel p-8"
              >
                <div className="mb-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Security Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage your password and authentication methods.</p>
                </div>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3.5 text-gray-300" size={18} />
                      <input 
                        type="password" 
                        required
                        value={passForm.old}
                        onChange={(e) => setPassForm({...passForm, old: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <Zap className="absolute left-3 top-3.5 text-gray-300" size={18} />
                      <input 
                        type="password" 
                        required
                        value={passForm.new}
                        onChange={(e) => setPassForm({...passForm, new: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3.5 text-gray-300" size={18} />
                      <input 
                        type="password" 
                        required
                        value={passForm.confirm}
                        onChange={(e) => setPassForm({...passForm, confirm: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {passStatus.error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
                      <AlertCircle size={16} /> {passStatus.error}
                    </div>
                  )}
                  {passStatus.success && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-bold flex items-center gap-2">
                      <CheckCircle size={16} /> Password updated successfully!
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={passStatus.loading}
                    className="btn-action btn-primary w-full justify-center py-4 text-lg"
                  >
                    {passStatus.loading ? <Loader2 className="animate-spin" /> : "Update Password"}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="stats-grid">
                  <StatCard label="Quizzes Played" value={stats?.quizzesPlayed || 0} trend="Total sessions" trendType="neutral" />
                  <StatCard label="Total Wins" value={stats?.totalWins || 0} trend="Rank #1" trendType="up" />
                  <StatCard label="Global Ranking" value={`#${stats?.ranking || 'N/A'}`} trend="Overall" trendType="neutral" />
                </div>

                <div className="card-panel p-8">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8">Skill Badges</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Achievement icon={<Target className="text-purple-600" />} label="Sharpshooter" unlocked={stats?.quizzesPlayed > 0} />
                    <Achievement icon={<Flame className="text-orange-500" />} label="Hot Streak" unlocked={stats?.longestStreak > 2} />
                    <Achievement icon={<Trophy className="text-yellow-500" />} label="Elite Winner" unlocked={stats?.totalWins > 0} />
                    <Achievement icon={<TrendingUp className="text-blue-500" />} label="Pro Gamer" unlocked={stats?.quizzesPlayed > 5} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  )
}

function Achievement({ icon, label, unlocked }) {
  return (
    <div className={`
      p-6 rounded-3xl border text-center transition-all duration-500
      ${unlocked 
        ? "bg-white border-gray-100 shadow-xl shadow-gray-100 opacity-100" 
        : "bg-gray-50 border-gray-200 opacity-40 grayscale"}
    `}>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] font-bold text-gray-400 mt-1">{unlocked ? "Unlocked" : "Locked"}</p>
    </div>
  )
}
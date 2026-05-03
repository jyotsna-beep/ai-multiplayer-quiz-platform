import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  User, Lock, Mail, LogOut, CheckCircle,
  AlertCircle, Loader2, Key, Camera
} from "lucide-react"
import Layout from "../components/Layout"

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Form states
  const [name, setName] = useState("")
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" })

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) { navigate("/"); return; }
    fetchProfile(token)
  }, [navigate])

  const fetchProfile = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/profile?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setName(data.name)
      } else {
        sessionStorage.clear()
        navigate("/")
      }
    } catch (err) {
      console.error("Profile fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUpdateName = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: sessionStorage.getItem("token"),
          name: name
        })
      })
      if (response.ok) {
        showToast("Name updated successfully")
        sessionStorage.setItem("name", name)
        const stored = JSON.parse(sessionStorage.getItem("user") || "{}")
        sessionStorage.setItem("user", JSON.stringify({ ...stored, name }))
      } else {
        showToast("Failed to update name", "error")
      }
    } catch (err) {
      showToast("Connection error", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passForm.new !== passForm.confirm) { showToast("Passwords don't match", "error"); return; }
    if (passForm.new.length < 6) { showToast("Password too short", "error"); return; }

    setSaving(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: sessionStorage.getItem("token"),
          old_password: passForm.old,
          new_password: passForm.new
        })
      })
      if (response.ok) {
        showToast("Password updated!")
        setPassForm({ old: "", new: "", confirm: "" })
      } else {
        const d = await response.json()
        showToast(d.detail || "Error", "error")
      }
    } catch (err) {
      showToast("Connection error", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.clear()
    navigate("/")
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-500">Loading...</div></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Account Settings</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                  <Mail size={14} className="text-gray-400" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Display Name</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={saving || name === user?.name}
                    className="px-6 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:grayscale"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Lock size={16} className="text-blue-600" /> Change Password
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.old}
                    onChange={e => setPassForm({ ...passForm, old: e.target.value })}
                    className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">New Password</label>
                  <input
                    type="password"
                    required
                    value={passForm.new}
                    onChange={e => setPassForm({ ...passForm, new: e.target.value })}
                    className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passForm.confirm}
                  onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition shadow-lg shadow-gray-100 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 text-white font-bold
              ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}
            `}
          >
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import GameBackground from "../components/GameBackground"

export default function Signup() {

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const navigate = useNavigate()

  const handleSignup = async () => {

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setLoading(true)

    try {

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.detail || "Signup failed")
        setLoading(false)
        return
      }

      alert("Account created successfully!")

      // ✅ Optional: auto redirect to login
      navigate("/")

    } catch (err) {
      console.error(err)
      alert("Signup failed")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">

      <GameBackground />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[420px] bg-white rounded-xl p-8 relative z-20 shadow-lg border border-gray-200"
      >

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Create Account
        </h2>

        <p className="text-gray-500 mb-8 text-sm">
          Sign up to start playing quizzes with friends
        </p>

        {/* Name */}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
        />

        {/* Password */}
        <div className="relative mb-4">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

        </div>

        {/* Confirm Password */}
        <div className="relative mb-6">

          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50 transition"
          />

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

        </div>

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google Signup */}
        <button className="w-full border border-gray-300 flex items-center justify-center gap-3 py-3 rounded-lg hover:bg-gray-50 transition text-gray-700">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5"
          />
          Continue with Google
        </button>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-semibold hover:text-blue-700 transition">
            Login
          </Link>
        </p>

      </motion.div>

    </div>
  )
}
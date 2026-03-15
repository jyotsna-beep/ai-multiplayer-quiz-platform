import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import GameBackground from "../components/GameBackground"
import RocketMascot from "../components/RocketMascot"

export default function Login() {

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = () => {
    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      navigate("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">

      {/* animated gradient background */}
      <GameBackground />

      {/* rocket mascot */}
      <RocketMascot />

      {/* login card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-card w-[720px]"
      >

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome Back
        </h2>

        <p className="text-gray-500 mb-8">
          Login to continue
        </p>


        {/* Email */}

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />


        {/* Password */}

        <div className="relative mb-2">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
          >
            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
          </div>

        </div>


        <div className="text-right text-sm text-gray-500 mb-6 cursor-pointer">
          Forgot password?
        </div>


        {/* Login Button */}

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex justify-center items-center"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="flex items-center my-6">

  <div className="flex-grow border-t"></div>

  <span className="mx-3 text-gray-400 text-sm">
    OR
  </span>

  <div className="flex-grow border-t"></div>

</div>


<button className="w-full border flex items-center justify-center gap-3 py-3 rounded-lg hover:bg-gray-50 transition">

  <img
    src="https://www.svgrepo.com/show/475656/google-color.svg"
    className="w-5"
  />

  Continue with Google

</button>


        {/* Signup Link */}

        <p className="text-center text-gray-500 mt-6 text-sm">

          Don't have an account?{" "}

          <Link
            to="/signup"
            className="text-[#C1121F] font-semibold"
          >
            Sign up
          </Link>

        </p>

      </motion.div>

    </div>
  )
}
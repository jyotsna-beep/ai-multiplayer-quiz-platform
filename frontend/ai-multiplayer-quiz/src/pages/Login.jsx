import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import GameBackground from "../components/GameBackground"

export default function Login() {

  const [showPassword,setShowPassword] = useState(false)
  const [loading,setLoading] = useState(false)

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const navigate = useNavigate()

  const handleLogin = async () => {

    if(!email || !password){
      alert("Please fill all fields")
      return
    }

    setLoading(true)

    try{

      const response = await fetch("http://127.0.0.1:8000/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if(!response.ok){
        alert(data.detail)
        setLoading(false)
        return
      }

      localStorage.setItem("token",data.token)

      localStorage.setItem("user",JSON.stringify({
        name:data.name,
        email:data.email
      }))

      navigate("/dashboard")

    }catch(err){

      console.error(err)
      alert("Login failed")

    }

    setLoading(false)
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">

      <GameBackground />

      <motion.div
        initial={{ opacity:0, y:40 }}
        animate={{ opacity:1, y:0 }}
        className="glow-card w-[420px] relative z-20 p-8"
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
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />


        {/* Password */}

        <div className="relative mb-4">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          <button
            type="button"
            onClick={()=>setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500"
          >
            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>

        </div>


        <div className="text-right text-sm text-gray-500 mb-6 cursor-pointer">
          Forgot password?
        </div>


        {/* Login Button */}

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>


        {/* Divider */}

        <div className="flex items-center my-6">

          <div className="flex-grow border-t"></div>

          <span className="mx-3 text-gray-400 text-sm">
            OR
          </span>

          <div className="flex-grow border-t"></div>

        </div>


        {/* Google Login */}

        <button className="w-full border flex items-center justify-center gap-3 py-3 rounded-lg hover:bg-gray-50 transition">

          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5"
          />

          Continue with Google

        </button>


        {/* Signup */}

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
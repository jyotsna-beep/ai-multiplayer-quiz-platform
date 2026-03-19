import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { motion } from "framer-motion"
import { Play, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Dashboard() {

  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {

    const token = sessionStorage.getItem("token")
    const storedUser = sessionStorage.getItem("user")

    // 🚫 If not logged in → redirect
    if (!token || !storedUser) {
      navigate("/")
      return
    }

    setUser(JSON.parse(storedUser))

  }, [])

  return (
    <div className="min-h-screen bg-white relative">

      <Background />

      <Navbar />

      <div className="flex flex-col items-center justify-center mt-28 px-6">

        {/* Welcome */}
        <h2 className="text-5xl font-bold text-gray-800 mb-4 text-center">
          Welcome {user?.name || ""} 👋
        </h2>

        <p className="text-gray-500 text-lg mb-16 text-center max-w-xl">
          Upload study material, generate quizzes with AI,
          and compete with players in real time.
        </p>

        <div className="flex gap-10 flex-wrap justify-center">

          {/* Create Room */}
          <motion.div
            whileHover={{ scale: 1.07 }}
            onClick={() => navigate("/create-room")}
            className="backdrop-blur-lg bg-white/70 border w-72 h-52 rounded-2xl flex flex-col items-center justify-center shadow-xl cursor-pointer"
          >
            <div className="bg-gradient-to-r from-[#C1121F] to-[#F77F00] p-4 rounded-xl text-white">
              <Play size={32} />
            </div>

            <p className="mt-4 text-xl font-semibold text-gray-800">
              Create Room
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Host a quiz game
            </p>
          </motion.div>

          {/* Join Room */}
          <motion.div
            whileHover={{ scale: 1.07 }}
            onClick={() => navigate("/join-room")}
            className="backdrop-blur-lg bg-white/70 border w-72 h-52 rounded-2xl flex flex-col items-center justify-center shadow-xl cursor-pointer"
          >
            <div className="bg-gradient-to-r from-[#F77F00] to-[#FFB703] p-4 rounded-xl text-white">
              <Users size={32} />
            </div>

            <p className="mt-4 text-xl font-semibold text-gray-800">
              Join Room
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Enter a room code
            </p>
          </motion.div>

        </div>

      </div>

    </div>
  )
}
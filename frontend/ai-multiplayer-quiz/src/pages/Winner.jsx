import { motion } from "framer-motion"
import Background from "../components/Background"
import { useLocation, useNavigate } from "react-router-dom"
import Confetti from "react-confetti"

export default function Winner(){

  const location = useLocation()
  const navigate = useNavigate()

  const leaderboard = location.state?.leaderboard || []

  const winner = leaderboard[0]

  return (

    <div className="min-h-screen bg-[#FFF6F3] flex flex-col items-center pt-20 relative">

      <Background />

      {/* Confetti Animation */}

      <Confetti numberOfPieces={250} recycle={false}/>


      {/* Winner Card */}

      <motion.div
        initial={{scale:0}}
        animate={{scale:1}}
        transition={{duration:0.6}}
        className="glow-card w-[520px] text-center mb-12"
      >

        <h2 className="text-gray-500 mb-2">
          🏆 Winner
        </h2>

        <h1 className="text-4xl font-bold text-[#C1121F] mb-2">

          {winner?.name || "Player"}

        </h1>

        <p className="text-xl font-semibold">

          {winner?.score || 0} Points

        </p>

      </motion.div>


      {/* Leaderboard */}

      <div className="glow-card w-[650px]">

        <h2 className="text-xl font-bold mb-6">
          Final Leaderboard
        </h2>

        <div className="space-y-4">

          {leaderboard.map((player,index)=>(

            <motion.div
              key={index}
              initial={{opacity:0,y:10}}
              animate={{opacity:1,y:0}}
              transition={{delay:index*0.1}}
              className="flex justify-between items-center border-b pb-2"
            >

              <div className="flex items-center gap-3">

                <span className="font-bold text-gray-400">
                  #{index+1}
                </span>

                <span className="text-2xl">
                  🧑
                </span>

                <span className="font-semibold">
                  {player.name}
                </span>

              </div>

              <span className="font-bold">
                {player.score}
              </span>

            </motion.div>

          ))}

        </div>

      </div>


      {/* Buttons */}

      <div className="flex gap-6 mt-12">

        <button
          onClick={()=>navigate("/dashboard")}
          className="bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90"
        >
          Back to Dashboard
        </button>

        <button
          onClick={()=>navigate("/create-room")}
          className="border px-8 py-3 rounded-xl font-semibold hover:bg-gray-100"
        >
          Play Again
        </button>

      </div>

    </div>

  )
}
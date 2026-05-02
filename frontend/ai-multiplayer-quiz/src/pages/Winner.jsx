import { motion } from "framer-motion"
import { useLocation, useNavigate } from "react-router-dom"
import Confetti from "react-confetti"
import { useEffect, useState } from "react"
import { Trophy, Home, RotateCcw, Medal, Users, ArrowRight } from "lucide-react"
import "../Dashboard.css"

export default function Winner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }

    if (location.state?.leaderboard) {
      setLeaderboard(location.state.leaderboard)
      sessionStorage.setItem("last_leaderboard", JSON.stringify(location.state.leaderboard))
    } else {
      const saved = sessionStorage.getItem("last_leaderboard")
      if (saved) setLeaderboard(JSON.parse(saved))
    }

    return () => window.removeEventListener('resize', handleResize)
  }, [navigate, location])

  const winner = leaderboard[0]

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col items-center justify-center p-6">
      <Confetti 
        width={windowSize.width} 
        height={windowSize.height} 
        numberOfPieces={300} 
        recycle={false}
        colors={['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']}
      />

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Winner Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-panel p-12 text-center bg-white border-2 border-yellow-400 shadow-[0_20px_50px_rgba(234,179,8,0.1)]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
            className="w-24 h-24 bg-yellow-400 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl mb-8"
          >
            <Trophy size={48} />
          </motion.div>
          
          <h2 className="text-sm font-black text-yellow-600 uppercase tracking-[0.3em] mb-2">Quiz Champion</h2>
          <h1 className="text-5xl font-black text-gray-900 mb-4">{winner?.name || "No Winner"}</h1>
          <div className="inline-flex items-center gap-2 bg-yellow-50 px-6 py-2 rounded-full border border-yellow-100">
            <Medal size={20} className="text-yellow-600" />
            <span className="text-xl font-bold text-yellow-700">{winner?.score ?? 0} Total Points</span>
          </div>
        </motion.div>

        {/* Final Standings Table */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-panel overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Final Standings
              </h3>
              <span className="badge badge-runner-up">{leaderboard.length} Players</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rank</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Player</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, idx) => (
                    <tr key={idx} className={`border-t border-gray-50 ${idx === 0 ? "bg-yellow-50/30" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                          ${idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-200 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "text-gray-400"}
                        `}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-lg font-bold ${idx === 0 ? "text-gray-900" : "text-gray-700"}`}>
                          {player.name}
                        </span>
                        {idx === 0 && <span className="ml-2 text-xs font-black text-yellow-600 uppercase tracking-widest bg-yellow-100 px-2 py-0.5 rounded">Winner</span>}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xl text-gray-900">
                        {player.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-action btn-secondary w-full sm:w-auto h-14 px-8 justify-center"
          >
            <Home size={20} />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/create-room")}
            className="btn-action btn-primary w-full sm:w-auto h-14 px-8 justify-center shadow-blue-200 shadow-lg"
          >
            <RotateCcw size={20} />
            Host New Quiz
            <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}
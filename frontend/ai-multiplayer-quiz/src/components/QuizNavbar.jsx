import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { LogOut, Copy } from "lucide-react"

export default function QuizNavbar({ current = 1, total = 10 }) {

  const [confirm, setConfirm] = useState(false)
  const navigate = useNavigate()
  const { roomCode } = useParams()

  const leaveQuiz = () => {
    navigate("/dashboard")
  }

  const copyRoom = () => {
    navigator.clipboard.writeText(roomCode)
  }

  return (
    <>
      <div className="flex justify-between items-center px-10 py-4 bg-white/80 backdrop-blur-md border-b shadow-sm">

        {/* Room */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">Room:</span>

          <span className="font-bold tracking-widest text-[#C1121F]">
            {roomCode}
          </span>

          <button onClick={copyRoom}>
            <Copy size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="font-semibold text-gray-700">
          Question {current} / {total}
        </div>

        {/* Exit */}
        <button
          onClick={() => setConfirm(true)}
          className="flex items-center gap-2 text-red-500"
        >
          <LogOut size={18} />
          Exit
        </button>

      </div>

      {/* Modal */}
      {confirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-[340px] text-center"
          >

            <h3 className="text-lg font-semibold mb-2">
              Leave Quiz?
            </h3>

            <p className="text-gray-500 mb-6">
              Progress will be lost
            </p>

            <div className="flex justify-center gap-4">

              <button
                onClick={() => setConfirm(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={leaveQuiz}
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Leave
              </button>

            </div>

          </motion.div>

        </div>
      )}

    </>
  )
}
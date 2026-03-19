import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Background from "../components/Background"
import QuizNavbar from "../components/QuizNavbar"
import { useNavigate, useParams } from "react-router-dom"

export default function Quiz() {

  const { roomCode } = useParams()
  const navigate = useNavigate()

  const wsRef = useRef(null)
  const startTimeRef = useRef(null)

  const [question, setQuestion] = useState(null)
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(10)

  useEffect(() => {

    const token = localStorage.getItem("token")

    if (!token) {
      navigate("/")
      return
    }

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/${roomCode}?token=${token}`
    )

    wsRef.current = ws

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data)

      // 🧠 NEW QUESTION
      if (data.type === "question") {

        setQuestion(data.question)
        setSelected(null)

        // ✅ backend timer
        setTotalTime(data.time_per_question)
        setTimeLeft(data.time_per_question)

        // ✅ track answer time
        startTimeRef.current = Date.now()
      }

      // ⏱ TIMER UPDATE
      if (data.type === "timer") {
        setTimeLeft(data.time_left)
      }

      // 🏆 LEADERBOARD
      if (data.type === "leaderboard") {
        setPlayers(data.scores)
      }

      // 🎉 GAME OVER
      if (data.type === "game_over") {
        navigate("/winner", {
          state: { leaderboard: data.scores }
        })
      }
    }

    return () => ws.close()

  }, [roomCode])

  const sendAnswer = (option) => {

    if (selected) return // prevent double click

    setSelected(option)

    const timeTaken = (Date.now() - startTimeRef.current) / 1000

    wsRef.current.send(JSON.stringify({
      event: "answer",
      answer: option,
      time_taken: timeTaken
    }))
  }

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500"
  ]

  const icons = ["▲", "◆", "●", "■"]

  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0

  return (

    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <QuizNavbar />

      <div className="flex justify-center mt-24 px-6">

        <div className="flex gap-10 w-[1200px]">

          {/* QUESTION AREA */}
          <div className="flex-1">

            <div className="glow-card mb-6">
              <h2 className="text-2xl font-bold text-center">
                {question?.question || "Waiting for question..."}
              </h2>
            </div>

            {/* TIMER */}
            <div className="w-full h-4 bg-gray-200 rounded-full mb-8 overflow-hidden">

              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
                className={`h-full ${timeLeft <= 5 ? "bg-red-500" : "bg-green-500"}`}
              />

            </div>

            {/* ANSWERS */}
            <div className="grid grid-cols-2 gap-6">

              {question?.options?.map((option, index) => (

                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendAnswer(option)}

                  className={`
                    ${colors[index]}
                    text-white
                    text-xl
                    font-semibold
                    p-8
                    rounded-2xl
                    shadow-xl
                    cursor-pointer
                    flex items-center gap-4
                    transition
                    ${selected === option ? "ring-4 ring-white scale-105" : ""}
                  `}
                >

                  <span className="text-3xl">
                    {icons[index]}
                  </span>

                  {option}

                </motion.div>

              ))}

            </div>

          </div>

          {/* LEADERBOARD */}
          <div className="w-[320px] glow-card">

            <h2 className="text-xl font-bold mb-6">
              Leaderboard
            </h2>

            <div className="space-y-5">

              {players.map((player, index) => (

                <div key={index}>

                  <div className="flex items-center justify-between mb-1">

                    <div className="flex items-center gap-2">

                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>

                      <span className="text-2xl">🧑</span>

                      <span className="font-semibold">
                        {player.name}
                      </span>

                    </div>

                    <span className="font-bold">
                      {player.score}
                    </span>

                  </div>

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">

                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${player.score / 5}%` }}
                      className="bg-gradient-to-r from-[#C1121F] to-[#F77F00] h-2 rounded-full"
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
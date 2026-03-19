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
  const timerRef = useRef(null)

  const [question, setQuestion] = useState(null)
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(10)

  useEffect(() => {

    const token = sessionStorage.getItem("token")

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

        const t = data.timer || 10

        setTotalTime(t)
        setTimeLeft(t)

        startTimeRef.current = Date.now()

        // 🔥 LOCAL TIMER (IMPORTANT FIX)
        clearInterval(timerRef.current)

        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
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

    return () => {
      ws.close()
      clearInterval(timerRef.current)
    }

  }, [roomCode])

  const sendAnswer = (option) => {

    if (selected || timeLeft === 0) return

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

          {/* QUESTION */}
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
                transition={{ ease: "linear", duration: 1 }}
                className={`h-full ${timeLeft <= 5 ? "bg-red-500" : "bg-green-500"}`}
              />

            </div>

            {/* OPTIONS */}
<div className="grid grid-cols-2 gap-6">

  {question?.options?.map((option, index) => {

    const isSelected = selected === option
    const isDisabled = selected !== null

    return (
      <motion.div
        key={index}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        onClick={() => sendAnswer(option)}

        className={`
          ${colors[index]}
          text-white
          text-xl
          font-semibold
          p-8
          rounded-2xl
          shadow-xl
          flex items-center gap-4
          transition-all duration-200

          ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}

          ${isSelected
            ? "ring-4 ring-white scale-105 brightness-110"
            : isDisabled
              ? "opacity-50"
              : ""
          }

          ${timeLeft === 0 ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >

        <span className="text-3xl">
          {icons[index]}
        </span>

        {option}

      </motion.div>
    )
  })}

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

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
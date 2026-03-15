import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Background from "../components/Background"
import QuizNavbar from "../components/QuizNavbar"

export default function Quiz() {

  const questionData = {
    question: "What is the capital of India?",
    options: ["Delhi", "Mumbai", "Kolkata", "Chennai"]
  }

  const players = [
    {name:"Jyotsna",score:1200,avatar:"🦊"},
    {name:"Rahul",score:950,avatar:"🐼"},
    {name:"Anita",score:820,avatar:"🐱"},
    {name:"Ravi",score:600,avatar:"🐸"}
  ]

  const [selected,setSelected] = useState(null)
  const [time,setTime] = useState(15)

  useEffect(()=>{
    const timer = setInterval(()=>{
      setTime(prev => prev>0 ? prev-1 : 0)
    },1000)

    return ()=>clearInterval(timer)
  },[])

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500"
  ]

  const icons = ["▲","◆","●","■"]

  const progress = (time/15)*100

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <QuizNavbar />

      {/* MAIN GAME AREA */}

      <div className="flex justify-center mt-24 px-6">

        <div className="flex gap-10 w-[1200px]">

          {/* QUESTION SECTION */}

          <div className="flex-1">

            {/* QUESTION CARD */}

            <div className="glow-card mb-6">

              <h2 className="text-2xl font-bold text-center">
                {questionData.question}
              </h2>

            </div>


            {/* TIMER PROGRESS BAR */}

            <div className="w-full h-4 bg-gray-200 rounded-full mb-8 overflow-hidden">

              <motion.div
                animate={{width:`${progress}%`}}
                transition={{ease:"linear"}}
                className={`h-full ${time<=5 ? "bg-red-500":"bg-green-500"}`}
              />

            </div>


            {/* ANSWER GRID */}

            <div className="grid grid-cols-2 gap-6">

              {questionData.options.map((option,index)=>(

                <motion.div
                  key={index}

                  whileHover={{scale:1.05}}
                  whileTap={{scale:0.95}}

                  onClick={()=>setSelected(option)}

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
                  ${selected===option ? "ring-4 ring-white scale-105":""}
                  hover:shadow-[0_0_20px_rgba(0,0,0,0.2)]
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

              {players.map((player,index)=>(

                <div key={index}>

                  <div className="flex items-center justify-between mb-1">

                    <div className="flex items-center gap-2">

                      <span className="font-bold text-gray-400">
                        #{index+1}
                      </span>

                      <span className="text-2xl">
                        {player.avatar}
                      </span>

                      <span className="font-semibold">
                        {player.name}
                      </span>

                    </div>

                    <span className="font-bold">
                      {player.score}
                    </span>

                  </div>


                  {/* SCORE BAR */}

                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">

                    <motion.div
                      initial={{width:0}}
                      animate={{width:`${player.score/15}%`}}
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
import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"

export default function Lobby() {

  const players = [
    {name:"Jyotsna", avatar:"🦊"},
    {name:"Rahul", avatar:"🐼"},
    {name:"Anita", avatar:"🐱"},
    {name:"Ravi", avatar:"🐸"},
    {name:"Kiran", avatar:"🐵"}
  ]

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <Navbar />

      <div className="flex flex-col items-center mt-16 px-6">

        {/* Room Code */}

        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className="glow-card w-[500px] text-center mb-10"
        >

          <p className="text-gray-500 mb-2">
            Room Code
          </p>

          <h1 className="text-4xl font-bold tracking-widest text-[#C1121F]">
            A7K9D3
          </h1>

        </motion.div>


        {/* Players Grid */}

        <div className="grid grid-cols-3 gap-6 max-w-[700px]">

          {players.map((player,index)=>(
            <motion.div
              key={index}
              initial={{scale:0}}
              animate={{scale:1}}
              transition={{delay:index*0.1}}
              className="bg-white rounded-xl shadow-lg p-4 text-center"
            >

              <div className="text-4xl mb-2">
                {player.avatar}
              </div>

              <p className="font-semibold">
                {player.name}
              </p>

            </motion.div>
          ))}

        </div>


        {/* Start Button */}

        <button className="mt-12 bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-14 py-3 rounded-xl text-lg font-semibold shadow-lg hover:opacity-90">

          Start Quiz

        </button>

      </div>

    </div>
  )
}
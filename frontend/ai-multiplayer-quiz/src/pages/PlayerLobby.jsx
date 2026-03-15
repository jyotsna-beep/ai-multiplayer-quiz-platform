import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState, useRef } from "react"

export default function PlayerLobby() {

  const { roomCode } = useParams()
  const navigate = useNavigate()

  const [players,setPlayers] = useState([])
  const [connectionError,setConnectionError] = useState(null)

  const wsRef = useRef(null)

  useEffect(()=>{

    const playerName = localStorage.getItem("playerName")

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws"
    const wsHost = "127.0.0.1:8000"

    const ws = new WebSocket(
      `${wsProtocol}://${wsHost}/ws/${roomCode}/${playerName}`
    )

    wsRef.current = ws

    ws.onopen = () => {
      setConnectionError(null)
    }

    ws.onerror = (err) => {
      console.error("WebSocket error", err)
      setConnectionError("Unable to connect to the server. Please refresh and try again.")
    }

    ws.onclose = () => {
      setConnectionError((prev) => prev || "WebSocket connection closed.")
    }

    ws.onmessage = (event)=>{

      const data = JSON.parse(event.data)

      if(data.type === "players"){
        setPlayers(data.players)
      }

      if(data.type === "start_quiz"){

        navigate(`/quiz/${roomCode}`,{
          state:{
            question:data.question
          }
        })

      }

    }

    return ()=>ws.close()

  },[roomCode])


  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <Navbar />

      <div className="flex flex-col items-center mt-16 px-6">

        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className="glow-card w-[500px] text-center mb-10"
        >

          <p className="text-gray-500 mb-2">
            Room Code
          </p>

          <h1 className="text-4xl font-bold tracking-widest text-[#C1121F]">
            {roomCode}
          </h1>

        </motion.div>


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
                🧑
              </div>

              <p className="font-semibold">
                {player}
              </p>

            </motion.div>
          ))}

        </div>

        {connectionError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {connectionError}
          </div>
        )}

        <p className="mt-12 text-gray-600 text-lg">
          Waiting for the host to start the quiz...
        </p>

      </div>

    </div>
  )
}
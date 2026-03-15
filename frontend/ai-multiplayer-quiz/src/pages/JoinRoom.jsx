import { useState, useRef } from "react"
import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { useNavigate } from "react-router-dom"

export default function JoinRoom() {

  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [playerName,setPlayerName] = useState("")
  const inputs = useRef([])
  const navigate = useNavigate()

  const handleChange = (value, index) => {

    if (!/^[A-Za-z0-9]?$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)

    if (value && index < 5) {
      inputs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (e, index) => {

    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1].focus()
    }

  }

  const handleJoinRoom = async () => {

  const roomCode = code.join("")

  if(!playerName){
    alert("Enter your name")
    return
  }

  if(roomCode.length !== 6){
    alert("Enter valid room code")
    return
  }

  console.log("Join room", { roomCode, playerName })

  const response = await fetch("http://127.0.0.1:8000/join-room",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      room_code:roomCode,
      player_name:playerName
    })
  })

  const data = await response.json()

  console.log("Join response", data)

  if(data.error){
    alert("Room not found")
    return
  }

  localStorage.setItem("playerName",playerName)

  navigate(`/player-lobby/${roomCode}`)
}

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <Navbar />

      <div className="flex items-center justify-center mt-32">

        <motion.div
          initial={{ opacity:0, y:30 }}
          animate={{ opacity:1, y:0 }}
          className="glow-card w-[720px]"
        >

          <h2 className="text-3xl font-bold mb-4">
            Join Game
          </h2>

          <p className="text-gray-500 mb-6">
            Enter the room code
          </p>

          {/* Player Name */}

          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e)=>setPlayerName(e.target.value)}
            className="w-full border p-3 rounded-lg mb-8"
          />

          {/* Code Boxes */}

          <div className="flex justify-center gap-3 mb-8">

            {code.map((digit, index) => (

              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                value={digit}
                maxLength={1}

                onChange={(e) =>
                  handleChange(e.target.value, index)
                }

                onKeyDown={(e) =>
                  handleKeyDown(e, index)
                }

                className="w-14 h-14 text-center text-2xl border rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              />

            ))}

          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white py-3 rounded-xl text-lg font-semibold hover:opacity-90 transition"
          >
            Join Game
          </button>

        </motion.div>

      </div>

    </div>
  )
}
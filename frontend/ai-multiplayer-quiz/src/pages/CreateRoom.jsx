import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function CreateRoom() {

  const [hostName,setHostName] = useState("")
  const [file,setFile] = useState(null)
  const [questions,setQuestions] = useState(10)
  const [difficulty,setDifficulty] = useState("Easy")
  const [loading,setLoading] = useState(false)

  const navigate = useNavigate()

  const handleCreateRoom = async () => {

    if(!hostName){
      alert("Enter your name")
      return
    }

    if(!file){
      alert("Upload study material")
      return
    }

    setLoading(true)

    try{

      // Create room
      const roomResponse = await fetch("http://127.0.0.1:8000/create-room",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          host_name:hostName
        })
      })

      const roomData = await roomResponse.json()
      const roomCode = roomData.room_code

      // Generate quiz
      const formData = new FormData()

      formData.append("file",file)
      formData.append("questions",questions)
      formData.append("difficulty",difficulty)
      formData.append("room_code",roomCode)

      const quizResponse = await fetch("http://127.0.0.1:8000/generate-quiz",{
        method:"POST",
        body:formData
      })

      const quizData = await quizResponse.json()

      console.log("Generated Quiz:",quizData)

      localStorage.setItem("playerName",hostName)

      navigate(`/lobby/${roomCode}`)

    }catch(err){

      console.error(err)
      alert("Error generating quiz")

    }finally{

      setLoading(false)

    }

  }

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">

      <Background />
      <Navbar />

      {/* Loading Overlay */}

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white p-10 rounded-xl shadow-xl text-center">

            <motion.div
              animate={{ y:[0,-10,0] }}
              transition={{ repeat:Infinity, duration:1 }}
              className="text-5xl mb-4"
            >
              🤖
            </motion.div>

            <h2 className="text-xl font-semibold mb-2">
              Generating Quiz
            </h2>

            <p className="text-gray-500">
              AI is creating questions from your study material...
            </p>

          </div>

        </div>
      )}

      <div className="flex justify-center items-center mt-16 px-6">

        <motion.div
          initial={{ opacity:0, y:40 }}
          animate={{ opacity:1, y:0 }}
          className="glow-card w-[720px]"
        >

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Create Quiz Room
          </h2>

          <p className="text-gray-500 mb-6">
            Configure your quiz game
          </p>

          {/* Host Name */}

          <input
            type="text"
            placeholder="Your Name"
            value={hostName}
            onChange={(e)=>setHostName(e.target.value)}
            className="w-full border p-3 rounded-lg mb-6"
          />

          {/* File Upload */}

          <input
            type="file"
            onChange={(e)=>setFile(e.target.files[0])}
            className="w-full mb-6"
          />

          {/* Question Count */}

          <input
            type="number"
            value={questions}
            onChange={(e)=>setQuestions(e.target.value)}
            className="w-full border p-3 rounded-lg mb-6"
            placeholder="Number of questions"
          />

          {/* Difficulty */}

          <select
            value={difficulty}
            onChange={(e)=>setDifficulty(e.target.value)}
            className="w-full border p-3 rounded-lg mb-6"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>

          {/* Button */}

          <button
            disabled={loading}
            onClick={handleCreateRoom}
            className={`w-full py-3 rounded-xl text-lg font-semibold transition
            ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>

        </motion.div>

      </div>

    </div>
  )
}
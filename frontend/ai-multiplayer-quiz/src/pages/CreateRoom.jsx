import { motion } from "framer-motion"
import Navbar from "../components/Navbar"
import Background from "../components/Background"

export default function CreateRoom() {

  return (
    <div className="min-h-screen bg-[#FFF6F3] relative">
      <Background />
      <Navbar />

      <div className="flex justify-center items-center mt-16 px-6">

        <motion.div
          initial={{ opacity:0, y:40 }}
          animate={{ opacity:1, y:0 }}
          className="glow-card w-[720px]"
        >

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Create Quiz Room
          </h2>

          <p className="text-gray-500 mb-10">
            Configure your quiz game
          </p>


          {/* Upload */}

          <div className="mb-8">

            <p className="font-semibold mb-2">Study Material</p>

            <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-32 cursor-pointer hover:border-orange-400 transition">

              <span className="text-gray-500">
                Upload PDF / PPT / DOC
              </span>

              <input type="file" className="hidden"/>

            </label>

          </div>


          {/* Grid Settings */}

          <div className="grid grid-cols-2 gap-6 mb-8">

            <div>

              <p className="font-semibold mb-2">Questions</p>

              <input
                type="number"
                placeholder="10"
                className="w-full border p-3 rounded-lg"
              />

            </div>


            <div>

              <p className="font-semibold mb-2">Time / Question</p>

              <input
                type="number"
                placeholder="20 sec"
                className="w-full border p-3 rounded-lg"
              />

            </div>


            <div>

              <p className="font-semibold mb-2">Difficulty</p>

              <select className="w-full border p-3 rounded-lg">

                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>

              </select>

            </div>


            <div>

              <p className="font-semibold mb-2">Max Players</p>

              <input
                type="number"
                placeholder="10"
                className="w-full border p-3 rounded-lg"
              />

            </div>

          </div>


          <button className="w-full bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white py-3 rounded-xl text-lg font-semibold hover:opacity-90 transition">

            Generate Quiz

          </button>

        </motion.div>

      </div>

    </div>
  )
}
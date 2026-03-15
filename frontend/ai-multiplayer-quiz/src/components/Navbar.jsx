import { User } from "lucide-react"

export default function Navbar() {
  return (
    <div className="w-full flex justify-between items-center px-10 py-4 bg-white border-b">

      <h1 className="text-xl font-bold bg-gradient-to-r from-[#C1121F] to-[#F77F00] bg-clip-text text-transparent">
        AI Quiz Arena
      </h1>

      <div className="flex items-center gap-4">

        <button className="bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-4 py-2 rounded-lg">
          Profile
        </button>

        <User size={28} className="text-gray-700" />

      </div>

    </div>
  )
}
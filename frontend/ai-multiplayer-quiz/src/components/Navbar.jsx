import { User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Navbar() {

  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    navigate("/")
  }

  return (
    <div className="w-full flex justify-between items-center px-10 py-4 bg-white border-b">

      <h1
        onClick={() => navigate("/dashboard")}
        className="cursor-pointer text-xl font-bold bg-gradient-to-r from-[#C1121F] to-[#F77F00] bg-clip-text text-transparent"
      >
        AI Quiz Arena
      </h1>

      <div className="flex items-center gap-4">

        <button
          onClick={() => navigate("/profile")}
          className="bg-gradient-to-r from-[#C1121F] to-[#F77F00] text-white px-4 py-2 rounded-lg"
        >
          Profile
        </button>

        <User className="text-gray-700" />

        <button
          onClick={logout}
          className="text-red-500 hover:text-red-600"
        >
          <LogOut />
        </button>

      </div>

    </div>
  )
}
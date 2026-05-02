import Sidebar from "./Sidebar"
import Header from "./Header"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Layout({ children }) {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")
    const token = sessionStorage.getItem("token")

    if (!token || !storedUser) {
      navigate("/")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [navigate])

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Header user={user} />
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

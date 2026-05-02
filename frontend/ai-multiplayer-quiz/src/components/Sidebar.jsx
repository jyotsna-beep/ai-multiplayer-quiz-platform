import { LayoutDashboard, Users, History, Library, Trophy, UserCircle, LogOut } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard", section: "MAIN" },
    { label: "My rooms", icon: <Users size={20} />, path: "/my-rooms" },
    { label: "Quiz history", icon: <History size={20} />, path: "/quiz-history" },
    { label: "PDF library", icon: <Library size={20} />, path: "/pdf-library", section: "TOOLS" },
    { label: "Leaderboards", icon: <Trophy size={20} />, path: "/leaderboards" },
    { label: "Profile", icon: <UserCircle size={20} />, path: "/profile", section: "SETTINGS" },
  ]

  const handleLogout = () => {
    sessionStorage.clear()
    navigate("/")
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Trophy size={18} />
          </div>
          <span>QuizAI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <div key={item.path}>
              {item.section && <div className="nav-section-label">{item.section}</div>}
              <div
                className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div 
          className="nav-item text-red-500 hover:bg-red-50 hover:text-red-600" 
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  )
}


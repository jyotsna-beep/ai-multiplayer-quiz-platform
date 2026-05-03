import { Search, Bell, User } from "lucide-react"

export default function Header({ user }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="breadcrumb">
          <span>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span className="font-semibold text-gray-900">Dashboard</span>
        </div>
      </div>

      <div className="header-right">
        

        

        <div className="avatar">
          {user?.name?.[0]?.toUpperCase() || <User size={20} />}
        </div>
      </div>
    </header>
  )
}

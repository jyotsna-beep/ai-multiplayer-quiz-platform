import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { Trash2 } from "lucide-react"

function formatDate(value) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default function MyRooms() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingRoom, setDeletingRoom] = useState(null)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [deletingSelected, setDeletingSelected] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }
    fetchRooms(token)
  }, [navigate])

  const fetchRooms = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/rooms?token=${token}`)
      const data = await response.json()
      if (response.ok) setRooms(data)
    } catch (error) {
      console.error("Failed to load rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRoomSelection = (roomCode) => {
    setSelectedRooms((prev) =>
      prev.includes(roomCode)
        ? prev.filter((code) => code !== roomCode)
        : [...prev, roomCode]
    )
  }

  const toggleSelectAll = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([])
      return
    }
    setSelectedRooms(rooms.map((room) => room.room_code))
  }

  const deleteRoom = async (roomCode) => {
    if (!window.confirm("Delete this room and its history from your account?")) {
      return
    }

    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }

    setDeletingRoom(roomCode)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/rooms/${roomCode}?token=${token}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setRooms((prev) => prev.filter((room) => room.room_code !== roomCode))
        setSelectedRooms((prev) => prev.filter((code) => code !== roomCode))
      }
    } catch (error) {
      console.error("Failed to delete room:", error)
    } finally {
      setDeletingRoom(null)
    }
  }

  const deleteSelectedRooms = async () => {
    if (selectedRooms.length === 0) return
    if (!window.confirm(`Delete ${selectedRooms.length} selected room(s)?`)) {
      return
    }

    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }

    setDeletingSelected(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const remainingRooms = [...rooms]

      for (const roomCode of selectedRooms) {
        await fetch(`${apiUrl}/user/rooms/${roomCode}?token=${token}`, {
          method: "DELETE"
        })
      }
      
      const newRooms = remainingRooms.filter(r => !selectedRooms.includes(r.room_code))
      setRooms(newRooms)
      setSelectedRooms([])
    } catch (error) {
      console.error("Failed to delete selected rooms:", error)
    } finally {
      setDeletingSelected(false)
    }
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="welcome-title">My Rooms</h1>
          <p className="welcome-subtitle">Rooms you hosted or joined, with players, scores, and status.</p>
        </div>
        <button
          onClick={deleteSelectedRooms}
          disabled={selectedRooms.length === 0 || deletingSelected}
          className="btn-action btn-primary"
          style={{ backgroundColor: '#dc2626' }}
        >
          <Trash2 size={18} />
          {deletingSelected ? "Deleting..." : `Delete selected (${selectedRooms.length})`}
        </button>
      </div>

      <div className="card-panel">
        <div className="overflow-x-auto">
          <table className="games-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={rooms.length > 0 && selectedRooms.length === rooms.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Room</th>
                <th>Created</th>
                <th>Players</th>
                <th>Winner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.room_code}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.room_code)}
                      onChange={() => toggleRoomSelection(room.room_code)}
                    />
                  </td>
                  <td className="font-bold text-gray-900">{room.room_code}</td>
                  <td>{formatDate(room.created_at)}</td>
                  <td>
                    <div className="font-semibold">{room.player_count} joined</div>
                    <div className="text-xs">{(room.players || []).join(", ") || "No players"}</div>
                  </td>
                  <td>
                    {room.winner ? <span className="font-semibold">{room.winner.name} ({room.winner.score})</span> : <span className="text-gray-400">Not completed</span>}
                  </td>
                  <td>
                    <span className="badge badge-placed">{room.status}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteRoom(room.room_code)}
                      disabled={deletingRoom === room.room_code}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                      {deletingRoom === room.room_code ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading rooms...</div>}
        {!loading && rooms.length === 0 && <div className="p-8 text-center text-gray-500">No rooms found.</div>}
      </div>
    </Layout>
  )
}


function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

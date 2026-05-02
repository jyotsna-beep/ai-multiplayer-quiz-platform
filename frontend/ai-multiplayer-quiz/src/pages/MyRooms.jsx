import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import Background from "../components/Background"
import Navbar from "../components/Navbar"

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
      const response = await fetch(`${apiUrl}/user/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) setRooms(data.rooms || [])
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
      const response = await fetch(`${apiUrl}/user/rooms/${roomCode}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setRooms((prev) => prev.filter((room) => room.room_code !== roomCode))
        setSelectedRooms((prev) => prev.filter((code) => code !== roomCode))
      } else {
        const data = await response.json()
        alert(data.detail || data.message || "Failed to delete room")
      }
    } catch (error) {
      console.error("Failed to delete room:", error)
      alert("Failed to delete room")
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
        const response = await fetch(`${apiUrl}/user/rooms/${roomCode}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const index = remainingRooms.findIndex((room) => room.room_code === roomCode)
          if (index !== -1) {
            remainingRooms.splice(index, 1)
          }
        } else {
          const data = await response.json()
          console.warn(`Failed to delete ${roomCode}:`, data.detail || data.message)
        }
      }

      setRooms(remainingRooms)
      setSelectedRooms([])
    } catch (error) {
      console.error("Failed to delete selected rooms:", error)
      alert("Failed to delete selected rooms")
    } finally {
      setDeletingSelected(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      <Background />
      <Navbar />

      <main className="px-4 pb-10 pt-24 lg:ml-64 lg:px-6">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-950">My rooms</h1>
            <p className="mt-1 text-sm text-gray-600">Rooms you hosted or joined, with players, scores, winners, and creation dates.</p>
          </div>
          <button
            onClick={deleteSelectedRooms}
            disabled={selectedRooms.length === 0 || deletingSelected}
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deletingSelected ? "Deleting selected..." : `Delete selected (${selectedRooms.length})`}
          </button>
        </div>

        <section className="rounded-md border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rooms.length > 0 && selectedRooms.length === rooms.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Select</span>
                    </label>
                  </th>
                  <th className="px-5 py-3 font-semibold">Room</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Players</th>
                  <th className="px-5 py-3 font-semibold">Winner</th>
                  <th className="px-5 py-3 font-semibold">Scores</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rooms.map((room) => (
                  <tr key={room.room_code} className="align-top hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedRooms.includes(room.room_code)}
                          onChange={() => toggleRoomSelection(room.room_code)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-950">{room.room_code}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(room.created_at)}</td>
                    <td className="px-5 py-4 text-gray-700">
                      <div className="font-medium">{room.player_count} joined</div>
                      <div className="mt-1 text-xs text-gray-500">{(room.players || []).join(", ") || "No players recorded"}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {room.winner ? `${room.winner.name} (${room.winner.score})` : "Not completed"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {(room.scores || []).map((score) => (
                          <div key={score.name} className="flex min-w-40 justify-between gap-4 text-gray-700">
                            <span>{score.name}</span>
                            <span className="font-semibold text-gray-950">{score.score}</span>
                          </div>
                        ))}
                        {(!room.scores || room.scores.length === 0) && <span className="text-gray-500">No scores yet</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{room.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteRoom(room.room_code)}
                        disabled={deletingRoom === room.room_code}
                        className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingRoom === room.room_code ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && rooms.length === 0 && <EmptyState message="No joined rooms found yet." />}
          {loading && <EmptyState message="Loading rooms..." />}
        </section>
      </main>
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Medal, Trophy, Users } from "lucide-react"

import Background from "../components/Background"
import Navbar from "../components/Navbar"

export default function Leaderboards() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  const stats = useMemo(() => {
    const totalGames = leaderboard.reduce((sum, player) => sum + Number(player.games || 0), 0)
    const topScore = leaderboard[0]?.total_score || 0

    return [
      { label: "Players", value: leaderboard.length, icon: <Users size={17} className="text-gray-500" /> },
      { label: "Games tracked", value: totalGames, icon: <Trophy size={17} className="text-gray-500" /> },
      { label: "Top score", value: topScore, icon: <Medal size={17} className="text-gray-500" /> },
    ]
  }, [leaderboard])

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }
    fetchLeaderboard(token)
  }, [navigate])

  const fetchLeaderboard = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/leaderboards`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error("Failed to load leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      <Background />
      <Navbar />

      <main className="px-4 pb-10 pt-24 lg:ml-64 lg:px-6">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold text-gray-950">Leaderboards</h1>
          <p className="mt-1 text-sm text-gray-600">All player scores across completed quiz history.</p>
        </div>

        <div className="mb-7 grid gap-4 md:grid-cols-3">
          {stats.map(({ label, value, icon }) => (
            <section key={label} className="rounded-md border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                {icon}
              </div>
              <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
            </section>
          ))}
        </div>

        <section className="rounded-md border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-950">Global ranking</h2>
            <span className="rounded bg-[#eff6fc] px-2 py-1 text-xs font-semibold text-[#0f6cbd]">
              {loading ? "Syncing" : "Updated"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Rank</th>
                  <th className="px-5 py-3 font-semibold">Player</th>
                  <th className="px-5 py-3 font-semibold">Total score</th>
                  <th className="px-5 py-3 font-semibold">Games</th>
                  <th className="px-5 py-3 font-semibold">Wins</th>
                  <th className="px-5 py-3 font-semibold">Average</th>
                  <th className="px-5 py-3 font-semibold">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((player) => (
                  <tr key={player.name} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className="inline-flex min-w-12 items-center justify-center rounded bg-[#eff6fc] px-2 py-1 font-semibold text-[#0f6cbd]">
                        #{player.rank}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-950">{player.name}</td>
                    <td className="px-5 py-4 font-semibold text-gray-950">{player.total_score}</td>
                    <td className="px-5 py-4 text-gray-700">{player.games}</td>
                    <td className="px-5 py-4 text-gray-700">{player.wins}</td>
                    <td className="px-5 py-4 text-gray-700">{player.average_score}</td>
                    <td className="px-5 py-4 text-gray-700">{player.best_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && leaderboard.length === 0 && <EmptyState message="No leaderboard scores found yet." />}
          {loading && <EmptyState message="Loading leaderboards..." />}
        </section>
      </main>
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

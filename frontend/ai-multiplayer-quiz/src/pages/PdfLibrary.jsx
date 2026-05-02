import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import Background from "../components/Background"
import Navbar from "../components/Navbar"

function formatDate(value) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default function PdfLibrary() {
  const navigate = useNavigate()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem("token")
    if (!token) {
      navigate("/")
      return
    }
    fetchUploads(token)
  }, [navigate])

  const fetchUploads = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/user/pdf-library`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) setUploads(data.uploads || [])
    } catch (error) {
      console.error("Failed to load PDF library:", error)
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
          <h1 className="text-2xl font-semibold text-gray-950">PDF library</h1>
          <p className="mt-1 text-sm text-gray-600">PDF uploads used to generate quizzes from your account.</p>
        </div>

        <section className="rounded-md border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">File</th>
                  <th className="px-5 py-3 font-semibold">Room</th>
                  <th className="px-5 py-3 font-semibold">Uploaded</th>
                  <th className="px-5 py-3 font-semibold">Difficulty</th>
                  <th className="px-5 py-3 font-semibold">Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploads.map((upload, index) => (
                  <tr key={`${upload.room_code}-${upload.filename}-${index}`} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-950">{upload.filename}</td>
                    <td className="px-5 py-4 text-gray-700">{upload.room_code}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(upload.created_at)}</td>
                    <td className="px-5 py-4 capitalize text-gray-700">{upload.difficulty || "Not recorded"}</td>
                    <td className="px-5 py-4 text-gray-700">{upload.questions_generated || 0} generated</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && uploads.length === 0 && <EmptyState message="No PDF uploads found yet. New quiz generations will appear here." />}
          {loading && <EmptyState message="Loading PDF library..." />}
        </section>
      </main>
    </div>
  )
}

function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

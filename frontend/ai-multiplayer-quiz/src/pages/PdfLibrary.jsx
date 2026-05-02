import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { FileText, Download } from "lucide-react"

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
      const response = await fetch(`${apiUrl}/user/pdf-library?token=${token}`)
      const data = await response.json()
      if (response.ok) setUploads(data)
    } catch (error) {
      console.error("Failed to load PDF library:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="welcome-title">PDF Library</h1>
        <p className="welcome-subtitle">Documents used to generate quizzes on your account.</p>
      </div>

      <div className="card-panel">
        <div className="overflow-x-auto">
          <table className="games-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Room Code</th>
                <th>Generated At</th>
                <th>Questions</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload, index) => (
                <tr key={index}>
                  <td className="room-name-cell">
                    <FileText size={18} className="text-blue-500" />
                    <span className="font-semibold text-gray-900">Study Material</span>
                  </td>
                  <td className="font-medium">{upload.room_code}</td>
                  <td>{formatDate(upload.created_at)}</td>
                  <td>{upload.question_count || 0} items</td>
                  <td>
                    <span className="badge badge-runner-up text-capitalize">{upload.difficulty || "Medium"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-8 text-center text-gray-500">Loading documents...</div>}
        {!loading && uploads.length === 0 && (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No PDFs uploaded yet.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}


function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

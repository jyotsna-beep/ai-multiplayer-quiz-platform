import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout"
import { FileText, Download, Eye, X, ExternalLink } from "lucide-react"

function formatDate(value) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default function PdfLibrary() {
  const navigate = useNavigate()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingFile, setViewingFile] = useState(null)

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
      const response = await fetch(`${apiUrl}/user/pdfs?token=${token}`)
      const data = await response.json()
      if (response.ok) setUploads(data)
    } catch (error) {
      console.error("Failed to load PDF library:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (fileId, filename) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
    window.open(`${apiUrl}/pdf/${fileId}`, "_blank")
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="welcome-title">PDF Library</h1>
        <p className="welcome-subtitle">Direct access to your uploaded study materials.</p>
      </div>

      <div className="card-panel">
        <div className="overflow-x-auto">
          <table className="games-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload, index) => (
                <tr key={index}>
                  <td className="room-name-cell">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <span className="font-bold text-gray-900 truncate max-w-[300px]" title={upload.filename}>
                      {upload.filename}
                    </span>
                  </td>
                  <td>{formatDate(upload.created_at)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setViewingFile(upload)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        onClick={() => handleDownload(upload.file_id, upload.filename)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Scanning your library...</p>
          </div>
        )}
        
        {!loading && uploads.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Your library is empty. Start by hosting a quiz!</p>
          </div>
        )}
      </div>

      {/* PDF View Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={20} />
                <h3 className="font-black text-gray-900 truncate max-w-[400px]">{viewingFile.filename}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(viewingFile.file_id, viewingFile.filename)}
                  className="btn-action btn-secondary p-2"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={() => setViewingFile(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-200">
              <iframe 
                src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/pdf/${viewingFile.file_id}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}


function EmptyState({ message }) {
  return <div className="border-t border-gray-100 px-5 py-10 text-center text-sm text-gray-500">{message}</div>
}

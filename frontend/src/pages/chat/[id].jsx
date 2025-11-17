import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Navbar from "../../components/Navbar"
import ChatBox from "../../components/ChatBox"
import { getRequest, getCurrentUser } from "../../lib/api"

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query
  const [request, setRequest] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      const [userData, requestData] = await Promise.all([
        getCurrentUser(),
        getRequest(id)
      ])
      
      setUser(userData)
      setRequest(requestData)
    } catch (err) {
      setError(err.message || "Failed to load chat")
      if (err.message.includes("authorized")) {
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card mb-4">
          <h1 className="text-2xl font-bold mb-2">
            {request.subject} - {request.topic}
          </h1>
          <div className="text-gray-600 space-y-1">
            <p>Student: {request.studentId?.name}</p>
            <p>Tutor: {request.tutorId?.name}</p>
            <p>Status: <span className="capitalize">{request.status}</span></p>
          </div>
        </div>

        <ChatBox requestId={id} user={user} />
      </main>
    </div>
  )
}

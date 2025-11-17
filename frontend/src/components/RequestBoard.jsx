import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { getRequests, acceptRequest } from "../lib/api"

export default function RequestBoard({ user }) {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [filters, setFilters] = useState({
    subject: "",
    status: ""
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [filters])

  const loadRequests = async () => {
    try {
      const data = await getRequests(filters)
      setRequests(data.items || [])
    } catch (err) {
      console.error("Failed to load requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    if (!user?.roles?.includes("tutor")) {
      alert("Only tutors can accept requests")
      return
    }

    setActionLoading(requestId)
    try {
      const result = await acceptRequest(requestId)
      if (result.chatRoomId) {
        router.push(`/chat/${requestId}`)
      } else {
        loadRequests()
      }
    } catch (err) {
      alert(err.message || "Failed to accept request")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewChat = (requestId) => {
    router.push(`/chat/${requestId}`)
  }

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-green-100 text-green-800",
      accepted: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading requests...</div>
  }

  return (
    <div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              placeholder="Search by subject..."
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="accepted">Accepted</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No requests found
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isOwner = user?._id === request.studentId?._id
            const isTutor = user?._id === request.tutorId?._id
            const canAccept = user?.roles?.includes("tutor") && 
                             request.status === "open" && 
                             !isOwner
            const canViewChat = (isOwner || isTutor) && request.status !== "open"

            return (
              <div key={request._id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {request.subject} - {request.topic}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Posted by {request.studentId?.name}
                    </p>
                    {request.description && (
                      <p className="text-gray-700 mb-2">{request.description}</p>
                    )}
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  {request.availability && (
                    <div>📅 {request.availability}</div>
                  )}
                  {request.budget > 0 && (
                    <div>💰 ₹{request.budget}</div>
                  )}
                  {request.tutorId && (
                    <div>👨‍🏫 Tutor: {request.tutorId.name}</div>
                  )}
                </div>

                <div className="flex gap-3">
                  {canAccept && (
                    <button
                      onClick={() => handleAccept(request._id)}
                      disabled={actionLoading === request._id}
                      className="btn-primary disabled:opacity-50"
                    >
                      {actionLoading === request._id ? "Accepting..." : "Accept Request"}
                    </button>
                  )}
                  
                  {canViewChat && (
                    <button
                      onClick={() => handleViewChat(request._id)}
                      className="btn-secondary"
                    >
                      Open Chat
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Navbar from "../components/Navbar"
import RequestBoard from "../components/RequestBoard"
import { createRequest, getCurrentUser } from "../lib/api"

export default function Requests() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    description: "",
    availability: "",
    budget: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (err) {
      router.push("/login")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await createRequest({
        ...formData,
        budget: parseFloat(formData.budget) || 0
      })
      
      setFormData({
        subject: "",
        topic: "",
        description: "",
        availability: "",
        budget: ""
      })
      setShowForm(false)
      setRefreshKey(prev => prev + 1) // Trigger refresh
    } catch (err) {
      setError(err.message || "Failed to create request")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const canCreateRequest = user?.roles?.includes("student")

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Help Requests</h1>
          
          {canCreateRequest && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? "Cancel" : "+ New Request"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Request</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Mathematics"
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-sm font-medium mb-1">
                    Topic *
                  </label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Calculus"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-field"
                  placeholder="Describe what you need help with..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium mb-1">
                    Availability
                  </label>
                  <input
                    type="text"
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Weekday evenings"
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="10"
                    className="input-field"
                    placeholder="500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Request"}
              </button>
            </form>
          </div>
        )}

        <RequestBoard key={refreshKey} user={user} />
      </main>
    </div>
  )
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000"

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  
  const config = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "API request failed")
  }

  return data
}

// Auth
export async function register(name, email, password, roles = ["student"]) {
  const data = await apiCall("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, roles })
  })
  return data.user
}

export async function login(email, password) {
  const data = await apiCall("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  })
  return data.user
}

export async function logout() {
  await apiCall("/api/auth/logout", { method: "POST" })
}

export async function getCurrentUser() {
  const data = await apiCall("/api/auth/me")
  return data.user
}

// Requests
export async function getRequests(filters = {}) {
  const params = new URLSearchParams()
  if (filters.subject) params.set("subject", filters.subject)
  if (filters.status) params.set("status", filters.status)
  
  const query = params.toString() ? `?${params.toString()}` : ""
  return await apiCall(`/api/requests${query}`)
}

export async function getRequest(id) {
  const data = await apiCall(`/api/requests/${id}`)
  return data.request
}

export async function createRequest(requestData) {
  const data = await apiCall("/api/requests", {
    method: "POST",
    body: JSON.stringify(requestData)
  })
  return data.request
}

export async function acceptRequest(id) {
  const data = await apiCall(`/api/requests/${id}/accept`, {
    method: "POST"
  })
  return data
}

// Chat
export async function getMessages(requestId) {
  return await apiCall(`/api/chat/${requestId}/messages`)
}

export async function sendMessage(requestId, text) {
  const data = await apiCall(`/api/chat/${requestId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text })
  })
  return data.message
}

// Reviews
export async function createReview(reviewData) {
  const data = await apiCall("/api/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData)
  })
  return data.review
}

export async function getTutorReviews(tutorId) {
  return await apiCall(`/api/reviews/${tutorId}`)
}

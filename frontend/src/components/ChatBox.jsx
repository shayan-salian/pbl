import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import { getMessages, sendMessage } from "../lib/api"

export default function ChatBox({ requestId, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadMessages()
    connectSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [requestId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const data = await getMessages(requestId)
      setMessages(data.items || [])
    } catch (err) {
      console.error("Failed to load messages:", err)
    }
  }

  const connectSocket = () => {
    // Get token from cookie
    const token = document.cookie
      .split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1]

    if (!token) return

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_BASE}/chat`, {
      auth: { token }
    })

    newSocket.on("connect", () => {
      console.log("Connected to chat")
      setConnected(true)
      newSocket.emit("join", { requestId })
    })

    newSocket.on("message:new", (message) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from chat")
      setConnected(false)
    })

    setSocket(newSocket)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    const messageText = newMessage.trim()
    setNewMessage("")

    try {
      if (socket && connected) {
        // Send via socket for real-time
        socket.emit("message:send", {
          requestId,
          text: messageText
        })
      } else {
        // Fallback to REST API
        await sendMessage(requestId, messageText)
        await loadMessages()
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      alert("Failed to send message")
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="card flex flex-col h-[600px]">
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-xl font-semibold">Chat</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId?._id === user?._id || msg.senderId === user?._id
            
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.senderId?.name || 'Unknown'}
                  </div>
                  <div className="break-words">{msg.text}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="btn-primary disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

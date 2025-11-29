import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";
import Video from 'twilio-video'; 
import { getMessages, sendMessage } from "../lib/api";

const messageVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

// --- NEW IMPORTS: Notes/File Management Components ---
import NotesUpload from './NotesUpload'; 
import NotesBrowser from './NotesBrowser'; 

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;


export default function ChatBox({ requestId, user }) {
    // --- CHAT STATE ---
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
    const messagesEndRef = useRef(null);
  const hasConnectedRef = useRef(false); // prevent multiple socket connections

    // --- VIDEO CALL STATE ---
    const [activeRoom, setActiveRoom] = useState(null)
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)

    // --- NOTES/FILE STATE ---
    const [showNotes, setShowNotes] = useState(false); 


    // --- EFFECT: Load messages and connect to Socket.io on component mount ---
    useEffect(() => {
        loadMessages()
        connectSocket()

        return () => {
            if (socket) {
                socket.disconnect()
            }
            if (activeRoom) {
                activeRoom.disconnect();
            }
        }
    }, [requestId])

    // --- EFFECT: Scroll to bottom whenever messages update ---
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // --- CHAT FUNCTIONS ---

    const loadMessages = async () => {
        try {
            const data = await getMessages(requestId)
            setMessages(data.items || [])
        } catch (err) {
            console.error("Failed to load messages:", err)
        }
    }

    const connectSocket = () => {
        // Get token from cookie (for Socket.io authentication)
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
    
    // --- VIDEO CALL FUNCTION ---

    const handleCall = async () => {
        if (activeRoom) {
            // If already connected, disconnect and clean up
            activeRoom.disconnect();
            return;
        }

        const identity = user?.name || user?._id; 
        const roomName = requestId; 

        try {
            // 1. Fetch the token from your backend endpoint
            const url = `${API_BASE}/twilio/token?identity=${identity}&room=${roomName}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ error: response.statusText }));
                 throw new Error(errorData.error || 'Failed to fetch Twilio token.');
            }
            
            const data = await response.json();
            const token = data.token;

            // 2. Connect to the Twilio Video Room
            const room = await Video.connect(token, {
                name: roomName,
                audio: true, 
                video: { width: 320 } 
            });

            setActiveRoom(room);
            console.log(`Successfully joined Twilio Room: ${roomName}`);

            // Attach local tracks
            room.localParticipant.tracks.forEach(publication => {
                if (publication.track) {
                    localVideoRef.current.appendChild(publication.track.attach());
                }
            });

            // Handle remote participants joining
            room.on('participantConnected', participant => {
                console.log(`Participant '${participant.identity}' connected`);
                participant.on('trackSubscribed', track => {
                    remoteVideoRef.current.appendChild(track.attach());
                });
            });

            // Handle disconnection logic
            room.on('disconnected', () => {
                setActiveRoom(null);
                localVideoRef.current.innerHTML = '';
                remoteVideoRef.current.innerHTML = '';
                alert('Call disconnected.');
            });

        } catch (error) {
            console.error('Twilio connection failed:', error);
            setActiveRoom(null);
            alert(`Could not start video call: ${error.message}`);
        }
    }

    // --- UTILITY ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

    return (
        <div className="card flex h-[600px] gap-4">
            
            {/* ------------------------------------- */}
            {/* LEFT COLUMN: CHAT AND MESSAGES */}
            {/* ------------------------------------- */}
            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h2 className="text-xl font-semibold">Chat</h2>
                    
                    <div className="flex items-center gap-2">
                        
                        {/* NOTES TOGGLE BUTTON */}
                        <button
                            onClick={() => setShowNotes(prev => !prev)}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${showNotes ? 'bg-gray-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                            {showNotes ? 'Hide Files' : 'Show Files'}
                        </button>
                        
                        {/* CALL BUTTON
                        <button
                            onClick={handleCall}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${activeRoom ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                            disabled={!connected && !activeRoom}
                        >
                            {activeRoom ? 'End Call' : 'Start Call'}
                        </button> */}
                        
                        {/* CONNECTION STATUS */}
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-600">
                            {connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                {/* VIDEO CONTAINER */}
                {activeRoom && (
                    <div className="mb-4 p-2 border rounded-lg bg-black flex justify-between gap-2">
                        <div ref={localVideoRef} className="w-1/2 h-32 bg-gray-700 rounded overflow-hidden">
                            <h4 className="text-white text-xs p-1">Your Video</h4>
                        </div>
                        <div ref={remoteVideoRef} className="w-1/2 h-32 bg-gray-700 rounded overflow-hidden">
                            <h4 className="text-white text-xs p-1">Partner Video</h4>
                        </div>
                    </div>
                )}

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


            {/* ------------------------------------- */}
            {/* RIGHT COLUMN: NOTES/FILE MANAGER */}
            {/* ------------------------------------- */}
            {showNotes && (
                <div className="w-72 flex-shrink-0 border-l pl-4 overflow-y-auto">
                    <h3 className="text-xl font-semibold mb-4">File Management</h3>
                    
                    {/* FILE UPLOAD COMPONENT */}
                    <NotesUpload apiBase={API_BASE} />

                    {/* FILE BROWSER COMPONENT */}
                    <NotesBrowser apiBase={API_BASE} />
                </div>
            )}
        </div>
    )
}

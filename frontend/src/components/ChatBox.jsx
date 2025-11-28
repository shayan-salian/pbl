import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";
import { getMessages, sendMessage } from "../lib/api";

const messageVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

export default function ChatBox({ requestId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const hasConnectedRef = useRef(false); // prevent multiple socket connections

  useEffect(() => {
    loadMessages();

    if (!hasConnectedRef.current) {
      connectSocket();
      hasConnectedRef.current = true;
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await getMessages(requestId);
      setMessages(data.items || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const connectSocket = () => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    console.log("[ChatBox] cookie:", document.cookie);
    console.log("[ChatBox] token:", token);

    if (!token) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_BASE}/chat`, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("[ChatBox] socket connected");
      setConnected(true);
      newSocket.emit("join", { requestId });
    });

    newSocket.on("connect_error", (err) => {
      console.error("[ChatBox] connect_error:", err.message);
    });

    newSocket.on("error", (error) => {
      console.error("[ChatBox] server error event:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[ChatBox] socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("message:new", (message) => {
      console.log("[ChatBox] message:new", message._id);
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("typing:user", ({ userId }) => {
      if (userId !== user?._id) {
        setTypingUser(userId);
      }
    });

    newSocket.on("typing:stop", ({ userId }) => {
      if (userId === typingUser) {
        setTypingUser(null);
      }
    });

    setSocket(newSocket);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      if (socket && connected) {
        socket.emit("message:send", {
          requestId,
          text: messageText,
        });
      } else {
        await sendMessage(requestId, messageText);
        await loadMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message");
    }
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    if (!socket || !connected) return;
    socket.emit("typing:start", { requestId });
    // small delay to send stop event
    setTimeout(() => {
      socket.emit("typing:stop", { requestId });
    }, 800);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="card flex h-[520px] flex-col md:h-[600px]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-slate-100">Chat room</h2>
          <p className="text-[11px] text-slate-400">
            Coordinate details, share explanations, and close the session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
          <span className="text-[11px] text-slate-400">
            {connected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No messages yet. Say hi and break the ice!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn =
              msg.senderId?._id === user?._id || msg.senderId === user?._id;
            const name =
              typeof msg.senderId === "object"
                ? msg.senderId?.name || "User"
                : isOwn
                ? "You"
                : "Peer";

            return (
              <motion.div
                key={msg._id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    isOwn
                      ? "bg-primary-500 text-white"
                      : "bg-slate-800 text-slate-50 border border-slate-700/70"
                  }`}
                >
                  <div className="mb-0.5 text-[10px] font-medium opacity-75">
                    {name}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                  <div className="mt-0.5 text-[9px] opacity-70">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        {typingUser && (
          <div className="flex justify-start">
            <div className="rounded-full bg-slate-800/70 px-3 py-1 text-[10px] text-slate-300">
              Typing…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="mt-3 flex items-end gap-2 border-t border-slate-800 pt-3"
      >
        <textarea
          rows={1}
          value={newMessage}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message…"
          className="input-field min-h-[40px] max-h-[80px] resize-none text-xs"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="btn-primary text-xs px-3 py-2 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}


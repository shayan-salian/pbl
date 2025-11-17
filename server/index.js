import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initChatSocket } from "./socket/chat.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Initialize chat socket handlers
initChatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Socket.io server ready`);
});

export default server;
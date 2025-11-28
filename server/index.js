import http from "http";
import { Server } from "socket.io";
import app from "./app.js"; // Your Express app instance
import { initChatSocket } from "./socket/chat.js";
import connectDB from "./config/db.js"; // Starts the connection
import dotenv from "dotenv";
import mongoose from "mongoose"; // <<< NEW CRITICAL IMPORT
import twilioRouter from "./routes/twilio.js";
// Do NOT import notesRouter here

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start the asynchronous DB connection FIRST.
connectDB();

// Create HTTP server & Socket.io (these can start immediately)
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

initChatSocket(io);

// Mount Twilio Router (does not need DB connection)
app.use('/twilio', twilioRouter);


// --- CRITICAL FIX: Dynamically load file routes and start server ONLY after DB is ready ---
mongoose.connection.on('connected', async () => {
    try {
        // 1. Dynamically import the notes router *only now* //    (The routes/notes.js file will now load when Mongoose is connected)
        const { default: notesRouter } = await import("./routes/notes.js");
        
        // 2. Mount the Notes/File router
        app.use('/api/notes', notesRouter);
        
        // 3. Start the server listener
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            console.log(`📡 Socket.io server ready`);
            console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        });

    } catch (error) {
        console.error("Failed to initialize notes router or start server:", error);
        // Ensure server stops if initialization fails
        process.exit(1); 
    }
});

// Handle connection errors
mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
});


export default server;
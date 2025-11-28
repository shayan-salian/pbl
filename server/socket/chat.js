import Message from "../models/Message.js";
import Request from "../models/Request.js";
import jwt from "jsonwebtoken";

export const initChatSocket = (io) => {
  const chatNamespace = io.of("/chat");

  // Socket.io middleware for authentication
  chatNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  chatNamespace.on("connection", (socket) => {
    console.log(`✅ User ${socket.userId} connected to chat`);

    // Join room for a specific request (used by both text + video)
    socket.on("join", async ({ requestId }) => {
      try {
        if (!requestId) {
          return socket.emit("error", { message: "Request ID required" });
        }

        // Verify user is part of this request
        const request = await Request.findById(requestId);

        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;

        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized" });
        }

        socket.join(requestId);
        socket.emit("joined", { requestId });
        console.log(`User ${socket.userId} joined room ${requestId}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ---------------- TEXT CHAT (existing) ----------------

    // Send message
    socket.on("message:send", async ({ requestId, text }) => {
      try {
        if (!requestId || !text) {
          return socket.emit("error", {
            message: "Request ID and text required",
          });
        }

        // Verify user is part of this request
        const request = await Request.findById(requestId);

        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;

        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized" });
        }

        // Create message
        const message = await Message.create({
          requestId,
          senderId: socket.userId,
          text: text.trim(),
        });

        await message.populate("senderId", "name email");

        // Emit to all users in the room
        chatNamespace.to(requestId).emit("message:new", {
          _id: message._id,
          requestId: message.requestId,
          senderId: message.senderId,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Typing indicator
    socket.on("typing:start", ({ requestId }) => {
      if (!requestId) return;
      socket.to(requestId).emit("typing:user", { userId: socket.userId });
    });

    socket.on("typing:stop", ({ requestId }) => {
      if (!requestId) return;
      socket.to(requestId).emit("typing:stop", { userId: socket.userId });
    });

    // ---------------- WEBRTC SIGNALING (NEW) ----------------
    // All events are scoped to a requestId room and only between
    // the student and tutor already validated in `join`.

    // Offer from caller -> other peer in same room
    socket.on("webrtc:offer", async ({ requestId, offer }) => {
      try {
        if (!requestId || !offer) return;

        const request = await Request.findById(requestId);
        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;
        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized for call" });
        }

        // Relay offer to other participant in the room
        socket.to(requestId).emit("webrtc:offer", {
          fromUserId: socket.userId,
          offer,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Answer from callee -> caller
    socket.on("webrtc:answer", async ({ requestId, answer }) => {
      try {
        if (!requestId || !answer) return;

        const request = await Request.findById(requestId);
        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;
        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized for call" });
        }

        socket.to(requestId).emit("webrtc:answer", {
          fromUserId: socket.userId,
          answer,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ICE candidate exchange
    socket.on("webrtc:ice-candidate", async ({ requestId, candidate }) => {
      try {
        if (!requestId || !candidate) return;

        const request = await Request.findById(requestId);
        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;
        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized for call" });
        }

        socket.to(requestId).emit("webrtc:ice-candidate", {
          fromUserId: socket.userId,
          candidate,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Hang up
    socket.on("webrtc:call:hangup", async ({ requestId }) => {
      try {
        if (!requestId) return;

        const request = await Request.findById(requestId);
        if (!request) {
          return socket.emit("error", { message: "Request not found" });
        }

        const isStudent = request.studentId.toString() === socket.userId;
        const isTutor =
          request.tutorId && request.tutorId.toString() === socket.userId;
        if (!isStudent && !isTutor) {
          return socket.emit("error", { message: "Not authorized for call" });
        }

        socket.to(requestId).emit("webrtc:call:hangup", {
          fromUserId: socket.userId,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.userId} disconnected from chat`);
    });
  });
};

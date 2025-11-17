import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  text: {
    type: String,
    required: [true, "Message text is required"],
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"]
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
messageSchema.index({ requestId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);


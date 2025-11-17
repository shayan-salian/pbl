import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    index: true
  },
  topic: {
    type: String,
    required: [true, "Topic is required"],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
    default: ""
  },
  availability: {
    type: String,
    default: ""
  },
  budget: {
    type: Number,
    min: [0, "Budget cannot be negative"],
    default: 0
  },
  status: {
    type: String,
    enum: ["open", "accepted", "in-progress", "completed", "cancelled"],
    default: "open",
    index: true
  },
  chatRoomId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for filtering
requestSchema.index({ subject: 1, status: 1, createdAt: -1 });
requestSchema.index({ studentId: 1, status: 1 });
requestSchema.index({ tutorId: 1, status: 1 });

export default mongoose.model("Request", requestSchema);


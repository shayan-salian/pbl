import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  comment: {
    type: String,
    maxlength: [500, "Comment cannot exceed 500 characters"],
    default: ""
  }
}, {
  timestamps: true
});

// Ensure one review per student-tutor-request combination
reviewSchema.index({ studentId: 1, tutorId: 1, requestId: 1 }, { unique: true });
reviewSchema.index({ tutorId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);



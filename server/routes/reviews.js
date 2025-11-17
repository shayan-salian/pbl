import express from "express";
import { body, param } from "express-validator";
import Review from "../models/Review.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create review for tutor
// @access  Private (Student)
router.post(
  "/",
  protect,
  authorize("student"),
  [
    body("tutorId").isMongoId().withMessage("Valid tutor ID required"),
    body("requestId").isMongoId().withMessage("Valid request ID required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().trim().isLength({ max: 500 })
  ],
  validate,
  async (req, res) => {
    try {
      const { tutorId, requestId, rating, comment } = req.body;
      
      // Verify request exists and is completed
      const request = await Request.findById(requestId);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      // Check if student owns this request
      if (request.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized"
        });
      }
      
      // Check if request is completed
      if (request.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only review completed requests"
        });
      }
      
      // Check if tutor matches
      if (request.tutorId.toString() !== tutorId) {
        return res.status(400).json({
          success: false,
          message: "Tutor ID does not match request"
        });
      }
      
      // Check for existing review
      const existingReview = await Review.findOne({
        studentId: req.user._id,
        tutorId,
        requestId
      });
      
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this tutor for this request"
        });
      }
      
      // Create review
      const review = await Review.create({
        tutorId,
        studentId: req.user._id,
        requestId,
        rating,
        comment
      });
      
      // Update tutor rating
      const tutor = await User.findById(tutorId);
      await tutor.updateRating(rating);
      
      await review.populate("studentId tutorId", "name email");
      
      res.status(201).json({
        success: true,
        review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   GET /api/reviews/:tutorId
// @desc    Get reviews for a tutor
// @access  Public
router.get(
  "/:tutorId",
  param("tutorId").isMongoId().withMessage("Invalid tutor ID"),
  validate,
  async (req, res) => {
    try {
      const { tutorId } = req.params;
      
      const reviews = await Review.find({ tutorId })
        .populate("studentId", "name")
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        items: reviews,
        total: reviews.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;

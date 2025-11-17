import express from "express";
import { body, param, query } from "express-validator";
import Request from "../models/Request.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/requests
// @desc    Get all requests with filters
// @access  Private
router.get(
  "/",
  protect,
  [
    query("subject").optional().trim(),
    query("status").optional().isIn(["open", "accepted", "in-progress", "completed", "cancelled"]),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("skip").optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res) => {
    try {
      const { subject, status, limit = 20, skip = 0 } = req.query;
      
      // Build filter
      const filter = {};
      if (subject) filter.subject = new RegExp(subject, 'i');
      if (status) filter.status = status;
      
      // Get requests
      const requests = await Request.find(filter)
        .populate("studentId", "name email")
        .populate("tutorId", "name email ratingAvg")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));
      
      const total = await Request.countDocuments(filter);
      
      res.json({
        success: true,
        items: requests,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   POST /api/requests
// @desc    Create new request
// @access  Private (Student)
router.post(
  "/",
  protect,
  authorize("student"),
  [
    body("subject").trim().notEmpty().withMessage("Subject is required"),
    body("topic").trim().notEmpty().withMessage("Topic is required"),
    body("description").optional().trim(),
    body("availability").optional().trim(),
    body("budget").optional().isFloat({ min: 0 }).withMessage("Budget must be a positive number")
  ],
  validate,
  async (req, res) => {
    try {
      const { subject, topic, description, availability, budget } = req.body;
      
      const request = await Request.create({
        studentId: req.user._id,
        subject,
        topic,
        description,
        availability,
        budget
      });
      
      await request.populate("studentId", "name email");
      
      res.status(201).json({
        success: true,
        request
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   GET /api/requests/:id
// @desc    Get single request
// @access  Private
router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid request ID"),
  validate,
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id)
        .populate("studentId", "name email")
        .populate("tutorId", "name email subjects ratingAvg");
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      res.json({
        success: true,
        request
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   PATCH /api/requests/:id
// @desc    Update request
// @access  Private (Owner)
router.patch(
  "/:id",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid request ID"),
    body("subject").optional().trim(),
    body("topic").optional().trim(),
    body("description").optional().trim(),
    body("availability").optional().trim(),
    body("budget").optional().isFloat({ min: 0 })
  ],
  validate,
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      // Check ownership
      if (request.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this request"
        });
      }
      
      // Only allow updates if status is open
      if (request.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "Cannot update request that is not open"
        });
      }
      
      const allowedUpdates = ["subject", "topic", "description", "availability", "budget"];
      const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
      
      updates.forEach(update => {
        request[update] = req.body[update];
      });
      
      await request.save();
      
      res.json({
        success: true,
        request
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   DELETE /api/requests/:id
// @desc    Delete request
// @access  Private (Owner)
router.delete(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid request ID"),
  validate,
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      // Check ownership
      if (request.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this request"
        });
      }
      
      await request.deleteOne();
      
      res.json({
        success: true,
        message: "Request deleted successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   POST /api/requests/:id/accept
// @desc    Tutor accepts request
// @access  Private (Tutor)
router.post(
  "/:id/accept",
  protect,
  authorize("tutor"),
  param("id").isMongoId().withMessage("Invalid request ID"),
  validate,
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      // Check if request is open
      if (request.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "Request is not available"
        });
      }
      
      // Check if tutor is trying to accept their own request
      if (request.studentId.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot accept your own request"
        });
      }
      
      // Update request
      request.tutorId = req.user._id;
      request.status = "accepted";
      request.chatRoomId = request._id.toString();
      
      await request.save();
      await request.populate("studentId tutorId", "name email");
      
      res.json({
        success: true,
        request,
        chatRoomId: request.chatRoomId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   POST /api/requests/:id/complete
// @desc    Mark request as completed
// @access  Private (Student or Tutor)
router.post(
  "/:id/complete",
  protect,
  param("id").isMongoId().withMessage("Invalid request ID"),
  validate,
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      // Check if user is student or tutor of this request
      const isStudent = request.studentId.toString() === req.user._id.toString();
      const isTutor = request.tutorId && request.tutorId.toString() === req.user._id.toString();
      
      if (!isStudent && !isTutor) {
        return res.status(403).json({
          success: false,
          message: "Not authorized"
        });
      }
      
      request.status = "completed";
      await request.save();
      
      res.json({
        success: true,
        request
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

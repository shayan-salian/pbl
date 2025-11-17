import express from "express";
import { param, body } from "express-validator";
import Message from "../models/Message.js";
import Request from "../models/Request.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/chat/:requestId/messages
// @desc    Get all messages for a request
// @access  Private
router.get(
  "/:requestId/messages",
  protect,
  param("requestId").isMongoId().withMessage("Invalid request ID"),
  validate,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Verify user is part of this request
      const request = await Request.findById(requestId);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      const isStudent = request.studentId.toString() === req.user._id.toString();
      const isTutor = request.tutorId && request.tutorId.toString() === req.user._id.toString();
      
      if (!isStudent && !isTutor) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view these messages"
        });
      }
      
      // Get messages
      const messages = await Message.find({ requestId })
        .populate("senderId", "name email")
        .sort({ createdAt: 1 });
      
      res.json({
        success: true,
        items: messages
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   POST /api/chat/:requestId/messages
// @desc    Create new message
// @access  Private
router.post(
  "/:requestId/messages",
  protect,
  [
    param("requestId").isMongoId().withMessage("Invalid request ID"),
    body("text").trim().notEmpty().withMessage("Message text is required")
      .isLength({ max: 2000 }).withMessage("Message too long")
  ],
  validate,
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { text } = req.body;
      
      // Verify user is part of this request
      const request = await Request.findById(requestId);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Request not found"
        });
      }
      
      const isStudent = request.studentId.toString() === req.user._id.toString();
      const isTutor = request.tutorId && request.tutorId.toString() === req.user._id.toString();
      
      if (!isStudent && !isTutor) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to send messages"
        });
      }
      
      // Create message
      const message = await Message.create({
        requestId,
        senderId: req.user._id,
        text
      });
      
      await message.populate("senderId", "name email");
      
      res.status(201).json({
        success: true,
        message
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

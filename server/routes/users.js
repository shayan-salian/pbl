import express from "express";
import { param, body } from "express-validator";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get(
  "/:id",
  param("id").isMongoId().withMessage("Invalid user ID"),
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// @route   PATCH /api/users/profile
// @desc    Update own profile
// @access  Private
router.patch(
  "/profile",
  protect,
  [
    body("name").optional().trim().notEmpty(),
    body("bio").optional().trim().isLength({ max: 500 }),
    body("subjects").optional().isArray(),
    body("availability").optional().trim()
  ],
  validate,
  async (req, res) => {
    try {
      const allowedUpdates = ["name", "bio", "subjects", "availability"];
      const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
      
      const user = await User.findById(req.user._id);
      
      updates.forEach(update => {
        user[update] = req.body[update];
      });
      
      await user.save();
      
      res.json({
        success: true,
        user
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

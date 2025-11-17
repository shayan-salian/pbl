import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Request from "../models/Request.js";
import Message from "../models/Message.js";
import Review from "../models/Review.js";

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
    
    // Clear existing data
    await User.deleteMany({});
    await Request.deleteMany({});
    await Message.deleteMany({});
    await Review.deleteMany({});
    console.log("🗑️  Cleared existing data");
    
    // Create users
    const users = await User.create([
      {
        name: "Alice Student",
        email: "alice@example.com",
        password: "password123",
        roles: ["student"]
      },
      {
        name: "Bob Tutor",
        email: "bob@example.com",
        password: "password123",
        roles: ["tutor"],
        subjects: ["Mathematics", "Physics"],
        bio: "Experienced tutor with 5 years of teaching",
        ratingAvg: 4.5,
        ratingCount: 10
      },
      {
        name: "Carol Both",
        email: "carol@example.com",
        password: "password123",
        roles: ["student", "tutor"],
        subjects: ["Chemistry", "Biology"],
        bio: "Graduate student offering tutoring in sciences"
      },
      {
        name: "David Tutor",
        email: "david@example.com",
        password: "password123",
        roles: ["tutor"],
        subjects: ["Computer Science", "Programming"],
        bio: "Software engineer helping students with coding",
        ratingAvg: 4.8,
        ratingCount: 15
      }
    ]);
    
    console.log("👥 Created users");
    
    // Create requests
    const requests = await Request.create([
      {
        studentId: users[0]._id,
        subject: "Mathematics",
        topic: "Calculus - Derivatives",
        description: "Need help understanding chain rule and implicit differentiation",
        availability: "Weekday evenings",
        budget: 500,
        status: "open"
      },
      {
        studentId: users[0]._id,
        tutorId: users[1]._id,
        subject: "Physics",
        topic: "Mechanics - Kinematics",
        description: "Struggling with projectile motion problems",
        availability: "Weekend mornings",
        budget: 600,
        status: "accepted",
        chatRoomId: "placeholder"
      },
      {
        studentId: users[2]._id,
        subject: "Computer Science",
        topic: "Data Structures - Trees",
        description: "Binary search trees and AVL trees",
        availability: "Flexible",
        budget: 800,
        status: "open"
      },
      {
        studentId: users[0]._id,
        tutorId: users[3]._id,
        subject: "Programming",
        topic: "Python - Object Oriented Programming",
        description: "Classes, inheritance, and polymorphism",
        availability: "Evenings",
        budget: 700,
        status: "completed",
        chatRoomId: "placeholder2"
      }
    ]);
    
    // Update chatRoomIds
    requests[1].chatRoomId = requests[1]._id.toString();
    requests[3].chatRoomId = requests[3]._id.toString();
    await requests[1].save();
    await requests[3].save();
    
    console.log("📝 Created requests");
    
    // Create messages
    const messages = await Message.create([
      {
        requestId: requests[1]._id,
        senderId: users[0]._id,
        text: "Hi! Thanks for accepting my request."
      },
      {
        requestId: requests[1]._id,
        senderId: users[1]._id,
        text: "Happy to help! When would you like to start?"
      },
      {
        requestId: requests[1]._id,
        senderId: users[0]._id,
        text: "Tomorrow evening works for me if that's okay?"
      },
      {
        requestId: requests[3]._id,
        senderId: users[0]._id,
        text: "Could you explain inheritance in Python?"
      },
      {
        requestId: requests[3]._id,
        senderId: users[3]._id,
        text: "Sure! Inheritance allows a class to inherit attributes and methods from another class..."
      }
    ]);
    
    console.log("💬 Created messages");
    
    // Create reviews
    const reviews = await Review.create([
      {
        tutorId: users[3]._id,
        studentId: users[0]._id,
        requestId: requests[3]._id,
        rating: 5,
        comment: "Excellent tutor! Very patient and explained concepts clearly."
      }
    ]);
    
    console.log("⭐ Created reviews");
    
    console.log("\n✅ Database seeded successfully!");
    console.log("\n📧 Test Credentials:");
    console.log("Student: alice@example.com / password123");
    console.log("Tutor: bob@example.com / password123");
    console.log("Both: carol@example.com / password123");
    console.log("Tutor: david@example.com / password123\n");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedData();

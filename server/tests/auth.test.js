import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/User.js";

const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  roles: ["student"]
};

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/studybuddy-test";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Cleanup
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty("_id");
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty("token");
    });
    
    it("should not register user with existing email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already exists");
    });
    
    it("should validate required fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "invalid" })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });
  
  describe("POST /api/auth/login", () => {
    it("should login existing user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty("token");
    });
    
    it("should reject invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword"
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid credentials");
    });
  });
});

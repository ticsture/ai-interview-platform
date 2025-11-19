const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");



dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);


// Health check route
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState; 
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.status(200).json({
    status: "ok",
    dbState,
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

// Connect MongoDB then start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
  });

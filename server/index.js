// Express server (optional backend) used for potential persistence and stats aggregation.
// Frontend currently stores sessions in localStorage; this server scaffolds future expansion.
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");



dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // server port (defaults to 4000)
const MONGODB_URI = process.env.MONGODB_URI; // Mongo Atlas / local connection string

// Global middleware
app.use(cors()); // allow cross-origin requests from frontend dev server
app.use(express.json()); // parse JSON bodies

// Route registration (question CRUD & attempt tracking)
const questionRoutes = require("./routes/questionRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);


// Health check: returns server status & mongoose connection state
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState; 
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.status(200).json({
    status: "ok",
    dbState,
  });
});

// Root route: simple message for base path
app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

// Connect MongoDB then start server
// Connect to Mongo then start listening
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

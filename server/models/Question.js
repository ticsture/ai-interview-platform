const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,    // e.g. "DSA", "WebDev", "Java"
    },
    subtopic: {
      type: String, // e.g. "if statements", "loops", optional for legacy questions
      default: null,
    },
    questionText: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    createdBy: {
      type: String,   // future: store user IDs
      default: "system",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);

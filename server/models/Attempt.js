const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    subtopic: {
      type: String,
      default: null, // optional; recorded to compute subtopic coverage
    },
    wasCorrect: {
      type: Boolean,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      default: null, // can be null if we don't track yet
    },
    // later: userId, notes, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attempt", attemptSchema);

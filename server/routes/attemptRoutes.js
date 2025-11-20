const express = require("express");
const Attempt = require("../models/Attempt"); // stores each answer outcome
const Question = require("../models/Question"); // referenced to derive topic/subtopic

const router = express.Router();

// POST /api/attempts
// Body: { questionId, wasCorrect, timeTakenSeconds?, subtopic? }
// Persists a single answer attempt for analytics; currently not invoked by quiz UI.
router.post("/", async (req, res) => {
  try {
    const { questionId, wasCorrect, timeTakenSeconds, subtopic } = req.body;

    if (!questionId || typeof wasCorrect !== "boolean") {
      return res.status(400).json({
        error: "questionId and wasCorrect are required",
      });
    }

    // Find the question to get its topic
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const attempt = new Attempt({
      questionId,
      topic: question.topic,
      subtopic: subtopic || question.subtopic || null,
      wasCorrect,
      timeTakenSeconds,
    });

    const saved = await attempt.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating attempt:", err);
    res.status(500).json({ error: "Failed to create attempt" });
  }
});

// GET /api/attempts (list attempts) with optional ?topic filter
router.get("/", async (req, res) => {
  try {
    const { topic } = req.query;

    const filter = {};
    if (topic) {
      filter.topic = topic;
    }

    const attempts = await Attempt.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .populate("questionId", "questionText topic difficulty");

    res.json(attempts);
  } catch (err) {
    console.error("Error fetching attempts:", err);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});
// GET /api/attempts/stats
// Aggregated metrics per topic (+ optional per-subtopic breakdown when includeSubtopics=true)
router.get("/stats", async (req, res) => {
  try {
    const { topic, includeSubtopics } = req.query;

    const matchStage = topic ? { topic } : {};

    const basePipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$topic",
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ["$wasCorrect", 1, 0] } },
          avgTimeSeconds: { $avg: "$timeTakenSeconds" },
          distinctSubtopics: { $addToSet: "$subtopic" },
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id",
          totalAttempts: 1,
          correctAttempts: 1,
          avgTimeSeconds: 1,
          coveredSubtopics: {
            $filter: {
              input: "$distinctSubtopics",
              as: "s",
              cond: { $ne: ["$$s", null] },
            },
          },
        },
      },
      { $sort: { topic: 1 } },
    ];

    const stats = await Attempt.aggregate(basePipeline);

    if (includeSubtopics === "true" && topic) {
      // Per-subtopic breakdown for provided topic
      const subtopicPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              topic: "$topic",
              subtopic: "$subtopic",
            },
            totalAttempts: { $sum: 1 },
            correctAttempts: { $sum: { $cond: ["$wasCorrect", 1, 0] } },
            avgTimeSeconds: { $avg: "$timeTakenSeconds" },
          },
        },
        {
          $project: {
            _id: 0,
            topic: "$_id.topic",
            subtopic: "$_id.subtopic",
            totalAttempts: 1,
            correctAttempts: 1,
            avgTimeSeconds: 1,
          },
        },
        { $sort: { subtopic: 1 } },
      ];
      const subtopicStats = await Attempt.aggregate(subtopicPipeline);
      return res.json({ topics: stats, subtopics: subtopicStats });
    }

    res.json(stats);
  } catch (err) {
    console.error("Error computing stats:", err);
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

module.exports = router;

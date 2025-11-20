const express = require("express");
const Question = require("../models/Question"); // Mongoose model for stored questions

const router = express.Router();

// CREATE question: basic endpoint to add a manual question (future expansion)
router.post("/", async (req, res) => {
  try {
    const { topic, questionText, difficulty } = req.body;

    const question = new Question({
      topic,
      questionText,
      difficulty,
    });

    const saved = await question.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET questions: optional topic filter (used for browsing / admin tooling)
router.get("/", async (req, res) => {
  try {
    const { topic } = req.query;
    let filter = {};

    if (topic) filter.topic = topic;

    const questions = await Question.find(filter);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

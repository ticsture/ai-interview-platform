"use client";

import { useEffect, useState } from "react";

type Question = {
  _id: string;
  topic: string;
  questionText: string;
  difficulty: string;
  createdAt: string;
  updatedAt: string;
};

import { API_BASE } from "@/lib/config";

const TOPICS = ["All", "DSA", "WebDev", "Java"];
const DIFFICULTIES = ["easy", "medium", "hard"];

export default function QuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // "Add Question" form state
  const [formTopic, setFormTopic] = useState<string>("DSA");
  const [formDifficulty, setFormDifficulty] = useState<string>("medium");
  const [formText, setFormText] = useState<string>("");

  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function loadQuestions(topic: string) {
    try {
      setLoading(true);
      setError(null);

      const query =
        topic === "All" ? "" : `?topic=${encodeURIComponent(topic)}`;

      const res = await fetch(`${API_BASE}/api/questions${query}`);

      if (!res.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadQuestions("All");
  }, []);

  // reload when filter changes
  useEffect(() => {
    loadQuestions(selectedTopic);
  }, [selectedTopic]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();

    if (!formText.trim()) {
      setSaveMessage("Question text cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage(null);

      const res = await fetch(`${API_BASE}/api/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formTopic,
          questionText: formText,
          difficulty: formDifficulty,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save question");
      }

      const saved = await res.json();

      setFormText("");
      setFormDifficulty("medium");
      setSaveMessage("Question added successfully ✅");

      if (selectedTopic === "All" || selectedTopic === saved.topic) {
        await loadQuestions(selectedTopic);
      }
    } catch (err: any) {
      setSaveMessage(err.message || "Error saving question");
    } finally {
      setSaving(false);
    }
  }

  // 🔥 NOTE: no more full-screen wrappers here.
  // Layout & background come from app/layout.tsx
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50 mb-2">
          Questions
        </h1>
        <p className="text-sm text-zinc-400">
          Create and filter interview questions stored in MongoDB.
        </p>
      </div>

      {/* Topic Filter */}
      <div className="flex w-full flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-300">
            Filter by topic:
          </label>
          <select
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-zinc-500">
          {questions.length} question{questions.length === 1 ? "" : "s"} found
        </span>
      </div>

      {/* Add Question Form */}
      <section className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
        <h2 className="mb-3 text-base font-semibold text-zinc-50">
          Add a new question
        </h2>
        <form className="space-y-3" onSubmit={handleAddQuestion}>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-zinc-400">Topic</label>
              <select
                className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
              >
                {TOPICS.filter((t) => t !== "All").map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-zinc-400">Difficulty</label>
              <select
                className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                value={formDifficulty}
                onChange={(e) => setFormDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Question text</label>
            <textarea
              className="min-h-[80px] rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="Type the interview question here..."
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Question"}
            </button>
            {saveMessage && (
              <span className="text-xs text-zinc-400">
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Loading / Error / List */}
      {loading && (
        <p className="text-zinc-400 text-sm">Loading...</p>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4">Error: {error}</p>
      )}

      {!loading && !error && questions.length === 0 && (
        <p className="text-zinc-400 text-sm">
          No questions found for this topic. Try adding some via the form above.
        </p>
      )}

      {!loading && !error && questions.length > 0 && (
        <ul className="w-full space-y-3">
          {questions.map((q) => (
            <li
              key={q._id}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-left"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-zinc-400">
                  {q.topic}
                </span>
                <span className="text-xs rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-200">
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm text-zinc-100">{q.questionText}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

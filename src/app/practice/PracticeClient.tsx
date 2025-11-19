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

const TOPICS = ["DSA", "WebDev", "Java"];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function PracticeClient() {
  const [selectedTopic, setSelectedTopic] = useState<string>("DSA");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [seconds, setSeconds] = useState<number>(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError(null);
      setInfoMessage(null);

      const res = await fetch(
        `${API_BASE}/api/questions?topic=${encodeURIComponent(selectedTopic)}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch questions for practice");
      }

      const data: Question[] = await res.json();

      if (data.length === 0) {
        setQuestions([]);
        setCurrentIndex(0);
        setError("No questions found for this topic. Add some first.");
        return;
      }

      const shuffled = shuffle(data);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setSeconds(0);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (questions.length === 0) return;

    setSeconds(0);

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, questions.length]);

  const currentQuestion =
    questions.length > 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  async function recordAttempt(wasCorrect: boolean) {
    if (!currentQuestion) return;

    try {
      setInfoMessage(null);

      const res = await fetch(`${API_BASE}/api/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          wasCorrect,
          timeTakenSeconds: seconds,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to record attempt");
      }

      setInfoMessage(
        wasCorrect
          ? "Marked as correct and saved ✅"
          : "Marked as incorrect and saved ❌"
      );
    } catch (err: any) {
      setInfoMessage(err.message || "Error recording attempt");
    }
  }

  async function handleAnswer(wasCorrect: boolean) {
    await recordAttempt(wasCorrect);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setInfoMessage("End of questions for this topic 🎉");
    }
  }

  function handleSkip() {
    setInfoMessage("Question skipped.");
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setInfoMessage("No more questions to skip in this topic.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50 mb-2">
          Practice Mode
        </h1>
        <p className="text-sm text-zinc-400">
          Load questions by topic, then mark each answer as correct or wrong while we
          track your time and attempts.
        </p>
      </div>

      {/* Topic selection + Load button */}
      <div className="mb-2 flex w-full flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Topic:</label>
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

        <button
          onClick={loadQuestions}
          disabled={loading}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load Questions"}
        </button>
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-400">{error}</p>
      )}

      {infoMessage && (
        <p className="mb-2 text-xs text-zinc-400">{infoMessage}</p>
      )}

      {currentQuestion && (
        <section className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              {currentQuestion.topic} • {currentQuestion.difficulty}
            </span>
            <span className="text-xs text-zinc-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <p className="mb-4 text-sm text-zinc-100">
            {currentQuestion.questionText}
          </p>

          <div className="mb-3 text-xs text-zinc-400">
            Time on this question: {seconds}s
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAnswer(true)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500"
            >
              I answered it correctly ✅
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500"
            >
              I answered it wrong ❌
            </button>
            <button
              onClick={handleSkip}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
            >
              Skip
            </button>
          </div>
        </section>
      )}

      {!currentQuestion && !loading && !error && (
        <p className="text-sm text-zinc-400">
          No questions loaded yet. Choose a topic and click{" "}
          <span className="font-semibold">"Load Questions"</span>.
        </p>
      )}
    </div>
  );
}

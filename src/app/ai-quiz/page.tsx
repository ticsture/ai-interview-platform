"use client";

/**
 * AiQuizPage: Generates and runs an AI-created multiple-choice quiz.
 * User chooses topic + difficulty + question count, then we POST to /api/quiz/generate.
 * The API returns canonical subtopics and ordered questions.
 * State summary:
 *   topic/difficultyLevel/numQuestions: configuration inputs
 *   quiz: current quiz payload (null until generated)
 *   coveredSubtopics: set of subtopics answered so far
 *   remainingSubtopics: outstanding subtopics for continuation generation
 *   currentIndex: pointer into quiz.questions
 *   selectedIndex: chosen answer for current question (null before selection)
 *   isCorrect: correctness of the selected answer
 *   score: count of correct answers
 *   loading/error: network and validation states
 * Core flows:
 *   handleStartQuiz -> initial generation
 *   handleSelectOption -> answer + mark coverage
 *   handleNextQuestion -> advance / finish
 *   generateNextSubset -> request only remainingSubtopics
 *   handleRestart -> full reset
 */
import { useState } from "react";

// Difficulty categories forwarded to backend prompt
type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// Shape of an individual MCQ returned by AI
type QuizQuestion = {
  subtopic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

// Full quiz payload including canonical subtopics order
type QuizData = {
  topic: string;
  difficultyLevel: DifficultyLevel;
  allSubtopics?: string[];
  questions: QuizQuestion[];
};

export default function AiQuizPage() {
  const [topic, setTopic] = useState("");
  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>("beginner");
  const [numQuestions, setNumQuestions] = useState(5);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [coveredSubtopics, setCoveredSubtopics] = useState<Set<string>>(new Set());
  const [remainingSubtopics, setRemainingSubtopics] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStarted = quiz !== null;
  const questions = quiz?.questions ?? [];
  const currentQuestion =
    questions.length > 0 && currentIndex < questions.length
      ? questions[currentIndex]
      : null;

  // Validate form and request initial quiz from API
  async function handleStartQuiz(e: React.FormEvent) {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (numQuestions < 3 || numQuestions > 15) {
      setError("Number of questions must be between 3 and 15.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuiz(null);
    setCoveredSubtopics(new Set());
    setRemainingSubtopics([]);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsCorrect(null);
    setScore(0);

    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficultyLevel,
          numQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Failed to generate quiz. Please try again."
        );
      }

      const data: QuizData = await res.json();
      setQuiz(data);
      const allSubs = data.allSubtopics || [];
      setRemainingSubtopics(allSubs);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setIsCorrect(null);
      setScore(0);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Record answer selection; compute correctness; update coverage
  function handleSelectOption(index: number) {
    if (!currentQuestion) return;
    if (selectedIndex !== null) return; // already answered

    setSelectedIndex(index);
    const correct = index === currentQuestion.correctIndex;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
    }
    // Mark subtopic as covered once answered (regardless of correctness)
    setCoveredSubtopics((prev) => {
      const next = new Set(prev);
      if (currentQuestion.subtopic) next.add(currentQuestion.subtopic);
      // Update remaining list
      if (quiz?.allSubtopics) {
        setRemainingSubtopics(
          quiz.allSubtopics.filter((s) => !next.has(s))
        );
      }
      return next;
    });
  }

  // Advance pointer or finalize quiz state
  function handleNextQuestion() {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsCorrect(null);
    } else {
      // End of quiz
      setSelectedIndex(null);
      setIsCorrect(null);
    }
  }

  // Request a new quiz limited to remaining subtopics (continuation flow)
  async function generateNextSubset() {
    if (!quiz || remainingSubtopics.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quiz.topic,
          difficultyLevel: quiz.difficultyLevel,
          numQuestions,
          remainingSubtopics,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate next quiz segment.");
      }
      const data: QuizData = await res.json();
      setQuiz(data);
      setCurrentIndex(0);
      setSelectedIndex(null);
      setIsCorrect(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Full reset to initial form state
  function handleRestart() {
    setQuiz(null);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setIsCorrect(null);
    setScore(0);
    setError(null);
    setCoveredSubtopics(new Set());
    setRemainingSubtopics([]);
  }

  // Derived boolean: quiz is fully answered
  const quizFinished =
    hasStarted && currentIndex === questions.length - 1 && selectedIndex !== null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50 mb-2">
          AI Quiz Mode
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Enter a topic, choose your level, and let the AI generate a quiz for
          you. For beginners, we assume you know nothing and build your concepts
          slowly. For intermediate/advanced, questions get more tricky and
          detailed.
        </p>
      </div>

      {/* Configuration form */}
      {!hasStarted && (
        <form
          onSubmit={handleStartQuiz}
          className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. HTML, CSS, JavaScript, Operating Systems..."
                className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) =>
                  setDifficultyLevel(e.target.value as DifficultyLevel)
                }
                className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="beginner">Beginner (start from scratch)</option>
                <option value="intermediate">
                  Intermediate (you know the basics)
                </option>
                <option value="advanced">
                  Advanced (deep/tricky questions)
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">
                Number of questions
              </label>
              <input
                type="number"
                min={3}
                max={15}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-24 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Generating quiz..." : "Start quiz"}
          </button>
        </form>
      )}

      {/* Quiz UI */}
      {hasStarted && quiz && (
        <section className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                Topic: <span className="font-medium text-zinc-200">{quiz.topic}</span> • Level:{" "}
                <span className="font-medium text-zinc-200">{quiz.difficultyLevel}</span>
              </span>
              <span>
                Question {currentIndex + 1} of {questions.length} • Score: {score}
              </span>
            </div>
            {quiz.allSubtopics && quiz.allSubtopics.length > 0 && (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
                <p className="mb-2 text-xs font-medium text-zinc-300">Subtopic coverage</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {quiz.allSubtopics.map((s) => {
                    const done = coveredSubtopics.has(s);
                    return (
                      <div
                        key={s}
                        className={`flex items-center gap-2 rounded px-2 py-1 border ${done ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-zinc-700 bg-zinc-950 text-zinc-400"}`}
                      >
                        <span className="truncate">{s}</span>
                        {done && <span>✔</span>}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-zinc-400">
                  {coveredSubtopics.size} / {quiz.allSubtopics.length} subtopics covered ({Math.round((coveredSubtopics.size / quiz.allSubtopics.length) * 100)}%)
                </p>
              </div>
            )}
          </div>

          {currentQuestion && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-400 flex justify-between">
                <span>{currentQuestion.subtopic}</span>
                <span>{currentIndex + 1} / {questions.length}</span>
              </div>
              <p className="mb-4 text-sm text-zinc-100">
                {currentQuestion.question}
              </p>

            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedIndex === idx;
                const isAnswerCorrect =
                  selectedIndex !== null &&
                  idx === currentQuestion.correctIndex;
                const isAnswerWrong =
                  selectedIndex !== null &&
                  idx === selectedIndex &&
                  !isAnswerCorrect;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={selectedIndex !== null}
                    className={[
                      "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                      "border-zinc-700 bg-zinc-950 hover:bg-zinc-900",
                      selectedIndex !== null && !isSelected
                        ? "opacity-80"
                        : "",
                      isAnswerCorrect
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "",
                      isAnswerWrong
                        ? "border-rose-500 bg-rose-500/10"
                        : "",
                    ].join(" ")}
                  >
                    <span className="mr-2 text-xs text-zinc-400">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

              {selectedIndex !== null && (
              <div className="mt-4 space-y-2">
                <p
                  className={`text-sm ${
                    isCorrect ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isCorrect ? "Correct! ✅" : "Incorrect. ❌"}
                </p>
                <p className="text-xs text-zinc-300">
                  {currentQuestion.explanation}
                </p>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="mt-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
                >
                  {currentIndex < questions.length - 1
                    ? "Next question"
                    : "Finish quiz"}
                </button>
              </div>
              )}
            </div>
          )}

          {quizFinished && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-200">
              <p className="mb-2 font-medium">
                Quiz finished! 🎉
              </p>
              <p className="mb-3">
                You scored {score} out of {questions.length}.
              </p>
              {quiz.allSubtopics && (
                <p className="mb-3 text-xs text-zinc-400">
                  Coverage: {coveredSubtopics.size} / {quiz.allSubtopics.length} subtopics ({Math.round((coveredSubtopics.size / quiz.allSubtopics.length) * 100)}%).
                  {remainingSubtopics.length > 0 && " You can continue with remaining subtopics."}
                </p>
              )}
              <button
                type="button"
                onClick={handleRestart}
                className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-medium text-black hover:bg-emerald-400"
              >
                Play again
              </button>
              {remainingSubtopics.length > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={generateNextSubset}
                  className="ml-2 rounded-full border border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-900 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Continue remaining subtopics"}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.href = "/stats"}
                className="ml-2 rounded-full border border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
              >
                View stats
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

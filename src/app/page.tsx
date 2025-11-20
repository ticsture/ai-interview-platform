"use client";
import { useState } from "react";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type QuizQuestion = {
  subtopic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
type QuizData = {
  topic: string;
  difficultyLevel: DifficultyLevel;
  allSubtopics?: string[];
  questions: QuizQuestion[];
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("beginner");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ subtopic: string; correct: boolean }[]>([]);
  const [coveredSubtopics, setCoveredSubtopics] = useState<Set<string>>(new Set());
  const [remainingSubtopics, setRemainingSubtopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStarted = quiz !== null;
  const questions = quiz?.questions ?? [];
  const currentQuestion = questions.length > 0 && currentIndex < questions.length ? questions[currentIndex] : null;
  const quizFinished = hasStarted && currentIndex === questions.length - 1 && selectedIndex !== null;

  async function startQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError("Enter a topic to begin."); return; }
    if (numQuestions < 3 || numQuestions > 15) { setError("Questions must be 3-15."); return; }
    setLoading(true); setError(null); setQuiz(null); setCurrentIndex(0); setSelectedIndex(null); setIsCorrect(null); setScore(0); setCoveredSubtopics(new Set()); setRemainingSubtopics([]);
    try {
      const res = await fetch("/api/quiz/generate", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ topic: topic.trim(), difficultyLevel, numQuestions }) });
      if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.error || "Failed to generate quiz."); }
      const data: QuizData = await res.json();
      setQuiz(data); setRemainingSubtopics(data.allSubtopics || []);
    } catch (err:any) { setError(err.message || "Unknown error"); } finally { setLoading(false); }
  }

  function selectOption(idx: number) {
    if (!currentQuestion || selectedIndex !== null) return;
    setSelectedIndex(idx); const correct = idx === currentQuestion.correctIndex; setIsCorrect(correct); if (correct) setScore(s=>s+1);
    setResults(r => [...r, { subtopic: currentQuestion.subtopic, correct }]);
    setCoveredSubtopics(prev => { const next = new Set(prev); if (currentQuestion.subtopic) next.add(currentQuestion.subtopic); if (quiz?.allSubtopics) setRemainingSubtopics(quiz.allSubtopics.filter(s=>!next.has(s))); return next; });
  }

  function nextQuestion() {
    if (!quiz) return; if (currentIndex < questions.length - 1) { setCurrentIndex(i=>i+1); setSelectedIndex(null); setIsCorrect(null); } else { /* end */ }
  }

  async function continueRemaining() {
    if (!quiz || remainingSubtopics.length === 0) return; setLoading(true); setError(null);
    try {
      const res = await fetch("/api/quiz/generate", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ topic: quiz.topic, difficultyLevel: quiz.difficultyLevel, numQuestions, remainingSubtopics }) });
      if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.error || "Failed to load remaining subtopics."); }
      const data: QuizData = await res.json(); setQuiz(data); setCurrentIndex(0); setSelectedIndex(null); setIsCorrect(null);
    } catch (err:any) { setError(err.message || "Unknown error"); } finally { setLoading(false); }
  }

  function restart() { setQuiz(null); setCurrentIndex(0); setSelectedIndex(null); setIsCorrect(null); setScore(0); setError(null); setCoveredSubtopics(new Set()); setRemainingSubtopics([]); setResults([]); }

  function finalizeQuiz() {
    if (!quiz) return;
    const coverageTotal = quiz.allSubtopics?.length || 0;
    const coverageDone = coveredSubtopics.size;
    const coveragePercent = coverageTotal > 0 ? Math.round((coverageDone / coverageTotal) * 100) : 0;
    const session = {
      timestamp: Date.now(),
      topic: quiz.topic,
      level: quiz.difficultyLevel,
      score,
      total: questions.length,
      percent: Math.round((score / questions.length) * 100),
      coveragePercent,
      coverageDone,
      coverageTotal,
      results,
      subtopics: quiz.allSubtopics || [],
    };
    try {
      const existing = JSON.parse(localStorage.getItem("quizHistory") || "[]");
      existing.unshift(session); // latest first
      localStorage.setItem("quizHistory", JSON.stringify(existing.slice(0,50))); // cap history
      localStorage.setItem("lastQuizSession", JSON.stringify(session));
    } catch {}
    window.location.href = "/stats";
  }

  return (
    <div className="min-h-screen flex flex-col gap-8 py-8 px-6">
      {/* Top row: description + subtopic progress */}
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <header className="space-y-4 flex-1 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> AI-powered adaptive interview quiz
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Master <span className="text-emerald-400">{topic || "your topics"}</span> with dynamic AI quizzes.
          </h1>
          <p className="max-w-xl text-sm text-zinc-300 leading-relaxed">
            This platform generates structured multiple-choice quizzes, tracks which subtopics you have covered, and lets you progressively conquer the rest. Enter a topic ("Java", "JavaScript", etc.), choose a level, and start instantly.
          </p>
        </header>
        <aside className="w-full lg:w-80 xl:w-96 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-3">Subtopic Progress</h2>
            {!quiz && (
              <p className="text-xs text-zinc-400">Start a quiz to see dynamically generated subtopics here.</p>
            )}
            {quiz?.allSubtopics && (
              <ul className="space-y-1 text-xs">
                {quiz.allSubtopics.map(s => {
                  const done = coveredSubtopics.has(s);
                  const isCurrent = currentQuestion?.subtopic === s;
                  return (
                    <li
                      key={s}
                      className={[
                        "flex items-center gap-2 px-2 py-1 rounded transition-colors",
                        done ? "text-emerald-400" : isCurrent ? "text-zinc-200 bg-zinc-800/40 ring-1 ring-emerald-500/30" : "text-zinc-500",
                      ].join(" ")}
                    >
                      <span className="text-[10px] w-3 text-center">
                        {done ? "✓" : isCurrent ? "↳" : "•"}
                      </span>
                      <span className="truncate">{s}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {quiz?.allSubtopics && (
              <p className="mt-3 text-[10px] text-zinc-500">{coveredSubtopics.size}/{quiz.allSubtopics.length} covered • {Math.round((coveredSubtopics.size / quiz.allSubtopics.length)*100)}%</p>
            )}
          </div>
        </aside>
      </div>
      {!hasStarted && (
        <form onSubmit={startQuiz} className="relative group w-full max-w-none">
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-400/10 to-emerald-500/10 blur-xl opacity-40 group-hover:opacity-60 transition" />
          <div className="flex items-stretch gap-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-lg w-full">
            <input
              value={topic}
              onChange={e=>setTopic(e.target.value)}
              placeholder="Quiz on Java, JavaScript, HTML, OS..."
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-zinc-500"
            />
            <select
              value={difficultyLevel}
              onChange={e=>setDifficultyLevel(e.target.value as DifficultyLevel)}
              className="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input
              type="number"
              min={3}
              max={15}
              value={numQuestions}
              onChange={e=>setNumQuestions(Number(e.target.value))}
              className="w-28 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="#"
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-md bg-emerald-500 px-8 py-3 text-sm font-medium text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Generating..." : "Start"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
          {topic && !error && (
            <p className="mt-2 text-[11px] text-zinc-500">Press Enter ↵ to start</p>
          )}
        </form>
      )}
      <div className="flex flex-col lg:flex-row gap-10 flex-1 w-full">
        {/* Question section */}
        <div className="flex-1 space-y-8">

        {hasStarted && currentQuestion && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="space-x-1">
                <span>Topic:</span> <span className="font-medium text-zinc-200">{quiz?.topic}</span> • <span>Level:</span> <span className="font-medium text-zinc-200">{quiz?.difficultyLevel}</span>
              </span>
              <span>Q {currentIndex + 1}/{questions.length} • Score {score}</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="mb-2 text-[10px] uppercase tracking-wide text-zinc-400 flex justify-between">
                <span>{currentQuestion.subtopic}</span>
                <span>{currentIndex + 1}/{questions.length}</span>
              </div>
              <p className="mb-4 text-sm text-zinc-100">{currentQuestion.question}</p>
              <div className="space-y-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isAnswerCorrect = selectedIndex !== null && idx === currentQuestion.correctIndex;
                  const isAnswerWrong = selectedIndex !== null && idx === selectedIndex && !isAnswerCorrect;
                  return (
                    <button key={idx} type="button" onClick={()=>selectOption(idx)} disabled={selectedIndex !== null} className={["w-full rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer", "border-zinc-700 bg-zinc-950 hover:bg-zinc-900", selectedIndex !== null && !isSelected ? "opacity-80" : "", isAnswerCorrect ? "border-emerald-500 bg-emerald-500/10" : "", isAnswerWrong ? "border-rose-500 bg-rose-500/10" : ""].join(" ")}> <span className="mr-2 text-xs text-zinc-400">{String.fromCharCode(65+idx)}.</span>{opt}</button>
                  );
                })}
              </div>
              {selectedIndex !== null && (
                <div className="mt-4 space-y-2">
                  <p className={`text-sm ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>{isCorrect ? "Correct! ✅" : "Incorrect. ❌"}</p>
                  <p className="text-xs text-zinc-300">{currentQuestion.explanation}</p>
                  <button onClick={currentIndex < questions.length -1 ? nextQuestion : finalizeQuiz} className="mt-2 rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900 cursor-pointer">{currentIndex < questions.length -1 ? "Next question" : "Finish & Stats"}</button>
                </div>
              )}
            </div>
            {quizFinished && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-200 space-y-3">
                <p className="font-medium">Quiz finished! 🎉</p>
                <p>You scored {score} / {questions.length} ({Math.round((score / questions.length)*100)}%).</p>
                {quiz?.allSubtopics && (
                  <p className="text-xs text-zinc-400">Coverage: {coveredSubtopics.size} / {quiz.allSubtopics.length} ({Math.round((coveredSubtopics.size / quiz.allSubtopics.length)*100)}%).</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={finalizeQuiz} className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-medium text-black hover:bg-emerald-400 cursor-pointer">View Stats</button>
                  {remainingSubtopics.length > 0 && <button onClick={continueRemaining} disabled={loading} className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-900 disabled:opacity-50 cursor-pointer">{loading?"Loading...":"More subtopics"}</button>}
                  <button onClick={restart} className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-900 cursor-pointer">Restart</button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

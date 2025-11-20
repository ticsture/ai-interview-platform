"use client";
import { useEffect, useState } from "react";

type SessionSummary = {
  timestamp: number;
  topic: string;
  level: string;
  score: number;
  total: number;
  percent: number;
  coveragePercent: number;
  coverageDone: number;
  coverageTotal: number;
  results?: { subtopic: string; correct: boolean }[];
  subtopics?: string[];
};

export default function StatsPage() {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const last = localStorage.getItem("lastQuizSession");
      if (last) setSession(JSON.parse(last));
      const hist = localStorage.getItem("quizHistory");
      if (hist) setHistory(JSON.parse(hist));
    } catch {}
  }, []);

  const overallAveragePercent = history.length > 0 ? Math.round(history.reduce((a,s)=>a+s.percent,0)/history.length) : null;
  const bestPercent = history.length > 0 ? Math.max(...history.map(s=>s.percent)) : null;
  const sparkValues = history.slice(0,10).map(s=>s.percent).reverse();
  const tier = session ? getTier(session.percent) : null;

  function clearHistory() {
    localStorage.removeItem("quizHistory");
    localStorage.removeItem("lastQuizSession");
    setHistory([]); setSession(null);
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Your Stats</h1>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-xs rounded-full border border-zinc-700 px-3 py-1 hover:bg-zinc-800">Clear History</button>
          )}
        </div>
        {!session && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm">
            <p>No quiz session yet. Finish a quiz to see stats.</p>
          </div>
        )}
        {session && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Latest Session</p>
                <h2 className="text-lg font-medium flex items-center gap-2">{session.topic} • {session.level} {tier && <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">{tier}</span>}</h2>
              </div>
              <span className="text-xs text-zinc-400">{new Date(session.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <Metric label="Score" value={`${session.score}/${session.total}`} percent={session.percent} />
              <Metric label="Accuracy" value={session.percent + '%'} percent={session.percent} />
              <Metric label="Coverage" value={`${session.coverageDone}/${session.coverageTotal}`} percent={session.coveragePercent} />
              <Metric label="Coverage %" value={session.coveragePercent + '%'} percent={session.coveragePercent} />
            </div>
            {session.results && session.subtopics && session.subtopics.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">Subtopic Coverage</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {session.subtopics.map(st => {
                    const answered = session.results!.some(r=>r.subtopic===st);
                    const correct = session.results!.some(r=>r.subtopic===st && r.correct);
                    return (
                      <div key={st} className={["rounded-md px-2 py-1 text-[10px] truncate border", answered ? (correct?"border-emerald-500 bg-emerald-500/10 text-emerald-300":"border-rose-500 bg-rose-500/10 text-rose-300") : "border-zinc-700 bg-zinc-800/40 text-zinc-500"].join(" ")}>{st}</div>
                    );
                  })}
                </div>
              </div>
            )}
            {overallAveragePercent !== null && (
              <div className="text-xs text-zinc-400 flex flex-wrap gap-4 items-center">
                <span>Average: {overallAveragePercent}%</span>
                <span>Best: {bestPercent}%</span>
                <span>Sessions: {history.length}</span>
                {sparkValues.length > 1 && <Sparkline values={sparkValues} />}
                <button onClick={copySummary} className="ml-auto text-[10px] rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800">Copy</button>
              </div>
            )}
          </div>
        )}
        {history.length > 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
            <p className="text-sm font-medium">Recent Sessions</p>
            <ul className="space-y-2 text-xs">
              {history.slice(0,10).map(h => (
                <li key={h.timestamp} onClick={()=>setSession(h)} className="flex items-center justify-between border border-zinc-800/60 rounded-md px-3 py-2 cursor-pointer hover:bg-zinc-800/60">
                  <span className="truncate">{h.topic} • {h.level}</span>
                  <span className="text-zinc-400">{h.score}/{h.total} ({h.percent}%)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Practice attempts table removed per request */}
      </div>
    </div>
  );
}

function Metric({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-sm font-medium">{value}</p>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(percent,100)}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 100);
  const pts = values.map((v,i)=>`${i*(100/(values.length-1))},${100 - (v/max)*100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-6 w-24">
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function getTier(percent: number) {
  if (percent < 40) return "Novice";
  if (percent < 65) return "Improving";
  if (percent < 85) return "Pro";
  return "Expert";
}

function copySummary() {
  try {
    const last = localStorage.getItem("lastQuizSession");
    if (!last) return;
    const s: SessionSummary = JSON.parse(last);
    const text = `Quiz Session: ${s.topic} (${s.level})\nScore: ${s.score}/${s.total} (${s.percent}%)\nCoverage: ${s.coverageDone}/${s.coverageTotal} (${s.coveragePercent}%)`;
    navigator.clipboard.writeText(text);
  } catch {}
}

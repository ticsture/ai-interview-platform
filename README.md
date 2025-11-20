<div align="center">
<h1>AI Interview / Study Quiz Platform</h1>
<p><strong>Adaptive, AI‑generated multiple‑choice quizzes with subtopic tracking, mastery analytics, and fast retry workflows.</strong></p>
<p>
<img alt="Tech" src="https://img.shields.io/badge/Next.js-16-black" />
<img alt="React" src="https://img.shields.io/badge/React-19-149ECA" />
<img alt="Express" src="https://img.shields.io/badge/Express-5-lightgrey" />
<img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248" />
<img alt="Groq" src="https://img.shields.io/badge/AI-Groq_API-10b981" />
</p>
</div>

## Table of Contents
1. Overview  
2. Core Features  
3. High‑Level Architecture  
4. Data Model  
5. Quiz Generation & Logic  
6. Keyboard Shortcuts  
7. Environment Variables  
8. Installation & Development  
9. API Endpoints (Server)  
10. Session Persistence & Analytics  
11. Retry & Mastery Mechanisms  
12. Roadmap  
13. Contributing  
14. License / Usage Notes  

## 1. Overview
This project provides an adaptive study & interview preparation experience. Specify a topic (e.g. “Java”, “HTML”, “Operating Systems”) and a difficulty level. The system calls an AI model (via Groq API) to generate a structured quiz: ordered subtopics, multiple‑choice questions (MCQ) with one correct answer, detailed correct answer reasoning, and concise per‑option distractor explanations. Progress and mastery for each subtopic are tracked locally, enabling targeted retries of only missed material.

## 2. Core Features
- **AI‑Generated Structured Quizzes:** Model returns canonical `allSubtopics` plus question set with enforced schema.
- **Series‑Wise Ordering:** Questions appear in the exact canonical subtopic sequence for the first run; retry & continuation flows preserve order.
- **Subtopic Progress Panel:** Live coverage count + mastery badges updated per attempt.
- **Persistent Outcome Coloring:** Latest outcome per subtopic (✓ green / ✗ red) persists across retries until corrected.
- **Retry Missed Only:** Regenerates a quiz scoped strictly to subtopics previously answered incorrectly—no extra noise.
- **Per‑Option Distractor Explanations:** Each answer choice (correct & incorrect) displays a compact rationale.
- **Stats Dashboard:** Latest session metrics (Score, Accuracy, Coverage, Coverage %) + tier badge (Novice → Expert), sparkline of recent performance, selectable history.
- **Local History (Privacy‑Friendly):** Sessions stored in `localStorage` (capped to recent 50) rather than a backend persistence layer for user performance.
- **Keyboard Shortcuts:** Rapid navigation (answer, next, restart, stats) for efficient drilling.
- **Adaptive Continuation:** “More subtopics” resumes remaining canonical subtopics not yet covered.

## 3. High‑Level Architecture
```
ai-interview-platform/
├─ src/app/               # Next.js App Router (frontend UI & API routes)
│  ├─ page.tsx            # Quiz UI & logic
│  ├─ stats/page.tsx      # Stats dashboard client component
│  └─ api/quiz/generate/  # Serverless route calling Groq
├─ server/                # Express + Mongoose (optional persistence layer)
│  ├─ index.js            # Express bootstrap
│  ├─ models/             # Attempt & Question schemas
│  └─ routes/             # attemptRoutes.js, questionRoutes.js
├─ public/                # Static assets
├─ lib/config.ts          # Shared configuration helpers
└─ README.md
```
Frontend uses Next.js (App Router) & React; backend (optional) uses Express + Mongoose for future server‑side attempt logging. Currently, quiz performance is stored client‑side for user privacy and low friction.

## 4. Data Model
### Generated Quiz Shape (AI Response)
```ts
type QuizQuestion = {
	subtopic: string;
	question: string;
	options: string[];          // exactly 4
	correctIndex: number;       // 0..3
	explanation: string;        // multi-sentence correct rationale
	distractorExplanations?: string[]; // length === options
};
type QuizData = {
	topic: string;
	difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
	allSubtopics: string[];     // canonical ordered list (8–15 typical)
	questions: QuizQuestion[];  // length = numQuestions
};
```
### Local Session Object (Stored in `localStorage`)
```ts
{
	timestamp: number,
	topic: string,
	level: string,
	score: number,
	total: number,
	percent: number,            // (score/total)*100
	coveragePercent: number,    // covered / canonical total
	coverageDone: number,
	coverageTotal: number,
	results: { subtopic: string; correct: boolean }[],
	subtopics: string[],        // canonical list
	subtopicStats: { subtopic: string; attempts: number; correct: number }[]
}
```

## 5. Quiz Generation & Logic
The route `src/app/api/quiz/generate/route.ts` orchestrates a call to the Groq Chat Completions API. Key safeguards:
- **Model Allowlist & Fallback:** Tries env override, then ordered list; handles decommissioned model errors gracefully.
- **Strict JSON Enforcement:** System prompt instructs model to output only JSON in defined schema—no markdown/backticks.
- **Canonical Subtopic Preservation:** First quiz stores a fixed ordered list (`fullSubtopics`); subsequent retries/continuations reuse it (avoids denominator drift in coverage metrics).
- **Focus / Retry Mode:** When retrying, request includes `focusSubtopics` & `existingSubtopics` so the model returns only missed content while maintaining canonical list.
- **Series Sorting Robustness:** Client normalizes and matches subtopic names (case, spacing, minor variations) to prevent misordered “first” topic anomalies.

## 6. Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Enter | Start quiz (when form filled) |
| 1–9 | Select option (if unanswered) |
| N | Next question (after answering) |
| R | Restart quiz |
| S | Finish (if last answered) & view Stats |

## 7. Environment Variables
Create `.env.local` (frontend) and `server/.env` (backend) as needed.
```
GROQ_API_KEY=your_groq_key_here      # Required for AI quiz generation
GROQ_MODEL=llama-3.1-8b-instant      # Optional override (falls back if absent)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000   # If needed for client fetch abstraction
```
Never commit real keys. Provide sample / placeholder values only.

## 8. Installation & Development
### Prerequisites
- Node.js 18+ recommended
- MongoDB (local or Atlas) if using the Express server persistence layer

### Frontend (Next.js)
```bash
git clone <repo-url>
cd ai-interview-platform
pnpm install   # or npm install / yarn / bun
pnpm dev       # starts Next.js on http://localhost:3000
```

### Backend (Express + Mongoose) Optional
```bash
cd server
pnpm install   # or npm/yarn
pnpm dev       # starts server (default port in index.js, e.g. 4000)
```

## 9. API Endpoints (Express Server)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/questions` | (Future) List stored questions |
| POST | `/questions` | (Future) Add question |
| GET | `/attempts/stats` | Aggregated attempt stats (topic/subtopic) |
| POST | `/attempts` | Record an attempt (extension point) |

The AI quiz generation itself lives in Next.js App Router (`/api/quiz/generate`).

## 10. Session Persistence & Analytics
- Session objects stored client‑side (`localStorage`) for fast, private iteration.
- Stats page (`/stats`) computes: score, accuracy, coverage, tier classification, sparkline (last ≤10 sessions), and shows subtopic verdict coloring.
- History trimmed to latest 50 sessions to prevent unbounded growth.

## 11. Retry & Mastery Mechanisms
- **Missed Tracking:** Any incorrect answer adds subtopic to `missedSubtopics`; later correct answers remove it.
- **Retry Missed Button:** Generates questions only for current `missedSubtopics` (bounded by requested `numQuestions`).
- **Mastery Badge:** Percentage = `correct/attempts` per subtopic; 100% styled distinctly.
- **Persistent Outcome Coloring:** A `lastOutcome` map keeps subtopics red until answered correctly in a subsequent attempt.
- **Continuation (“More subtopics”):** Generates only uncovered canonical subtopics not yet attempted.

## 12. Roadmap
- Server‑side attempt logging integration for longitudinal analytics.
- Adaptive difficulty scaling based on mastery & response latency.
- Spaced repetition scheduling & revision mode.
- Export / import history & anonymized shareable performance snapshots.
- Achievement system (streaks, mastery tiers beyond Expert).
- Accessibility improvements (ARIA roles for answer buttons, focus ring refinement).
- Optional shuffle mode toggle (current default: series order).

## 13. Contributing
1. Fork & clone the repository.  
2. Create a feature branch: `git checkout -b feat/<short-name>`  
3. Install dependencies (frontend + optional server).  
4. Run lint: `npm run lint` and ensure no errors.  
5. Submit a PR with a clear description (problem, solution, screenshots if UI).  
6. Keep changes focused; avoid unrelated refactors.  

### Code Style & Practices
- Keep functions small & purpose‑driven in client components.
- Preserve existing state variable semantics (`fullSubtopics`, `missedSubtopics`, `lastOutcome`).
- Avoid committing environment secrets or generated build artifacts.

## 14. License / Usage Notes
This project is provided without a specific open‑source license declared. Until a license is added, treat the code as all‑rights‑reserved by the author. If you plan external distribution or commercial use, add or request an explicit license (e.g., MIT). AI generated content should be validated for accuracy before using it in high‑stakes interview preparation.

---
### Quick Start Recap
```bash
# Frontend
pnpm install
echo "GROQ_API_KEY=YOUR_KEY" > .env.local
pnpm dev

# Optional backend
cd server
pnpm install
echo "MONGODB_URI=mongodb://localhost:27017/quiz" > .env
pnpm dev
```
Visit `http://localhost:3000`, enter a topic, pick a difficulty, and press Enter to begin. Use number keys to answer, `N` for next, `R` to restart, and `S` to finish & view stats.

---
### Support / Questions
Open an issue for bugs or enhancement requests. Provide steps to reproduce, expected vs actual behavior, and environment details.

Enjoy mastering topics with adaptive AI quizzes! 🚀

# Documentation Index

This folder holds extended reference docs not always appropriate for the root `README.md`. GitHub will render this file when you open the `docs/` directory.

## File Map & Non-Commentable Configs

This section explains the purpose of every top-level file, especially those where inline comments are limited or disallowed (JSON formats).

### Root
- `package.json`: Node/Next.js dependencies + scripts. (JSON cannot have comments.)
- `tsconfig.json`: TypeScript compiler options (strictness, module resolution). Adjust here when changing build behavior.
- `next.config.ts`: Next.js framework configuration (React compiler enabled).
- `postcss.config.mjs`: PostCSS plugin pipeline (Tailwind). Extend with autoprefixer / cssnano if needed.
- `eslint.config.mjs`: ESLint presets + explicit ignore patterns.
- `.env.local`: Developer machine env overrides (never commit secrets). Provides `NEXT_PUBLIC_API_BASE_URL` and Groq API keys (server side usage only).

### App Directory (`src/app`)
- `layout.tsx`: Global HTML skeleton, navigation bar, footer, font & global styles import.
- `globals.css`: Base CSS variables + Tailwind import + dark mode adjustments.
- `page.tsx`: Main quiz page handling generation, answering, continuation, retry, stats navigation.
- `ai-quiz/page.tsx`: Alternate quiz generation mode with subtopic coverage tracking.
- `practice/page.tsx` + `PracticeClient.tsx`: Load topic-specific questions, self-mark attempts, track per-question time.
- `questions/page.tsx` + `QuestionsClient.tsx`: CRUD interface for adding and listing stored questions.
- `stats/page.tsx`: Session analytics dashboard (local history, average, best, coverage metrics, tiers).
- `api/quiz/generate/route.ts`: Serverless route calling Groq API; enforces quiz schema and ordering.

### Library
- `src/lib/config.ts`: Shared runtime constants (API base URL fallback logic).

### Express Server (`server/`)
- `index.js`: Express bootstrap, middleware setup, Mongo connection, route mounting.
- `models/Question.js`: Mongoose schema for persistent interview questions.
- `models/Attempt.js`: Mongoose schema for user attempts (correctness + timing) enabling analytics.
- `routes/questionRoutes.js`: REST endpoints to create/list questions.
- `routes/attemptRoutes.js`: REST endpoints to record attempts and fetch aggregated stats.
- `package.json`: Backend dependency manifest (no inline comments).
- `.env`: Server-only environment (Mongo URI, API keys) excluded from version control.

### Build Artifacts (`.next/`)
Generated output by Next.js (do not edit). Linted & rebuilt automatically.

### Public
Static assets (favicons, images). Add new images here and reference with `/` paths.

### Why JSON Files Lack Comments
`package.json` / `tsconfig.json` follow strict JSON spec which forbids comments. To explain configuration choices, prefer this doc or dedicated sections in the root `README.md`.

### Extending the Project
- Add new pages in `src/app/<route>/page.tsx` with optional client components.
- Add new API serverless routes under `src/app/api/<namespace>/route.ts`.
- For persistent analytics beyond localStorage, wire frontend quiz & practice flows to POST attempts to Express server (already scaffolded).

### Tracking Usage Later
Each runtime-relevant file now has top-of-file comments summarizing its role. For non-commentable or generated files, refer back to this mapping.

---
Last updated: 2025-11-20
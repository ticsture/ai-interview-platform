import { NextRequest, NextResponse } from "next/server";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  distractorExplanations?: string[]; // same length as options; explanation for each option (correct one can state why correct)
};

type QuizResponse = {
  topic: string;
  difficultyLevel: DifficultyLevel;
  questions: QuizQuestion[];
};

// Allowlist of candidate Groq models (ordered by preference). Use only IDs visible in your Groq dashboard.
// From your screenshot: primary accessible model appears to be "llama-3.1-8b-instant" plus newer variants.
// Remove deprecated 3.1 70b versatile; add 3.3 70b versatile if accessible.
const MODEL_ALLOWLIST = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile"
];

function selectInitialModel(): string {
  const envModel = process.env.GROQ_MODEL?.trim();
  // Allow any env-provided model (user may add new one before code update)
  if (envModel) return envModel;
  return MODEL_ALLOWLIST[0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { topic, difficultyLevel, numQuestions } = body as {
      topic?: string;
      difficultyLevel?: DifficultyLevel;
      numQuestions?: number;
    };

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    if (!difficultyLevel) {
      difficultyLevel = "beginner";
    }

    if (!["beginner", "intermediate", "advanced"].includes(difficultyLevel)) {
      return NextResponse.json(
        { error: "difficultyLevel must be beginner | intermediate | advanced" },
        { status: 400 }
      );
    }

    if (!numQuestions || typeof numQuestions !== "number") {
      numQuestions = 5;
    }

    // clamp number of questions
    numQuestions = Math.max(3, Math.min(numQuestions, 15));

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }
    // Prompts (must be defined before attempt() which references them)
    const systemPrompt = `You are an interactive quiz generator for programming and CS topics.

You must return STRICT JSON ONLY with this exact TypeScript-like shape (no markdown, no commentary):
{
  "topic": string,
  "difficultyLevel": "beginner" | "intermediate" | "advanced",
  "allSubtopics": string[],
  "questions": [
    {
      "subtopic": string,
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": 0 | 1 | 2 | 3,
      "explanation": string,
      "distractorExplanations": [string, string, string, string]
    }, ...
  ]
}

Rules:
- Provide 8–15 distinct subtopics in allSubtopics for broad coverage when the topic is large (e.g. Java, JavaScript).
- Each question MUST include the field "subtopic" and it MUST be one of allSubtopics.
- "questions" length MUST be exactly numQuestions.
- Each question MUST have exactly 4 options with exactly ONE correct option.
- correctIndex is the 0-based index of the correct option.
- "explanation": 2–4 concise sentences summarizing reasoning for the correct answer.
- "distractorExplanations": array with SAME length as options. Each entry explains briefly (1 sentence) why that option is incorrect OR (for the correct option) why it is correct.
  // Order questions series-wise following the subtopic order (canonical list or the provided focus subset). Do not jump around.
  // When a focus subset of subtopics is provided, EVERY question MUST use only that subset, and follow that subset's series order. Include each focus subtopic at least once before repeating any.
- Mix conceptual, practical, and occasional code/output or spot-the-error style questions.
- Use simple English.
- ABSOLUTELY NO text outside the JSON. NO backticks.
`;

    const remainingSubtopics = (body as any)?.remainingSubtopics as
      | string[]
      | undefined;
    // New optional focused retry support
    const focusSubtopics = (body as any)?.focusSubtopics as string[] | undefined;
    const existingSubtopics = (body as any)?.existingSubtopics as string[] | undefined;

    let userPrompt: string;
    if (existingSubtopics && existingSubtopics.length) {
      // Retry mode preserving canonical list
      userPrompt = `Generate a multiple-choice quiz retry.
Topic: "${topic}"
Difficulty level: "${difficultyLevel}"
Canonical subtopic list (MUST return exactly this order in allSubtopics): ${existingSubtopics.join(", ")}
${focusSubtopics && focusSubtopics.length ? `Generate ALL questions ONLY from this subset: ${focusSubtopics.join(", ")}. Do NOT introduce other subtopics.` : "Spread questions across the canonical list."}
Number of questions: ${numQuestions}
If any provided focus subtopic appears malformed, still keep original list unchanged.
Return ONLY the JSON described by system instructions.`;
    } else {
      userPrompt = `Generate a multiple-choice quiz.
Topic: "${topic}"
Difficulty level: "${difficultyLevel}"
Number of questions: ${numQuestions}
${focusSubtopics && focusSubtopics.length > 0 ? `Limit subtopics strictly to this subset: ${focusSubtopics.join(", ")}.` : (remainingSubtopics && remainingSubtopics.length > 0 ? `Limit subtopics strictly to this subset: ${remainingSubtopics.join(", ")}.` : "If the topic is broad, first determine a good spread of subtopics.")}

Guidance for difficultyLevel:
- beginner: Start from fundamentals; progressively introduce slightly harder concepts.
- intermediate: Assume basics known; test best practices & common pitfalls.
- advanced: Deep, tricky, edge cases, architecture/performance nuances.

Return ONLY the JSON described by system instructions.`;
    }

    // Debug: show which model & that key is present (never log the key itself)
    const triedModels: string[] = [];
    const errors: Array<{ model: string; status: number; code?: string; message?: string }> = [];

    async function attempt(model: string): Promise<Response | null> {
      triedModels.push(model);
      if (process.env.NODE_ENV === "development") {
        console.log("[quiz/generate] Attempting model", model);
      }
      const completionRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 2000,
          }),
        }
      );
      if (completionRes.ok) return completionRes;
      // Capture error details
      let bodyText = await completionRes.text();
      let code: string | undefined;
      let message: string | undefined;
      try {
        const parsed = JSON.parse(bodyText);
        code = parsed?.error?.code;
        message = parsed?.error?.message;
      } catch (_) {
        message = bodyText.slice(0, 300);
      }
      errors.push({ model, status: completionRes.status, code, message });
      if (process.env.NODE_ENV === "development") {
        console.error("[quiz/generate] Model attempt failed", { model, status: completionRes.status, code, message });
      }
      // Decide if we should try next model
      if (code === "model_decommissioned" || code === "model_not_found") {
        return null; // signal retry allowed
      }
      // For other errors, do not retry further models automatically
      return completionRes; // will be handled as failure
    }

    // Attempt with initial + fallback if needed
    const initialModel = selectInitialModel();
    let completionRes: Response | null = await attempt(initialModel);
    if (!completionRes) {
      // Try remaining models not yet attempted
      for (const alt of MODEL_ALLOWLIST) {
        if (triedModels.includes(alt)) continue;
        completionRes = await attempt(alt);
        if (completionRes) break;
      }
    }

    if (!completionRes || !completionRes.ok) {
      const last = errors[errors.length - 1];
      return NextResponse.json(
        {
          error: "Failed to generate quiz from AI",
          attemptedModels: triedModels,
          lastError: process.env.NODE_ENV === "development" ? last : undefined,
          hint:
            process.env.NODE_ENV === "development"
              ? "Update GROQ_MODEL to a currently supported model shown in console.groq.com/docs/models"
              : undefined,
        },
        { status: last?.status || 502 }
      );
    }

    // At this point completionRes is successful

    const data = await completionRes.json();

    const content: string =
      data.choices?.[0]?.message?.content ?? "";

    let parsed: QuizResponse;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", content);
      return NextResponse.json(
        { error: "AI response was not valid JSON" },
        { status: 500 }
      );
    }

    // Basic validation
    if (
      !parsed.questions ||
      !Array.isArray(parsed.questions) ||
      parsed.questions.length === 0 ||
      !Array.isArray((parsed as any).allSubtopics)
    ) {
      return NextResponse.json(
        { error: "AI returned incomplete quiz data" },
        { status: 500 }
      );
    }

    // Enforce existingSubtopics canonical list if provided
    if (existingSubtopics && existingSubtopics.length) {
      (parsed as any).allSubtopics = existingSubtopics;
      // Filter questions to only focusSubtopics if provided
      if (focusSubtopics && focusSubtopics.length) {
        parsed.questions = parsed.questions.filter(q => focusSubtopics.includes((q as any).subtopic));
      }
    }

    // Optionally trim to numQuestions if overshoot
    parsed.questions = parsed.questions.slice(0, numQuestions);
    // Basic sanitization: ensure subtopic present
    parsed.questions = parsed.questions.map((q: any) => ({
      subtopic: typeof q.subtopic === 'string' ? q.subtopic.trim() : "unknown",
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0,4) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || "",
      distractorExplanations: Array.isArray(q.distractorExplanations) && q.distractorExplanations.length === 4 ? q.distractorExplanations : undefined,
    }));

    // Series-wise ordering of questions by canonical subtopic order
    const canonical = (existingSubtopics && existingSubtopics.length)
      ? existingSubtopics
      : ((parsed as any).allSubtopics as string[]);

    const orderForThisQuiz = (focusSubtopics && focusSubtopics.length)
      ? canonical.filter(s => new Set(focusSubtopics).has(s))
      : canonical;

    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const indexMap = new Map<string, number>(orderForThisQuiz.map((s, i) => [norm(s), i]));
    parsed.questions = parsed.questions.sort((a: any, b: any) => {
      const ia = indexMap.get(norm(a.subtopic)) ?? Number.MAX_SAFE_INTEGER;
      const ib = indexMap.get(norm(b.subtopic)) ?? Number.MAX_SAFE_INTEGER;
      return ia - ib;
    });

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Unexpected error in quiz generation:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

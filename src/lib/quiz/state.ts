export const QUIZ_STATE_KEY = "quiz_state_v1";

export interface QuizStateV1 {
  rhunes: number;
  currentThemeSlug: string | null;
  currentChapterSlug: string | null;
  answeredQuestionIds: string[];
  lastPickedPlayerId: string | null;
  hasSeenIntro30Runes: boolean;
}

export function createDefaultQuizState(): QuizStateV1 {
  return {
    rhunes: 0,
    currentThemeSlug: null,
    currentChapterSlug: null,
    answeredQuestionIds: [],
    lastPickedPlayerId: null,
    hasSeenIntro30Runes: false,
  };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadQuizState(): QuizStateV1 {
  if (typeof window === "undefined") return createDefaultQuizState();
  try {
    const parsed = safeParse(localStorage.getItem(QUIZ_STATE_KEY));
    if (!parsed || typeof parsed !== "object") return createDefaultQuizState();

    const p = parsed as Partial<QuizStateV1>;
    const rhunes = typeof p.rhunes === "number" && Number.isFinite(p.rhunes) ? Math.max(0, Math.floor(p.rhunes)) : 0;
    const currentThemeSlug = typeof p.currentThemeSlug === "string" && p.currentThemeSlug.trim() ? p.currentThemeSlug : null;
    const currentChapterSlug = typeof p.currentChapterSlug === "string" && p.currentChapterSlug.trim() ? p.currentChapterSlug : null;
    const answeredQuestionIds = Array.isArray(p.answeredQuestionIds)
      ? p.answeredQuestionIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    const lastPickedPlayerId =
      typeof p.lastPickedPlayerId === "string" && p.lastPickedPlayerId.trim() ? p.lastPickedPlayerId : null;
    const hasSeenIntro30Runes = typeof (p as any).hasSeenIntro30Runes === "boolean" ? (p as any).hasSeenIntro30Runes : false;

    return { rhunes, currentThemeSlug, currentChapterSlug, answeredQuestionIds, lastPickedPlayerId, hasSeenIntro30Runes };
  } catch {
    return createDefaultQuizState();
  }
}

export function saveQuizState(next: QuizStateV1) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(next));
  } catch {
    // stockage non critique, on ignore les erreurs
  }
}

export function addRhunes(state: QuizStateV1, delta: number): QuizStateV1 {
  const safeDelta = Number.isFinite(delta) ? Math.floor(delta) : 0;
  return {
    ...state,
    rhunes: Math.max(0, state.rhunes + safeDelta),
  };
}

export function markQuestionAnswered(state: QuizStateV1, questionId: string): QuizStateV1 {
  if (!questionId.trim()) return state;
  if (state.answeredQuestionIds.includes(questionId)) return state;
  return { ...state, answeredQuestionIds: [...state.answeredQuestionIds, questionId] };
}

export function startTheme(state: QuizStateV1, themeSlug: string): QuizStateV1 {
  const slug = themeSlug.trim();
  if (!slug) return state;
  if (state.currentThemeSlug === slug) return state;
  return { ...state, currentThemeSlug: slug, currentChapterSlug: null, answeredQuestionIds: [] };
}

export function startChapter(state: QuizStateV1, chapterSlug: string): QuizStateV1 {
  const slug = chapterSlug.trim();
  if (!slug) return state;
  if (state.currentChapterSlug === slug) return state;
  return { ...state, currentChapterSlug: slug, answeredQuestionIds: [] };
}

export function setLastPickedPlayerId(state: QuizStateV1, playerId: string | null): QuizStateV1 {
  const value = typeof playerId === "string" && playerId.trim() ? playerId : null;
  return { ...state, lastPickedPlayerId: value };
}


export const QUIZ_STATE_KEY = "quiz_state_v1";

export interface PlayerScore {
  points: number;
  runes: number;
}

export interface QuizStateV1 {
  runes: number;
  playerScores: Record<string, PlayerScore>;
  currentThemeSlug: string | null;
  currentChapterSlug: string | null;
  answeredQuestionIds: string[];
  lastPickedPlayerId: string | null;
  hasSeenIntro30Runes: boolean;
  lastAnswerWasCorrect: boolean;
}

export function createDefaultQuizState(): QuizStateV1 {
  return {
    runes: 0,
    playerScores: {},
    currentThemeSlug: null,
    currentChapterSlug: null,
    answeredQuestionIds: [],
    lastPickedPlayerId: null,
    hasSeenIntro30Runes: false,
    lastAnswerWasCorrect: false,
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

    const p = parsed as Partial<QuizStateV1> & {
      playerScores?: unknown;
    };
    const runes = typeof (p as any).runes === "number" && Number.isFinite((p as any).runes)
      ? Math.max(0, Math.floor((p as any).runes))
      : 0;
    const currentThemeSlug = typeof p.currentThemeSlug === "string" && p.currentThemeSlug.trim() ? p.currentThemeSlug : null;
    const currentChapterSlug = typeof p.currentChapterSlug === "string" && p.currentChapterSlug.trim() ? p.currentChapterSlug : null;
    const answeredQuestionIds = Array.isArray(p.answeredQuestionIds)
      ? p.answeredQuestionIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : [];
    const lastPickedPlayerId =
      typeof p.lastPickedPlayerId === "string" && p.lastPickedPlayerId.trim() ? p.lastPickedPlayerId : null;
    const hasSeenIntro30Runes =
      typeof (p as any).hasSeenIntro30Runes === "boolean" ? (p as any).hasSeenIntro30Runes : false;
    const lastAnswerWasCorrect =
      typeof (p as any).lastAnswerWasCorrect === "boolean" ? (p as any).lastAnswerWasCorrect : false;

    const rawPlayerScores = (p as any).playerScores as unknown;
    const playerScores: Record<string, PlayerScore> = {};
    if (rawPlayerScores && typeof rawPlayerScores === "object") {
      for (const [playerId, value] of Object.entries(rawPlayerScores as Record<string, unknown>)) {
        if (typeof playerId !== "string" || !playerId.trim()) continue;
        if (!value || typeof value !== "object") continue;
        const v = value as Partial<PlayerScore>;
        const points =
          typeof v.points === "number" && Number.isFinite(v.points) ? Math.max(0, Math.floor(v.points)) : 0;
        const runesForPlayer =
          typeof (v as any).runes === "number" && Number.isFinite((v as any).runes)
            ? Math.max(0, Math.floor((v as any).runes))
            : 0;
        if (!points && !runesForPlayer) continue;
        playerScores[playerId] = { points, runes: runesForPlayer };
      }
    }

    return {
      runes,
      playerScores,
      currentThemeSlug,
      currentChapterSlug,
      answeredQuestionIds,
      lastPickedPlayerId,
      hasSeenIntro30Runes,
      lastAnswerWasCorrect,
    };
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

export function addRunes(state: QuizStateV1, delta: number): QuizStateV1 {
  const safeDelta = Number.isFinite(delta) ? Math.floor(delta) : 0;
  return {
    ...state,
    runes: Math.max(0, state.runes + safeDelta),
  };
}

export function addScoreForPlayer(
  state: QuizStateV1,
  playerId: string,
  deltaPoints: number,
  deltaRunes: number,
): QuizStateV1 {
  const id = playerId.trim();
  if (!id) return state;

  const safePoints = Number.isFinite(deltaPoints) ? Math.floor(deltaPoints) : 0;
  const safeRunes = Number.isFinite(deltaRunes) ? Math.floor(deltaRunes) : 0;

  if (!safePoints && !safeRunes) return state;

  const previous = state.playerScores[id] ?? { points: 0, runes: 0 };
  const nextForPlayer: PlayerScore = {
    points: Math.max(0, previous.points + safePoints),
    runes: Math.max(0, previous.runes + safeRunes),
  };

  const nextPlayerScores: Record<string, PlayerScore> = {
    ...state.playerScores,
    [id]: nextForPlayer,
  };

  const nextRunesTotal = Math.max(0, state.runes + safeRunes);

  return {
    ...state,
    runes: nextRunesTotal,
    playerScores: nextPlayerScores,
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
  return { ...state, currentThemeSlug: slug, currentChapterSlug: null, answeredQuestionIds: [], lastAnswerWasCorrect: false };
}

export function startChapter(state: QuizStateV1, chapterSlug: string): QuizStateV1 {
  const slug = chapterSlug.trim();
  if (!slug) return state;
  if (state.currentChapterSlug === slug) return state;
  return { ...state, currentChapterSlug: slug, answeredQuestionIds: [], lastAnswerWasCorrect: false };
}

export function setLastPickedPlayerId(state: QuizStateV1, playerId: string | null): QuizStateV1 {
  const value = typeof playerId === "string" && playerId.trim() ? playerId : null;
  return { ...state, lastPickedPlayerId: value };
}


"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addRhunes, loadQuizState, markQuestionAnswered, saveQuizState, startChapter, startTheme } from "@/lib/quiz/state";
import { BurgerMenu } from "@/app/components/BurgerMenu";

type Audience = "adultes" | "enfants";

type ThemeRow = { id: string; slug: string; ordre: number; titre: string };
type ChapterRow = { id: string; slug: string; ordre: number; titre: string; theme_id: string };

type AnswerRow = { id: string; ordre: number; texte: string; is_correct: boolean };
type QuestionRow = { id: string; ordre: number; texte: string; aide_texte: string; quiz_reponses: AnswerRow[] };

const QUESTION_TIME_SECONDS = 30;

type Phase = "countdown" | "question" | "wrong" | "interlude" | "chapterComplete";

function toAudience(raw: string | null): Audience {
  return raw === "enfants" ? "enfants" : "adultes";
}

const THEME_BACKGROUNDS: Record<string, string> = {
  "histoire-mythologie": "/quiz/theme1.jpg",
  creation: "/quiz/theme2.jpg",
  "technologie-science": "/quiz/theme3.jpg",
  compagnons: "/quiz/theme4.jpg",
};

export default function QuizChapitrePlayPage() {
  const params = useParams<{ themeSlug: string; chapitreSlug: string }>();
  const router = useRouter();

  const themeSlug = useMemo(() => String(params?.themeSlug ?? "").trim(), [params]);
  const chapitreSlug = useMemo(() => String(params?.chapitreSlug ?? "").trim(), [params]);
  const [audience, setAudience] = useState<Audience>("adultes");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      setAudience(toAudience(url.searchParams.get("audience")));
    } catch {
      setAudience("adultes");
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeRow | null>(null);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [chaptersInTheme, setChaptersInTheme] = useState<ChapterRow[]>([]);

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const [rhunes, setRhunes] = useState(0);

  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [hasSeenHintForCurrentQuestion, setHasSeenHintForCurrentQuestion] = useState(false);

  const pickNextQuestionId = useCallback((ids: string[], all: QuestionRow[]) => all.find((q) => !ids.includes(q.id))?.id ?? null, []);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!chapitreSlug) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      const themeRes = await supabase.from("quiz_themes").select("id, slug, ordre, titre").eq("slug", themeSlug).maybeSingle();
      if (cancelled) return;
      if (themeRes.error || !themeRes.data) {
        setError("Impossible de charger le thème.");
        setLoading(false);
        return;
      }
      const t = themeRes.data as ThemeRow;
      setTheme(t);

      const chapterRes = await supabase.from("quiz_chapitres").select("id, slug, ordre, titre, theme_id").eq("slug", chapitreSlug).maybeSingle();
      if (cancelled) return;
      if (chapterRes.error || !chapterRes.data) {
        setError("Impossible de charger le chapitre.");
        setLoading(false);
        return;
      }
      const ch = chapterRes.data as ChapterRow;
      setChapter(ch);

      const chaptersRes = await supabase
        .from("quiz_chapitres")
        .select("id, slug, ordre, titre, theme_id")
        .eq("theme_id", t.id)
        .order("ordre", { ascending: true });
      if (!cancelled && !chaptersRes.error) setChaptersInTheme((chaptersRes.data as ChapterRow[]) ?? []);

      const qsRes = await supabase
        .from("quiz_questions")
        .select("id, ordre, texte, aide_texte, quiz_reponses(id, ordre, texte, is_correct)")
        .eq("chapitre_id", ch.id)
        .eq("audience", audience)
        .order("ordre", { ascending: true })
        .order("ordre", { ascending: true, foreignTable: "quiz_reponses" });

      if (cancelled) return;
      if (qsRes.error) {
        setError("Impossible de charger les questions.");
        setLoading(false);
        return;
      }

      const loaded = (qsRes.data as QuestionRow[]) ?? [];
      if (loaded.length === 0) {
        setQuestions([]);
        setError(
          audience === "enfants"
            ? "Aucune question n’est configurée pour ce chapitre (mode enfants)."
            : "Aucune question n’est configurée pour ce chapitre (mode adultes).",
        );
        setLoading(false);
        return;
      }
      setQuestions(loaded);

      const local = loadQuizState();
      const s1 = startTheme(local, themeSlug);
      const s2 = startChapter(s1, chapitreSlug);
      saveQuizState(s2);
      setRhunes(s2.rhunes);
      setAnsweredIds(s2.answeredQuestionIds);

      const firstId = pickNextQuestionId(s2.answeredQuestionIds, loaded);
      setActiveQuestionId(firstId);
      setPhase(firstId ? "countdown" : "chapterComplete");
      setCountdown(3);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [audience, chapitreSlug, pickNextQuestionId, themeSlug]);

  const activeQuestion = useMemo(
    () => (activeQuestionId ? (questions.find((q) => q.id === activeQuestionId) ?? null) : null),
    [activeQuestionId, questions],
  );

  useEffect(() => {
    setHasSeenHintForCurrentQuestion(false);
  }, [activeQuestionId]);

  const validateQuestionData = useMemo(() => {
    if (!activeQuestion) return { ok: false, reason: "Aucune question." as const };
    const answers = activeQuestion.quiz_reponses ?? [];
    if (answers.length !== 3) return { ok: false, reason: "Cette question n’a pas exactement 3 réponses." as const };
    const correctCount = answers.filter((a) => a.is_correct).length;
    if (correctCount !== 1) return { ok: false, reason: "Cette question n’a pas exactement 1 bonne réponse." as const };
    return { ok: true, reason: null };
  }, [activeQuestion]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (!activeQuestionId) return;
    const id = window.setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(id);
          queueMicrotask(() => setPhase("question"));
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeQuestionId, phase]);

  useEffect(() => {
    if (phase !== "question") return;
    if (!activeQuestionId) return;
    if (!validateQuestionData.ok) return;

    let cancelled = false;
    const initId = window.setTimeout(() => {
      if (cancelled) return;
      setSecondsLeft(QUESTION_TIME_SECONDS);
    }, 0);

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(initId);
      window.clearInterval(id);
    };
  }, [activeQuestionId, phase, validateQuestionData.ok]);

  useEffect(() => {
    if (phase !== "question") return;
    if (secondsLeft > 0) return;
    const id = window.setTimeout(() => setPhase("wrong"), 0);
    return () => window.clearTimeout(id);
  }, [phase, secondsLeft]);

  const goNextQuestion = useCallback(() => {
    const nextId = pickNextQuestionId(answeredIds, questions);
    setActiveQuestionId(nextId);
    if (!nextId) {
      setPhase("chapterComplete");
      return;
    }
    setCountdown(3);
    setPhase("countdown");
  }, [answeredIds, pickNextQuestionId, questions]);

  const applyCorrectAnswer = useCallback(() => {
    if (!activeQuestion) return;
    const local = loadQuizState();
    const next1 = markQuestionAnswered(local, activeQuestion.id);
    const next2 = addRhunes(next1, 10);
    saveQuizState(next2);
    setRhunes(next2.rhunes);
    setAnsweredIds(next2.answeredQuestionIds);
    setPhase("interlude");
  }, [activeQuestion]);

  const handleSelectAnswer = useCallback(
    (answerId: string) => {
      if (phase !== "question") return;
      if (!activeQuestion) return;
      if (!validateQuestionData.ok) return;
      const answer = (activeQuestion.quiz_reponses ?? []).find((a) => a.id === answerId);
      if (!answer) return;
      if (answer.is_correct) {
        applyCorrectAnswer();
      } else if (!hasSeenHintForCurrentQuestion) {
        setHasSeenHintForCurrentQuestion(true);
        setPhase("wrong");
      } else {
        goNextQuestion();
      }
    },
    [activeQuestion, applyCorrectAnswer, goNextQuestion, hasSeenHintForCurrentQuestion, phase, validateQuestionData.ok],
  );

  const retryQuestion = useCallback(() => setPhase("question"), []);

  const nextChapterSlug = useMemo(() => {
    if (!chapter) return null;
    const idx = chaptersInTheme.findIndex((c) => c.slug === chapter.slug);
    if (idx === -1) return null;
    return chaptersInTheme[idx + 1]?.slug ?? null;
  }, [chapter, chaptersInTheme]);

  useEffect(() => {
    if (phase !== "chapterComplete") return;
    if (!themeSlug) return;

    if (nextChapterSlug) {
      router.replace(`/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(nextChapterSlug)}/audio`);
    } else {
      router.replace(`/quiz/${encodeURIComponent(themeSlug)}/suite`);
    }
  }, [nextChapterSlug, phase, router, themeSlug]);

  const headerLeftHref = `/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(chapitreSlug)}/joueur`;
  const backgroundUrl = mounted && themeSlug ? THEME_BACKGROUNDS[themeSlug] : undefined;

  return (
    <div
      className="flex min-h-dvh flex-col items-center py-0"
      style={
        backgroundUrl
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/60 to-black/80" />
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center">
        <header className="flex w-full items-center justify-between px-6 pt-4">
          <Link
            href={headerLeftHref}
            aria-label="Revenir à l’écran du joueur"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{ borderRadius: 80, borderColor: "var(--Neutral-25, #FDFDFD)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BurgerMenu />
        </header>

        <main className="flex w-full flex-1 flex-col items-center px-6 pt-8">
          {loading ? (
            <div className="mt-10 text-center text-sm text-white/70">Chargement...</div>
          ) : error ? (
            <div className="mt-10 w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : phase === "countdown" ? (
            <div className="flex w-full flex-1 items-center justify-center text-white">
              <div className="font-space-semibold text-6xl tabular-nums">{countdown}</div>
            </div>
          ) : phase === "question" && activeQuestion ? (
            <>
              {!validateQuestionData.ok ? (
                <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {validateQuestionData.reason}
                </div>
              ) : (
                <div className="flex w-full flex-1 flex-col">
                  <div className="flex justify-center">
                    <div className="w-full max-w-sm">
                      <p className="text-[24px] font-medium leading-[32px] text-center text-white">{activeQuestion.texte}</p>

                      <div className="mt-6 flex flex-col gap-3">
                        {(activeQuestion.quiz_reponses ?? []).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className="w-full rounded-2xl px-4 py-3 text-left text-base font-medium text-white transition-colors border-2 border-transparent"
                            style={{
                              borderRadius: 16,
                              background: "rgba(255, 243, 208, 0.30)",
                              backdropFilter: "blur(15px)",
                            }}
                            onClick={() => handleSelectAnswer(a.id)}
                            aria-label={`Réponse : ${a.texte}`}
                          >
                            {a.texte}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-center gap-3 pb-6">
                    <div className="h-1 w-full max-w-sm rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          backgroundColor: "#FFCA44",
                          width: `${Math.max(0, Math.min(1, secondsLeft / QUESTION_TIME_SECONDS)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center text-xs font-semibold" style={{ color: "#FFCA44" }} aria-hidden="true">
                      ⏱
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : phase === "interlude" ? (
            <div className="flex w-full flex-1 flex-col items-center">
              <div className="flex flex-1 items-center justify-center">
                <p
                  className="text-center"
                  style={{
                    color: "var(--Neutral-25, #FDFDFD)",
                    fontFamily:
                      '"Acumin Variable Concept", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: 24,
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "32px",
                  }}
                >
                  +10 rhunes
                </p>
              </div>
              <div className="w-full max-w-sm pb-6">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-center text-base font-medium text-zinc-900 shadow-sm"
                  style={{
                    borderRadius: 16,
                    background: "var(--Complementary-600, #FFE5A2)",
                  }}
                  onClick={goNextQuestion}
                  aria-label="Passer à la question suivante"
                >
                  Continuer
                </button>
              </div>
            </div>
          ) : phase === "wrong" && activeQuestion ? (
            <div className="flex w-full flex-1 flex-col items-center">
              <div className="flex flex-1 items-center justify-center px-6">
                <p
                  className="whitespace-pre-line text-center text-white"
                  style={{ fontSize: 24, fontStyle: "normal", fontWeight: 500, lineHeight: "32px" }}
                >
                  {activeQuestion.aide_texte}
                </p>
              </div>
              <div className="w-full max-w-sm pb-6">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-center text-base font-medium text-zinc-900 shadow-sm"
                  style={{
                    borderRadius: 16,
                    background: "var(--Complementary-600, #FFE5A2)",
                  }}
                  onClick={retryQuestion}
                  aria-label="Réessayer la question"
                >
                  Je réessaye
                </button>
              </div>
            </div>
          ) : phase === "chapterComplete" ? (
            <div className="flex w-full flex-1 items-center justify-center">
              <div className="text-sm text-white/70">Chargement...</div>
            </div>
          ) : (
            <div className="w-full max-w-sm space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/70">{theme?.titre ?? "Thème"}</p>
                  <h1 className="truncate text-xl font-semibold text-white">{chapter?.titre ?? "Chapitre"}</h1>
                  <p className="mt-1 text-xs text-white/60">Mode : {audience === "enfants" ? "Enfants" : "Adultes"}</p>
                </div>
                <div
                  className="shrink-0 rounded-2xl px-3 py-2 text-sm font-semibold text-white"
                  style={{ borderRadius: 16, background: "rgba(253, 253, 253, 0.15)", backdropFilter: "blur(10px)" }}
                  aria-label={`Total de rhunes : ${rhunes}`}
                >
                  {rhunes} rhunes
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

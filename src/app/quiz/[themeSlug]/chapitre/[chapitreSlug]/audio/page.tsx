"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { AudioPlayerCard } from "@/app/quiz/components/AudioPlayerCard";

type ChapterRow = {
  id: string;
  slug: string;
  titre: string;
  resume: string;
  audio_url: string | null;
};

type ThemeRow = {
  titre: string;
};

const THEME_BACKGROUNDS: Record<string, string> = {
  "histoire-mythologie": "/quiz/theme1.jpg",
  creation: "/quiz/theme2.jpg",
  "technologie-science": "/quiz/theme3.jpg",
  compagnons: "/quiz/theme4.jpg",
};

export default function QuizChapitreAudioPage() {
  const params = useParams<{ themeSlug: string; chapitreSlug: string }>();
  const router = useRouter();
  const themeSlug = useMemo(() => String(params?.themeSlug ?? "").trim(), [params]);
  const chapitreSlug = useMemo(() => String(params?.chapitreSlug ?? "").trim(), [params]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [theme, setTheme] = useState<ThemeRow | null>(null);

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

      const themeRes = await supabase.from("quiz_themes").select("titre").eq("slug", themeSlug).maybeSingle();
      if (!cancelled && !themeRes.error && themeRes.data) {
        setTheme(themeRes.data as ThemeRow);
      }

      const res = await supabase
        .from("quiz_chapitres")
        .select("id, slug, titre, resume, audio_url")
        .eq("slug", chapitreSlug)
        .maybeSingle();
      if (cancelled) return;
      if (res.error) {
        setError("Impossible de charger l’audio du chapitre.");
        setChapter(null);
        setLoading(false);
        return;
      }
      if (!res.data) {
        setError("Ce chapitre n’existe pas.");
        setChapter(null);
        setLoading(false);
        return;
      }
      setChapter(res.data as ChapterRow);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [chapitreSlug]);

  const backgroundUrl = mounted && themeSlug ? THEME_BACKGROUNDS[themeSlug] : undefined;

  const handleEnded = useCallback(() => {
    router.push(`/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(chapitreSlug)}/joueur`);
  }, [chapitreSlug, router, themeSlug]);

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
      <div className="relative flex min-h-dvh w-full flex-col items-center">
        <header className="flex w-full items-center justify-between px-6 pt-4">
          <Link
            href={`/quiz/${encodeURIComponent(themeSlug)}/intro`}
            aria-label="Revenir au thème"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{
              borderRadius: 80,
              borderColor: "var(--Neutral-25, #FDFDFD)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M15 19l-7-7 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <BurgerMenu />
        </header>

        <main className="flex w-full flex-1 flex-col items-center justify-end px-6 pb-10">
          {loading ? (
            <div className="text-center text-sm text-white/70">Chargement...</div>
          ) : error ? (
            <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : chapter?.audio_url ? (
            <div className="w-full max-w-sm space-y-4 text-left">
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-white">
                  {chapitreSlug === "naissance-et" ? "La Naissance d’Enchanted Tools" : chapter.titre}
                </h1>
                <p className="text-xs font-medium tracking-wide text-white/60">{theme?.titre}</p>
              </div>
              <AudioPlayerCard src={chapter.audio_url} onEnded={handleEnded} />
            </div>
          ) : (
            <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Aucun audio n’est configuré pour ce chapitre.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
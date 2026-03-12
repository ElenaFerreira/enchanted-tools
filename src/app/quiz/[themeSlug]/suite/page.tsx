"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { PrimaryCTA } from "@/app/components/PrimaryCTA";

type ThemeRow = { id: string; slug: string; ordre: number; titre: string };

const THEME_BACKGROUNDS: Record<string, string> = {
  "histoire-mythologie": "/quiz/theme1.jpg",
  creation: "/quiz/theme2.jpg",
  "technologie-science": "/quiz/theme3.jpg",
  compagnons: "/quiz/theme4.jpg",
};

export default function QuizThemeSuitePage() {
  const params = useParams<{ themeSlug: string }>();
  const themeSlug = useMemo(() => String(params?.themeSlug ?? "").trim(), [params]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextThemeSlug, setNextThemeSlug] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeRow | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!themeSlug) return;
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const themesRes = await supabase.from("quiz_themes").select("id, slug, ordre, titre").order("ordre", { ascending: true });
      if (cancelled) return;
      if (themesRes.error) {
        setError("Impossible de charger la suite du quizz.");
        setLoading(false);
        return;
      }
      const themes = (themesRes.data as ThemeRow[]) ?? [];
      const idx = themes.findIndex((t) => t.slug === themeSlug);
      const next = idx >= 0 ? (themes[idx + 1]?.slug ?? null) : null;
      setNextThemeSlug(next);
      setCurrentTheme(idx >= 0 ? (themes[idx] ?? null) : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [themeSlug]);

  const backgroundUrl = mounted && themeSlug ? THEME_BACKGROUNDS[themeSlug] : undefined;

  const nextWorldLabel = useMemo(() => {
    if (!currentTheme || typeof currentTheme.ordre !== "number") return "deuxième";
    const nextIndex = currentTheme.ordre + 1;
    switch (nextIndex) {
      case 2:
        return "deuxième";
      case 3:
        return "troisième";
      case 4:
        return "quatrième";
      default:
        return `${nextIndex}ᵉ`;
    }
  }, [currentTheme]);

  const nextHref = useMemo(() => {
    if (!nextThemeSlug) return "/quiz/termine";
    if (!currentTheme || typeof currentTheme.ordre !== "number") {
      return `/quiz/${encodeURIComponent(nextThemeSlug)}/intro`;
    }
    switch (currentTheme.ordre) {
      case 1:
        return `/quiz/transition/1-2?nextTheme=${encodeURIComponent(nextThemeSlug)}`;
      case 2:
        return `/quiz/transition/2-3?nextTheme=${encodeURIComponent(nextThemeSlug)}`;
      case 3:
        return `/quiz/transition/3-4?nextTheme=${encodeURIComponent(nextThemeSlug)}`;
      default:
        return `/quiz/${encodeURIComponent(nextThemeSlug)}/intro`;
    }
  }, [currentTheme, nextThemeSlug]);

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
        <header className="flex w-full items-center justify-end px-6 pt-4">
          <BurgerMenu />
        </header>

        <main className="flex w-full flex-1 flex-col items-center px-6 pt-8">
          {loading ? (
            <div className="mt-10 text-center text-sm text-white/70">Chargement...</div>
          ) : error ? (
            <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : (
            <div className="flex w-full flex-1 flex-col items-center">
              <div className="flex flex-1 flex-col items-center justify-center px-6 gap-4">
                <p
                  className="whitespace-pre-line text-center text-white"
                  style={{ fontSize: 24, fontStyle: "normal", fontWeight: 500, lineHeight: "32px" }}
                >
                  {`Top ! Merci de m’apprendre tout cela. Grâce à toi j’ai pu acquérir suffisamment de runes pour passer le portail du ${nextWorldLabel} monde !`}
                </p>
              </div>
            </div>
          )}
        </main>

        <footer className="w-full px-6 pb-0">
          <div className="mb-6 flex justify-center">
            <PrimaryCTA href={nextHref} label="Je continue" ariaLabel="Passer au thème suivant" disabled={loading || Boolean(error)} />
          </div>
        </footer>
      </div>
    </div>
  );
}

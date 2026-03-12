"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PrimaryCTA } from "@/app/components/PrimaryCTA";

type ThemeRow = {
  id: string;
  slug: string;
  ordre: number;
  titre: string;
  description: string | null;
};

const THEME_BACKGROUNDS: Record<string, string> = {
  "histoire-mythologie": "/quiz/theme1.jpg",
  creation: "/quiz/theme2.jpg",
  "technologie-science": "/quiz/theme3.jpg",
  compagnons: "/quiz/theme4.jpg",
};

export default function QuizThemeIntroPage() {
  const params = useParams<{ themeSlug: string }>();
  const themeSlug = useMemo(() => String(params?.themeSlug ?? "").trim(), [params]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeRow | null>(null);
  const [firstChapterSlug, setFirstChapterSlug] = useState<string | null>(null);

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
      const res = await supabase.from("quiz_themes").select("id, slug, ordre, titre, description").eq("slug", themeSlug).maybeSingle();

      if (cancelled) return;
      if (res.error) {
        setError("Impossible de charger le thème du quizz.");
        setTheme(null);
        setLoading(false);
        return;
      }
      if (!res.data) {
        setError("Ce thème n’existe pas.");
        setTheme(null);
        setLoading(false);
        return;
      }
      setTheme(res.data as ThemeRow);

      const ch = await supabase
        .from("quiz_chapitres")
        .select("slug, ordre")
        .eq("theme_id", (res.data as ThemeRow).id)
        .order("ordre", { ascending: true })
        .limit(1);
      if (!cancelled && !ch.error) {
        const first = ((ch.data as { slug: string; ordre: number }[]) ?? [])[0];
        setFirstChapterSlug(first?.slug ? String(first.slug) : null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [themeSlug]);

  const canStartAudio = Boolean(firstChapterSlug);
  const backgroundUrl = mounted && theme ? THEME_BACKGROUNDS[theme.slug] : undefined;

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
        <main className="flex w-full flex-1 flex-col items-center justify-center px-6">
          {loading ? (
            <div className="text-center text-sm text-white/70">Chargement...</div>
          ) : error ? (
            <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : theme ? (
            <div className="w-full max-w-sm space-y-5 text-center">
              <h1 className="text-[40px] font-medium leading-tight text-white">{theme.titre}</h1>
              {theme.description ? <p className="whitespace-pre-line text-white/80">{theme.description}</p> : null}

              {!canStartAudio ? (
                <div className="w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Aucun chapitre n’est configuré pour ce thème.
                </div>
              ) : null}
            </div>
          ) : null}
        </main>

        <footer className="w-full px-6 pb-0">
          <div className="flex justify-center mb-6">
            <PrimaryCTA
              href={firstChapterSlug ? `/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(firstChapterSlug)}/audio` : "#"}
              label="Lancer l’audio"
              ariaLabel="Lancer l’audio d’introduction"
              disabled={!canStartAudio || loading || Boolean(error)}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

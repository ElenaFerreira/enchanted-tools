"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { OnboardingPlayer } from "@/lib/types";
import { loadOnboardingContext, loadStoredRoles, ONBOARDING_PLAYERS_KEY, parseStoredPlayers } from "@/lib/onboarding";
import { loadQuizState, saveQuizState, setLastPickedPlayerId } from "@/lib/quiz/state";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { PrimaryCTA } from "@/app/components/PrimaryCTA";

function pickRandomPlayer(players: OnboardingPlayer[], avoidId: string | null): OnboardingPlayer | null {
  if (players.length === 0) return null;
  if (players.length === 1) return players[0] ?? null;

  const candidates = avoidId ? players.filter((p) => p.id !== avoidId) : players;
  const pool = candidates.length > 0 ? candidates : players;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? null;
}

function deriveAudience(playerId: string, context: string | null, roles: Record<string, string>): "adultes" | "enfants" {
  if (context !== "En famille") return "adultes";
  const role = roles[playerId] ?? null;
  return role === "L’enfant" ? "enfants" : "adultes";
}

const THEME_BACKGROUNDS: Record<string, string> = {
  "histoire-mythologie": "/quiz/theme1.jpg",
  creation: "/quiz/theme2.jpg",
  "technologie-science": "/quiz/theme3.jpg",
  compagnons: "/quiz/theme4.jpg",
};

export default function QuizChapitreJoueurPage() {
  const params = useParams<{ themeSlug: string; chapitreSlug: string }>();
  const themeSlug = useMemo(() => String(params?.themeSlug ?? "").trim(), [params]);
  const chapitreSlug = useMemo(() => String(params?.chapitreSlug ?? "").trim(), [params]);

  const [player, setPlayer] = useState<OnboardingPlayer | null>(null);
  const [audience, setAudience] = useState<"adultes" | "enfants">("adultes");
  const [error, setError] = useState<string | null>(null);
  const [showIntro30Runes, setShowIntro30Runes] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const players = parseStoredPlayers(localStorage.getItem(ONBOARDING_PLAYERS_KEY));
      if (players.length === 0) {
        setError("Aucun joueur n’a été configuré. Ajoute des joueurs avant de lancer le quizz.");
        setPlayer(null);
        setAudience("adultes");
        return;
      }

      const state = loadQuizState();
      const picked = pickRandomPlayer(players, state.lastPickedPlayerId);
      if (!picked) {
        setError("Impossible de sélectionner un joueur.");
        setPlayer(null);
        setAudience("adultes");
        return;
      }

      const context = loadOnboardingContext();
      const roles = loadStoredRoles();
      const aud = deriveAudience(picked.id, context, roles);

      const shouldShowIntro = !state.hasSeenIntro30Runes;
      setShowIntro30Runes(shouldShowIntro);

      const withPlayer = setLastPickedPlayerId(state, picked.id);
      const nextState = shouldShowIntro ? { ...withPlayer, hasSeenIntro30Runes: true } : withPlayer;
      saveQuizState(nextState);
      setPlayer(picked);
      setAudience(aud);
      setError(null);
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const backgroundUrl = themeSlug ? THEME_BACKGROUNDS[themeSlug] : undefined;

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
            href={`/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(chapitreSlug)}/audio`}
            aria-label="Revenir à l’audio"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{
              borderRadius: 80,
              borderColor: "var(--Neutral-25, #FDFDFD)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <BurgerMenu />
        </header>

        <main className="flex w-full flex-1 flex-col items-center justify-center px-6">
          {error ? (
            <div className="w-full max-w-sm rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
          ) : player ? (
            <div className="w-full max-w-sm space-y-8 text-center text-white">
              <div className="space-y-2">
                <h1 className="text-[48px] font-bold leading-[60px] tracking-[-0.96px]">{player.name}</h1>
              </div>

              {showIntro30Runes ? (
                <p className="text-[24px] font-normal leading-[32px] text-white/90">
                  Pour débloquer le nouveau monde, j’ai besoin de 30 runes.
                  <br />
                  <br />
                  Réponds au quiz pour me transmettre tes connaissances et m’aider à les obtenir.
                  <br />
                  Une fois les 30 runes réunies, le portail s’ouvrira. ✨
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-10 text-center text-sm text-white/70">Chargement...</div>
          )}
        </main>

        <footer className="w-full px-6 pb-0">
          <div className="mb-6 flex justify-center">
            <PrimaryCTA
              href={`/quiz/${encodeURIComponent(themeSlug)}/chapitre/${encodeURIComponent(chapitreSlug)}/play?audience=${encodeURIComponent(audience)}`}
              label="Je me lance"
              ariaLabel="Je me lance"
              disabled={!player || Boolean(error)}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

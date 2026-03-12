"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, User } from "lucide-react";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { PrimaryCTA } from "@/app/components/PrimaryCTA";
import { loadQuizState } from "@/lib/quiz/state";
import { ONBOARDING_PLAYERS_KEY, parseStoredPlayers } from "@/lib/onboarding";

const THEME_3_BACKGROUND = "/quiz/theme3.jpg";

interface Player {
  id: string;
  name: string;
}

export default function QuizTerminePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  useEffect(() => {
    const state = loadQuizState();
    if (typeof window === "undefined") return;
    const stored = parseStoredPlayers(localStorage.getItem(ONBOARDING_PLAYERS_KEY));
    setPlayers(stored);
    const lastPickedId = state.lastPickedPlayerId;
    const fallback = stored[0] ?? null;
    if (!lastPickedId || !stored.length) {
      setWinnerId(fallback?.id ?? null);
      setWinnerName(fallback?.name ?? null);
      return;
    }
    const found = stored.find((p) => p.id === lastPickedId) ?? fallback;
    setWinnerId(found?.id ?? null);
    setWinnerName(found?.name ?? null);
  }, []);

  const title = useMemo(() => {
    if (!winnerName) return "Bravo !";
    return `Bravo ${winnerName} !`;
  }, [winnerName]);

  const secondPlayerName = useMemo(() => {
    if (!winnerId) return players[1]?.name ?? null;
    const others = players.filter((p) => p.id !== winnerId);
    return others[0]?.name ?? null;
  }, [players, winnerId]);

  return (
    <div
      className="flex min-h-dvh flex-col items-center py-0"
      style={{
        backgroundImage: `url(${THEME_3_BACKGROUND})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/60 to-black/80" />
      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center">
        <header className="flex w-full items-center justify-between px-6 pt-4">
          <Link
            href="/plan"
            aria-label="Revenir au plan"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{ borderRadius: 80, borderColor: "var(--Neutral-25, #FDFDFD)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BurgerMenu />
        </header>

        <main className="flex w-full flex-1 flex-col items-center px-6 pt-4 pb-0">
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-sm space-y-8">
              <div className="text-center">
                <h1
                  className="text-center text-white"
                  style={{
                    fontFamily: '"Space Grotesk", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontSize: 30,
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "38px",
                  }}
                >
                  {title}
                </h1>
              </div>

              {!!winnerName && (
                <div className="flex items-end justify-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="relative flex h-28 w-28 items-center justify-center rounded-full border-4"
                      style={{ backgroundColor: "#322144", borderColor: "#FFCA28" }}
                    >
                      <User className="h-10 w-10 text-white" aria-hidden="true" />
                      <div className="absolute -top-4 flex items-center justify-center rounded-full bg-black/60 px-1.5 py-1">
                        <Crown className="h-4 w-4 text-yellow-300" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="text-center text-white">
                      <p className="text-base font-semibold">{winnerName}</p>
                      <p className="text-sm text-white/80">1ᵉʳ au classement</p>
                    </div>
                  </div>

                  {secondPlayerName && (
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80"
                        style={{ backgroundColor: "#322144" }}
                      >
                        <User className="h-8 w-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="text-center text-white">
                        <p className="text-base font-semibold">{secondPlayerName}</p>
                        <p className="text-sm text-white/80">2ᵉ au classement</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="w-full px-6 pb-6">
          <div className="w-full max-w-sm mx-auto space-y-4 text-center">
            <div className="space-y-3">
              <p
                className="text-center text-white"
                style={{
                  fontFamily: '"Acumin Variable Concept", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: 24,
                  fontStyle: "normal",
                  fontWeight: 600,
                  lineHeight: "32px",
                }}
              >
                Génial, grâce à vous j’ai appris pleins de choses&nbsp;!
              </p>
              <p
                className="text-center text-white"
                style={{
                  fontFamily: '"Acumin Variable Concept", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: 18,
                  fontStyle: "normal",
                  fontWeight: 500,
                  lineHeight: "28px",
                }}
              >
                N&apos;oubliez pas d&apos;aller chercher votre récompense à l&apos;accueil&nbsp;! En attendant, on se retrouve et on pourra continuer
                de discuter.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <PrimaryCTA
                href="/quiz/reset"
                label="Retrouver Miroka"
                ariaLabel="Réinitialiser la partie et revenir voir Miroka sur le plan"
              />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

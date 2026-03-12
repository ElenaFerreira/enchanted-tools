"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { OnboardingPlayer } from "@/lib/types";
import { createOnboardingPlayer, ONBOARDING_PLAYERS_KEY, parseStoredPlayers } from "@/lib/onboarding";
import { BurgerMenu } from "../../components/BurgerMenu";
import { PrimaryCTA } from "../../components/PrimaryCTA";

export default function JoueursPage() {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<OnboardingPlayer[]>([]);

  useEffect(() => {
    setPlayers(parseStoredPlayers(typeof window !== "undefined" ? localStorage.getItem(ONBOARDING_PLAYERS_KEY) : null));
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayers((prev) => [...prev, createOnboardingPlayer(trimmed)]);
    setName("");
  };

  useEffect(() => {
    if (!players.length) return;
    try {
      localStorage.setItem(ONBOARDING_PLAYERS_KEY, JSON.stringify(players));
    } catch {
      // stockage non critique, on ignore les erreurs
    }
  }, [players]);

  return (
    <div className="flex min-h-dvh flex-col items-center py-6">
      <header className="flex w-full items-center justify-between px-6">
        <Link
          href="/onboarding/contexte"
          aria-label="Revenir à l’écran précédent"
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

      <main className="flex w-full flex-1 flex-col items-center px-6 pt-14">
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">Qui sont les joueurs&nbsp;?</h1>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ajoute un joueur ..."
            className="w-full rounded-2xl px-4 py-3 text-base text-white placeholder:text-white/70 outline-none border-none"
            style={{
              borderRadius: 16,
              background: "rgba(253, 253, 253, 0.30)",
              backdropFilter: "blur(15px)",
            }}
          />
        </form>

        <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="w-full rounded-2xl px-4 py-3 text-base font-medium text-white border-2 border-transparent"
              style={{
                borderRadius: 16,
                background: "rgba(253, 253, 253, 0.30)",
                backdropFilter: "blur(15px)",
              }}
            >
              {player.name}
            </div>
          ))}
        </div>
      </main>

      <footer className="w-full px-6 pb-6">
        <div className="mt-6 flex justify-center">
          <PrimaryCTA href="/onboarding/roles" label="Continuer" disabled={players.length === 0} />
        </div>
      </footer>
    </div>
  );
}


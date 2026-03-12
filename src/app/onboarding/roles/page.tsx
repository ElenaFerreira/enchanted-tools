"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { OnboardingPlayer } from "@/lib/types";
import {
  loadOnboardingContext,
  loadStoredRoles,
  ONBOARDING_PLAYERS_KEY,
  ONBOARDING_ROLE_OPTIONS,
  saveStoredRoles,
  type OnboardingRole,
} from "@/lib/onboarding";
import { parseStoredPlayers } from "@/lib/onboarding";
import { BurgerMenu } from "../../components/BurgerMenu";
import { PrimaryCTA } from "../../components/PrimaryCTA";

export default function RolesPage() {
  const [players] = useState<OnboardingPlayer[]>(() =>
    parseStoredPlayers(typeof window !== "undefined" ? localStorage.getItem(ONBOARDING_PLAYERS_KEY) : null),
  );
  const [context] = useState(() => loadOnboardingContext());
  const isFamily = context === "En famille";

  const [roles, setRoles] = useState<Record<string, OnboardingRole | null>>(() => {
    const existing = loadStoredRoles();
    const initial: Record<string, OnboardingRole | null> = {};
    for (const p of players) {
      const saved = existing[p.id] ?? null;
      initial[p.id] = saved;
    }

    if (!isFamily) {
      const defaultRole: OnboardingRole = context === "Entre collègues" ? "Le collègue" : "L’ami";
      for (const p of players) {
        initial[p.id] = (initial[p.id] ?? defaultRole) as OnboardingRole;
      }
      saveStoredRoles(Object.fromEntries(Object.entries(initial).filter(([, v]) => v !== null)) as Record<string, OnboardingRole>);
    }

    return initial;
  });

  const allAssigned = useMemo(() => {
    if (!players.length) return false;
    if (!isFamily) return true;
    return players.every((p) => Boolean(roles[p.id]));
  }, [isFamily, players, roles]);

  return (
    <div className="flex min-h-dvh flex-col items-center py-6">
      <header className="flex w-full items-center justify-between px-6">
        <Link
          href="/onboarding/joueurs"
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
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">Quels sont leurs rôles&nbsp;?</h1>

        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          {players.map((player) => {
            const selectedRole = roles[player.id] ?? null;
            return (
              <div
                key={player.id}
                className={[
                  "flex flex-col justify-between rounded-2xl px-3 py-3 text-sm font-medium text-white border-2",
                  selectedRole ? "border-white" : "border-transparent",
                ].join(" ")}
                style={{
                  borderRadius: 16,
                  background: "rgba(253, 253, 253, 0.30)",
                  backdropFilter: "blur(15px)",
                }}
              >
                <div className="mb-2 text-center text-base font-semibold">{player.name}</div>
                <select
                  className="mt-auto w-full rounded-xl bg-transparent px-2 py-1 text-xs text-white outline-none border border-white/40"
                  value={selectedRole ?? ""}
                  onChange={(event) => {
                    const value = event.target.value as OnboardingRole | "";
                    setRoles((prev) => {
                      const next = {
                        ...prev,
                        [player.id]: value ? (value as OnboardingRole) : null,
                      };
                      saveStoredRoles(
                        Object.fromEntries(Object.entries(next).filter(([, v]) => v !== null)) as Record<string, OnboardingRole>,
                      );
                      return next;
                    });
                  }}
                  disabled={!isFamily}
                >
                  <option value="" className="bg-[#462B7E] text-white">
                    Sélectionner un rôle
                  </option>
                  {ONBOARDING_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role} className="bg-[#462B7E] text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="w-full px-6 pb-6">
        <div className="mt-6 flex justify-center">
          <PrimaryCTA href="/plan" label="Démarrer la visite" disabled={!allAssigned} />
        </div>
      </footer>
    </div>
  );
}

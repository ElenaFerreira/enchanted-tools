"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { PrimaryCTA } from "../../components/PrimaryCTA";

const ROLE_OPTIONS = ["Le père", "La mère", "L’enfant", "Le grand-parent", "L’ami", "Le collègue"] as const;

type Role = (typeof ROLE_OPTIONS)[number];

export default function RolesPage() {
  const [players, setPlayers] = useState<string[]>([]);
  const [roles, setRoles] = useState<Record<string, Role | null>>({});

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("onboarding_players") : null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const valid = parsed.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
      setPlayers(valid);
      setRoles((prev) => {
        const next: Record<string, Role | null> = {};
        for (const p of valid) {
          next[p] = (prev[p] as Role | null) ?? null;
        }
        return next;
      });
    } catch {
      // ignore invalid storage
    }
  }, []);

  const allAssigned = useMemo(() => players.length > 0 && players.every((p) => Boolean(roles[p])), [players, roles]);

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

        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
          style={{
            borderRadius: 80,
            borderColor: "var(--Neutral-25, #FDFDFD)",
          }}
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      <main className="flex w-full flex-1 flex-col items-center px-6 pt-14">
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">Quels sont leurs rôles&nbsp;?</h1>

        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          {players.map((player, index) => {
            const selectedRole = roles[player] ?? null;
            return (
              <div
                key={`${player}-${index}`}
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
                <div className="mb-2 text-center text-base font-semibold">{player}</div>
                <select
                  className="mt-auto w-full rounded-xl bg-transparent px-2 py-1 text-xs text-white outline-none border border-white/40"
                  value={selectedRole ?? ""}
                  onChange={(event) => {
                    const value = event.target.value as Role | "";
                    setRoles((prev) => ({
                      ...prev,
                      [player]: value ? (value as Role) : null,
                    }));
                  }}
                >
                  <option value="" className="bg-[#462B7E] text-white">
                    Sélectionner un rôle
                  </option>
                  {ROLE_OPTIONS.map((role) => (
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

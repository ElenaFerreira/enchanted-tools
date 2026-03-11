"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { PrimaryCTA } from "../../components/PrimaryCTA";

const OPTIONS = ["En famille", "Entre amis", "En couple", "Entre collègues"] as const;

type Option = (typeof OPTIONS)[number];

export default function ContextePage() {
  const [selected, setSelected] = useState<Option | null>(null);

  return (
    <div className="flex min-h-dvh flex-col items-center py-6">
      <header className="flex w-full items-center justify-between px-6">
        <Link
          href="/intro"
          aria-label="Revenir à la vidéo d’introduction"
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
        <h1 className="mb-10 text-center text-2xl font-semibold text-white">Vous êtes&nbsp;:</h1>

        <div className="flex w-full max-w-sm flex-col gap-4">
          {OPTIONS.map((option) => {
            const isSelected = option === selected;
            return (
              <button
                key={option}
                type="button"
                className={[
                  "w-full rounded-2xl px-4 py-3 text-center text-base font-medium text-white",
                  "transition-colors border-2",
                  isSelected ? "border-white" : "border-transparent",
                ].join(" ")}
                style={{
                  borderRadius: 16,
                  background: "rgba(253, 253, 253, 0.30)",
                  backdropFilter: "blur(15px)",
                }}
                onClick={() => setSelected(option)}
              >
                {option}
              </button>
            );
          })}
        </div>
      </main>

      <footer className="w-full px-6 pb-6">
        <div className="flex justify-center">
          <PrimaryCTA href="/onboarding/joueurs" label="Continuer" disabled={!selected} />
        </div>
      </footer>
    </div>
  );
}


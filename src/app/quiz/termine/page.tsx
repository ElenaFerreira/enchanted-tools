"use client";

import Image from "next/image";
import { BurgerMenu } from "@/app/components/BurgerMenu";
import { PrimaryCTA } from "@/app/components/PrimaryCTA";

export default function QuizTerminePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center py-6">
      <header className="flex w-full items-center justify-between px-6">
        <Image src="/logo-mirokai.svg" alt="Logo Mirokaï" width={120} height={40} priority />
        <BurgerMenu />
      </header>

      <main className="flex w-full flex-1 flex-col items-center px-6 pt-14">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white">Quizz terminé</h1>
            <p className="mt-3 text-white/80">Bravo ! Tu as terminé les 4 thèmes.</p>
          </div>

          <div
            className="w-full rounded-2xl px-4 py-4 text-white/85"
            style={{
              borderRadius: 16,
              background: "rgba(253, 253, 253, 0.15)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p className="text-base">Tu peux continuer la visite quand tu veux.</p>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 pb-6">
        <div className="flex justify-center">
          <PrimaryCTA href="/plan" label="Retour au plan" ariaLabel="Retourner au plan" />
        </div>
      </footer>
    </div>
  );
}


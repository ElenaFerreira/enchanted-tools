"use client";

import { useEffect } from "react";
import { ONBOARDING_PLAYERS_KEY } from "@/lib/onboarding";
import { BurgerMenu } from "../components/BurgerMenu";
import InteractiveFloorPlan from "../components/InteractiveFloorPlan";

export default function PlanPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let shouldReset = false;
    try {
      const url = new URL(window.location.href);
      shouldReset = url.searchParams.get("reset") === "1";
    } catch {
      shouldReset = false;
    }

    if (!shouldReset) return;
    try {
      localStorage.removeItem(ONBOARDING_PLAYERS_KEY);
    } catch {
      // stockage non critique, on ignore les erreurs
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center font-sans">
      <header className="flex w-full items-center justify-end px-6 py-4">
        <BurgerMenu />
      </header>
      <main className="w-full flex-1 px-4 pb-16 sm:px-8 sm:pt-2 md:pb-24">
        <InteractiveFloorPlan />
      </main>
    </div>
  );
}


"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ONBOARDING_PLAYERS_KEY } from "@/lib/onboarding";
import { BurgerMenu } from "../components/BurgerMenu";
import InteractiveFloorPlan from "../components/InteractiveFloorPlan";

export default function PlanPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldReset = searchParams.get("reset") === "1";
    if (!shouldReset) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ONBOARDING_PLAYERS_KEY);
      }
    } catch {
      // stockage non critique, on ignore les erreurs
    }
  }, [searchParams]);

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


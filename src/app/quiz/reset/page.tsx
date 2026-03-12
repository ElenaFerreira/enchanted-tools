"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDefaultQuizState, saveQuizState } from "@/lib/quiz/state";
import {
  ONBOARDING_CONTEXT_KEY,
  ONBOARDING_PLAYERS_KEY,
  ONBOARDING_ROLES_KEY,
} from "@/lib/onboarding";

export default function QuizResetPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(ONBOARDING_PLAYERS_KEY);
      localStorage.removeItem(ONBOARDING_CONTEXT_KEY);
      localStorage.removeItem(ONBOARDING_ROLES_KEY);
      saveQuizState(createDefaultQuizState());
    } catch {
      // stockage non critique, on ignore les erreurs
    } finally {
      router.replace("/plan");
    }
  }, [router]);

  return null;
}


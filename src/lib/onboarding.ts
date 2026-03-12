import type { OnboardingPlayer } from "@/lib/types";

export const ONBOARDING_PLAYERS_KEY = "onboarding_players";

export function createOnboardingPlayer(name: string): OnboardingPlayer {
  return { id: crypto.randomUUID(), name: name.trim() };
}

export function parseStoredPlayers(raw: string | null): OnboardingPlayer[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const first = parsed[0];
    const isNewFormat =
      first != null &&
      typeof first === "object" &&
      "id" in first &&
      "name" in first &&
      typeof (first as OnboardingPlayer).name === "string";
    if (isNewFormat) {
      return parsed
        .filter(
          (p): p is OnboardingPlayer =>
            p != null &&
            typeof p === "object" &&
            "id" in p &&
            "name" in p &&
            typeof (p as OnboardingPlayer).name === "string",
        )
        .map((p) => ({ id: (p as OnboardingPlayer).id, name: String((p as OnboardingPlayer).name).trim() }))
        .filter((p) => p.name.length > 0);
    }
    return (parsed as string[])
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((name) => createOnboardingPlayer(name));
  } catch {
    return [];
  }
}

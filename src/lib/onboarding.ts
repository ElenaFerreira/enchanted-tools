import type { OnboardingPlayer } from "@/lib/types";

export const ONBOARDING_PLAYERS_KEY = "onboarding_players";
export const ONBOARDING_CONTEXT_KEY = "onboarding_context";
export const ONBOARDING_ROLES_KEY = "onboarding_roles";

export const ONBOARDING_CONTEXT_OPTIONS = ["En famille", "Entre amis", "En couple", "Entre collègues"] as const;
export type OnboardingContext = (typeof ONBOARDING_CONTEXT_OPTIONS)[number];

export const ONBOARDING_ROLE_OPTIONS = ["Le père", "La mère", "L’enfant", "Le grand-parent", "L’ami", "Le collègue"] as const;
export type OnboardingRole = (typeof ONBOARDING_ROLE_OPTIONS)[number];

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

export function loadOnboardingContext(): OnboardingContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_CONTEXT_KEY);
    if (!raw) return null;
    const value = String(raw).trim();
    return (ONBOARDING_CONTEXT_OPTIONS as readonly string[]).includes(value) ? (value as OnboardingContext) : null;
  } catch {
    return null;
  }
}

export function saveOnboardingContext(value: OnboardingContext) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_CONTEXT_KEY, value);
  } catch {
    // stockage non critique, on ignore les erreurs
  }
}

export function parseStoredRoles(raw: string | null): Record<string, OnboardingRole> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, OnboardingRole> = {};
    for (const [playerId, role] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof playerId !== "string" || !playerId.trim()) continue;
      if (typeof role !== "string") continue;
      if (!(ONBOARDING_ROLE_OPTIONS as readonly string[]).includes(role)) continue;
      out[playerId] = role as OnboardingRole;
    }
    return out;
  } catch {
    return {};
  }
}

export function loadStoredRoles(): Record<string, OnboardingRole> {
  if (typeof window === "undefined") return {};
  try {
    return parseStoredRoles(localStorage.getItem(ONBOARDING_ROLES_KEY));
  } catch {
    return {};
  }
}

export function saveStoredRoles(roles: Record<string, OnboardingRole>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_ROLES_KEY, JSON.stringify(roles));
  } catch {
    // stockage non critique, on ignore les erreurs
  }
}

import Link from "next/link";
import InteractiveFloorPlan from "../components/InteractiveFloorPlan";

export default function PlanPage() {
  return (
    <div className="flex min-h-screen flex-col items-center font-sans">
      <main className="w-full px-4 pt-6 pb-16 sm:px-8 sm:pt-10 md:pt-14 md:pb-24">
        <InteractiveFloorPlan />
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/30 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur transition hover:bg-black/40"
          aria-label="Accéder à l’administration"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          Admin
        </Link>
      </div>
    </div>
  );
}


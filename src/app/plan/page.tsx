"use client";

import { BurgerMenu } from "../components/BurgerMenu";
import InteractiveFloorPlan from "../components/InteractiveFloorPlan";

export default function PlanPage() {
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


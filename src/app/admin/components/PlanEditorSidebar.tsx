"use client";

import type { Module } from "@/lib/types";

interface PlanEditorSidebarProps {
  loading: boolean;
  unplaced: Module[];
  selectedModule: Module | undefined;
  draggingId: string | null;
  onDragStart: (e: React.DragEvent, moduleId: string) => void;
  onRemoveFromPlan: (moduleId: string) => void;
}

export function PlanEditorSidebar({
  loading,
  unplaced,
  selectedModule,
  draggingId,
  onDragStart,
  onRemoveFromPlan,
}: PlanEditorSidebarProps) {
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Modules à placer
      </h3>

      {/* Liste des modules non placés */}
      {loading ? (
        <p className="mt-4 text-xs text-zinc-400">Chargement...</p>
      ) : unplaced.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-400">
          Tous les modules sont placés sur le plan.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {unplaced.map((mod) => (
            <div
              key={mod.id}
              draggable
              onDragStart={(e) => onDragStart(e, mod.id)}
              className={`flex cursor-grab items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm transition active:cursor-grabbing hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 ${
                draggingId === mod.id ? "opacity-50" : ""
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {mod.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                  {mod.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {mod.media_type === "video" ? "Vidéo" : "Audio"}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-zinc-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Info module sélectionné */}
      {selectedModule && (
        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Module sélectionné
          </h3>
          <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              #{selectedModule.number} — {selectedModule.name}
            </p>
            <p className="mt-1 text-xs text-zinc-500 line-clamp-3">
              {selectedModule.description || "Pas de description"}
            </p>
            <button
              onClick={() => onRemoveFromPlan(selectedModule.id)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Retirer du plan
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

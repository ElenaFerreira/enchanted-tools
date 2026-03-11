"use client";

import type { Module } from "@/lib/types";

interface Zone {
  id: string;
  name: string;
  description: string;
  borderColor: string;
}

interface FloorPlanInfoPanelProps {
  selectedZone: Zone | null;
  selectedModule: Module | null;
  onClose: () => void;
}

export function FloorPlanInfoPanel({ selectedZone, selectedModule, onClose }: FloorPlanInfoPanelProps) {
  const isOpen = selectedZone !== null;

  return (
    <div className="mt-4 px-4 relative z-20">
      <div
        className={`mx-auto w-full sm:w-[420px] lg:max-w-[480px] overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          borderRadius: 4,
          border: isOpen ? "0.3px solid rgba(228, 228, 231, 1)" : "0.3px solid transparent",
          background: "#ffffff",
        }}
      >
      {/* Info zone */}
      {selectedZone && (
        <div className="flex items-start justify-between gap-4 bg-white p-5 dark:bg-zinc-900">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedZone.borderColor }} />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{selectedZone.name}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{selectedZone.description}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
      )}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      aria-label="Fermer"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

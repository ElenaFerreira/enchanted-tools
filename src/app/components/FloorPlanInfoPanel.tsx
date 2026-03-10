"use client";

import Image from "next/image";
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
  const isOpen = selectedZone !== null || selectedModule !== null;

  return (
    <div
      className={`mt-4 overflow-hidden rounded-xl border transition-all duration-300 ${
        isOpen
          ? "max-h-60 opacity-100 border-zinc-200 dark:border-zinc-700"
          : "max-h-0 opacity-0 border-transparent"
      }`}
    >
      {/* Info zone */}
      {selectedZone && (
        <div className="flex items-start justify-between gap-4 bg-white p-5 dark:bg-zinc-900">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedZone.borderColor }}
              />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {selectedZone.name}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {selectedZone.description}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
      )}

      {/* Info module */}
      {selectedModule && (
        <div className="flex items-start justify-between gap-4 bg-white p-5 dark:bg-zinc-900">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {selectedModule.number}
              </span>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {selectedModule.name}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  selectedModule.media_type === "video"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                }`}
              >
                {selectedModule.media_type === "video" ? "Vidéo" : "Audio"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {selectedModule.description || "Pas de description disponible."}
            </p>
            {selectedModule.images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {selectedModule.images.map((img, i) => (
                  <Image
                    key={i}
                    src={img}
                    alt={`${selectedModule.name} - ${i + 1}`}
                    width={64}
                    height={64}
                    className="shrink-0 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                ))}
              </div>
            )}
          </div>
          <CloseButton onClick={onClose} />
        </div>
      )}
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

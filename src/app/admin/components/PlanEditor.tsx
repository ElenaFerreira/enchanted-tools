"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/types";
import Image from "next/image";

const VB_WIDTH = 7791;
const VB_HEIGHT = 4500;

export default function PlanEditor() {
  const supabase = createClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const placed = modules.filter((m) => m.position_x !== null && m.position_y !== null);
  const unplaced = modules.filter((m) => m.position_x === null || m.position_y === null);

  const fetchModules = useCallback(async () => {
    const { data } = await supabase
      .from("modules")
      .select("*")
      .order("number", { ascending: true });
    setModules((data as Module[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const clientToSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = Math.round(((clientX - rect.left) / rect.width) * VB_WIDTH);
      const y = Math.round(((clientY - rect.top) / rect.height) * VB_HEIGHT);
      if (x < 0 || x > VB_WIDTH || y < 0 || y > VB_HEIGHT) return null;
      return { x, y };
    },
    []
  );

  const savePosition = useCallback(
    async (moduleId: string, x: number | null, y: number | null) => {
      await supabase
        .from("modules")
        .update({ position_x: x, position_y: y })
        .eq("id", moduleId);
      fetchModules();
    },
    [supabase, fetchModules]
  );

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData("moduleId", moduleId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(moduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const pos = clientToSvg(e.clientX, e.clientY);
    if (pos) setDragPreview(pos);
  };

  const handleDragLeave = () => {
    setDragPreview(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("moduleId");
    const pos = clientToSvg(e.clientX, e.clientY);
    setDragPreview(null);
    setDraggingId(null);
    if (moduleId && pos) {
      await savePosition(moduleId, pos.x, pos.y);
    }
  };

  const handlePinPointerDown = (e: React.PointerEvent<SVGGElement>, moduleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(moduleId);
    setSelectedId(moduleId);
    const svg = svgRef.current;
    if (!svg) return;

    const handleMove = (ev: PointerEvent) => {
      const pos = clientToSvg(ev.clientX, ev.clientY);
      if (pos) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, position_x: pos.x, position_y: pos.y } : m
          )
        );
      }
    };

    const handleUp = async (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setDraggingId(null);
      const pos = clientToSvg(ev.clientX, ev.clientY);
      if (pos) {
        await savePosition(moduleId, pos.x, pos.y);
      }
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  };

  const handleRemoveFromPlan = async (moduleId: string) => {
    await savePosition(moduleId, null, null);
    setSelectedId(null);
  };

  const selectedModule = modules.find((m) => m.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden">
      {/* Sidebar — modules non placés */}
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Modules à placer
        </h3>
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
                onDragStart={(e) => handleDragStart(e, mod.id)}
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
                onClick={() => handleRemoveFromPlan(selectedModule.id)}
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

      {/* Zone du plan */}
      <div
        className="flex-1 overflow-auto bg-zinc-100 p-6 dark:bg-zinc-900"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative mx-auto w-full max-w-5xl">
          <Image
            src="/plan-1.png"
            alt="Plan du niveau -1"
            width={7791}
            height={4500}
            className="block w-full h-auto rounded-xl shadow-lg"
            priority
          />

          {/* SVG overlay avec les pins */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMinYMin meet"
            onClick={() => setSelectedId(null)}
          >
            {/* Preview du drop */}
            {dragPreview && (
              <circle
                cx={dragPreview.x}
                cy={dragPreview.y}
                r={80}
                fill="rgba(59, 130, 246, 0.25)"
                stroke="rgba(59, 130, 246, 0.6)"
                strokeWidth={4}
                strokeDasharray="12 6"
                className="pointer-events-none"
              />
            )}

            {/* Pins des modules placés */}
            {placed.map((mod) => {
              const isSelected = selectedId === mod.id;
              const isDragging = draggingId === mod.id;
              return (
                <g
                  key={mod.id}
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  onPointerDown={(e) => handlePinPointerDown(e, mod.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(mod.id);
                  }}
                >
                  {/* Ombre */}
                  <circle
                    cx={(mod.position_x ?? 0) + 4}
                    cy={(mod.position_y ?? 0) + 4}
                    r={isSelected ? 90 : 75}
                    fill="rgba(0,0,0,0.15)"
                    className="pointer-events-none"
                  />
                  {/* Cercle principal */}
                  <circle
                    cx={mod.position_x ?? 0}
                    cy={mod.position_y ?? 0}
                    r={isSelected ? 90 : 75}
                    fill={isSelected ? "#2563eb" : "#18181b"}
                    stroke="white"
                    strokeWidth={isSelected ? 8 : 5}
                  />
                  {/* Numéro du module */}
                  <text
                    x={mod.position_x ?? 0}
                    y={(mod.position_y ?? 0) + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={isSelected ? 56 : 48}
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {mod.number}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

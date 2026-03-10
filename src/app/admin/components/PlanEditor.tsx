"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/types";
import Image from "next/image";
import { PlanEditorSidebar } from "./PlanEditorSidebar";

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
      .select("id, number, name, description, media_type, media_url, images, position_x, position_y, zone_id")
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
      <PlanEditorSidebar
        loading={loading}
        unplaced={unplaced}
        selectedModule={selectedModule}
        draggingId={draggingId}
        onDragStart={handleDragStart}
        onRemoveFromPlan={handleRemoveFromPlan}
      />

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
                  <circle
                    cx={(mod.position_x ?? 0) + 4}
                    cy={(mod.position_y ?? 0) + 4}
                    r={isSelected ? 90 : 75}
                    fill="rgba(0,0,0,0.15)"
                    className="pointer-events-none"
                  />
                  <circle
                    cx={mod.position_x ?? 0}
                    cy={mod.position_y ?? 0}
                    r={isSelected ? 90 : 75}
                    fill={isSelected ? "#2563eb" : "#18181b"}
                    stroke="white"
                    strokeWidth={isSelected ? 8 : 5}
                  />
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

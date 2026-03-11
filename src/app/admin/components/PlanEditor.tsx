"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/types";
import Image from "next/image";
import { PlanEditorSidebar } from "./PlanEditorSidebar";
import { BASE_VB_WIDTH, BASE_VB_HEIGHT, MOBILE_VB, DESKTOP_VB } from "@/app/components/InteractiveFloorPlan.config";

type PlanMode = "mobile" | "desktop";

export default function PlanEditor() {
  const supabase = createClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planMode, setPlanMode] = useState<PlanMode>("desktop");

  const vb = planMode === "desktop" ? DESKTOP_VB : MOBILE_VB;
  const legacyScaleX = vb.width / BASE_VB_WIDTH;
  const legacyScaleY = vb.height / BASE_VB_HEIGHT;
  const legacyScale = Math.min(legacyScaleX, legacyScaleY);

  const getPos = useCallback(
    (m: Module): { x: number | null; y: number | null } => {
      const x = planMode === "desktop" ? (m.position_x_desktop ?? m.position_x) : (m.position_x_mobile ?? m.position_x);
      const y = planMode === "desktop" ? (m.position_y_desktop ?? m.position_y) : (m.position_y_mobile ?? m.position_y);
      return { x, y };
    },
    [planMode],
  );

  const placed = modules.filter((m) => {
    const { x, y } = getPos(m);
    return x !== null && y !== null;
  });
  const unplaced = modules.filter((m) => {
    const { x, y } = getPos(m);
    return x === null || y === null;
  });

  const fetchModules = useCallback(async () => {
    const withNewColumns = await supabase
      .from("modules")
      .select(
        "id, number, name, description, media_type, media_url, images, position_x, position_y, position_x_mobile, position_y_mobile, position_x_desktop, position_y_desktop, zone_id",
      )
      .order("number", { ascending: true });

    if (withNewColumns.error) {
      const legacy = await supabase
        .from("modules")
        .select("id, number, name, description, media_type, media_url, images, position_x, position_y, zone_id")
        .order("number", { ascending: true });
      setModules((legacy.data as Module[]) ?? []);
      setLoading(false);
      return;
    }

    setModules((withNewColumns.data as Module[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const clientToVb = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const x = Math.round(((clientX - rect.left) / rect.width) * vb.width);
      const y = Math.round(((clientY - rect.top) / rect.height) * vb.height);
      if (x < 0 || x > vb.width || y < 0 || y > vb.height) return null;
      return { x, y };
    },
    [vb.height, vb.width],
  );

  const savePosition = useCallback(
    async (moduleId: string, x: number | null, y: number | null) => {
      const patch: Partial<Module> =
        planMode === "desktop" ? { position_x_desktop: x, position_y_desktop: y } : { position_x_mobile: x, position_y_mobile: y };

      await supabase.from("modules").update(patch).eq("id", moduleId);
      fetchModules();
    },
    [supabase, fetchModules, planMode],
  );

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData("moduleId", moduleId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(moduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const pos = clientToVb(e.clientX, e.clientY);
    if (pos) setDragPreview(pos);
  };

  const handleDragLeave = () => {
    setDragPreview(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("moduleId");
    const pos = clientToVb(e.clientX, e.clientY);
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
      const pos = clientToVb(ev.clientX, ev.clientY);
      if (pos) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? planMode === "desktop"
                ? { ...m, position_x_desktop: pos.x, position_y_desktop: pos.y }
                : { ...m, position_x_mobile: pos.x, position_y_mobile: pos.y }
              : m,
          ),
        );
      }
    };

    const handleUp = async (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      setDraggingId(null);
      const pos = clientToVb(ev.clientX, ev.clientY);
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
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-0">
      <PlanEditorSidebar
        loading={loading}
        unplaced={unplaced}
        selectedModule={selectedModule}
        draggingId={draggingId}
        onDragStart={handleDragStart}
        onRemoveFromPlan={handleRemoveFromPlan}
      />

      {/* Zone du plan */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Placement des modules — {planMode === "desktop" ? "Desktop" : "Mobile"}
            </h2>
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setPlanMode("mobile")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  planMode === "mobile"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setPlanMode("desktop")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  planMode === "desktop"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                Desktop
              </button>
            </div>
          </div>

          <div className={["relative rounded-2xl bg-[#462B7E] p-4", planMode === "mobile" ? "max-w-xs mx-auto" : ""].join(" ")}>
            <Image
              src={vb.src}
              alt="Plan du niveau -1"
              width={vb.width}
              height={vb.height}
              className="block w-full h-auto"
              sizes="(min-width: 1024px) 1156px, 100vw"
              priority
            />

            {/* SVG overlay avec les pins */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${vb.width} ${vb.height}`}
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMinYMin meet"
              onClick={() => setSelectedId(null)}
            >
              {/* Preview du drop */}
              {dragPreview && (
                <circle
                  cx={dragPreview.x}
                  cy={dragPreview.y}
                  r={80 * legacyScale}
                  fill="rgba(59, 130, 246, 0.25)"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth={4 * legacyScale}
                  strokeDasharray="12 6"
                  className="pointer-events-none"
                />
              )}

              {/* Pins des modules placés */}
              {placed.map((mod) => {
                const isSelected = selectedId === mod.id;
                const isDragging = draggingId === mod.id;
                const { x, y } = getPos(mod);
                if (x === null || y === null) return null;
                const isLegacy =
                  (planMode === "desktop" ? mod.position_x_desktop : mod.position_x_mobile) === null ||
                  (planMode === "desktop" ? mod.position_y_desktop : mod.position_y_mobile) === null;
                const cx = isLegacy ? x * legacyScaleX : x;
                const cy = isLegacy ? y * legacyScaleY : y;
                const sizeFactor = planMode === "mobile" ? 3 : 2;
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
                      cx={cx + 4 * legacyScale}
                      cy={cy + 4 * legacyScale}
                      r={(isSelected ? 90 : 75) * legacyScale * sizeFactor}
                      fill="rgba(0,0,0,0.15)"
                      className="pointer-events-none"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={(isSelected ? 90 : 75) * legacyScale * sizeFactor}
                      fill={isSelected ? "#2563eb" : "#18181b"}
                      stroke="white"
                      strokeWidth={(isSelected ? 8 : 5) * legacyScale}
                    />
                    <text
                      x={cx}
                      y={cy + 6 * legacyScale * sizeFactor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={(isSelected ? 56 : 48) * legacyScale * sizeFactor}
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
    </div>
  );
}

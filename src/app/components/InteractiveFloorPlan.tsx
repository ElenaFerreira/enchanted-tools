"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/types";
import { FloorPlanInfoPanel } from "./FloorPlanInfoPanel";

interface Zone {
  id: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  points: string;
}

const BASE_VB_WIDTH = 7791;
const BASE_VB_HEIGHT = 4500;

const MOBILE_VB = { width: 280, height: 513, src: "/mobile-plan.svg" as const };
const DESKTOP_VB = { width: 1156, height: 630, src: "/desktop-plan.svg" as const };

const ZONES_META: Omit<Zone, "points">[] = [
  {
    id: "mirokai",
    name: "Mirokaï Experience",
    description:
      "Espace principal dédié à l'expérience immersive Mirokaï. Cette grande salle accueille les visiteurs pour une découverte interactive unique.",
    color: "rgba(200, 0, 120, 0.08)",
    hoverColor: "rgba(200, 0, 120, 0.22)",
    borderColor: "rgba(200, 0, 120, 0.7)",
  },
  {
    id: "spoon",
    name: "Zone Partenaire Spoon",
    description: "Espace dédié au partenaire Spoon. Zone incluant les E.A.S., le lobby et les espaces de circulation principaux.",
    color: "rgba(0, 190, 190, 0.08)",
    hoverColor: "rgba(0, 190, 190, 0.22)",
    borderColor: "rgba(0, 190, 190, 0.7)",
  },
  {
    id: "regie",
    name: "Régie",
    description: "Local technique de régie. Poste de contrôle pour la gestion des équipements audiovisuels et techniques de l'espace.",
    color: "rgba(30, 30, 180, 0.08)",
    hoverColor: "rgba(30, 30, 180, 0.25)",
    borderColor: "rgba(30, 30, 180, 0.8)",
  },
  {
    id: "cyclage",
    name: "Salle de Cyclage",
    description:
      "Salle de cyclage comprenant le studio, le stockage et les espaces techniques associés. Zone dédiée à la préparation et au recyclage du contenu.",
    color: "rgba(150, 0, 180, 0.08)",
    hoverColor: "rgba(150, 0, 180, 0.22)",
    borderColor: "rgba(150, 0, 180, 0.7)",
  },
];

const ZONE_POINTS_MOBILE: Record<string, string> = {
  mirokai: "99,8 272,8 272,198 99,198",
  spoon: "77,199 222,199 222,386 180,386 77,318 77,199",
  regie: "65,36 99,36 99,73 65,73",
  cyclage: "7,74 99,74 99,133 7,133",
};

const ZONE_POINTS_DESKTOP: Record<string, string> = {
  mirokai: "17,17 447,17 447,407 17,407",
  spoon: "447,128 869,128 867,231 719,457 447,457",
  regie: "82,407 166,407 166,483 82,483",
  cyclage: "166,407 300,407 300,615 166,615",
};

const ZONES_MOBILE: Zone[] = ZONES_META.map((z) => ({
  ...z,
  points: ZONE_POINTS_MOBILE[z.id] ?? "",
}));

const ZONES_DESKTOP: Zone[] = ZONES_META.map((z) => ({
  ...z,
  points: ZONE_POINTS_DESKTOP[z.id] ?? "",
}));

export default function InteractiveFloorPlan() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const vb = isDesktop ? DESKTOP_VB : MOBILE_VB;
  const zones = isDesktop ? ZONES_DESKTOP : ZONES_MOBILE;
  const legacyScale = useMemo(() => {
    const scaleX = vb.width / BASE_VB_WIDTH;
    const scaleY = vb.height / BASE_VB_HEIGHT;
    return { scaleX, scaleY, scale: Math.min(scaleX, scaleY) };
  }, [vb.height, vb.width]);

  const pinSizes = useMemo(() => {
    const r = 70 * legacyScale.scale;
    const ring = 90 * legacyScale.scale;
    const ringSelected = 110 * legacyScale.scale;
    const fontSize = 48 * legacyScale.scale;
    return {
      r,
      ring,
      ringSelected,
      fontSize,
      stroke: 6 * legacyScale.scale,
      shadowOffset: 3 * legacyScale.scale,
    };
  }, [legacyScale.scale]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const withNewColumns = await supabase
        .from("modules")
        .select(
          "id, number, name, description, media_type, images, position_x, position_y, position_x_mobile, position_y_mobile, position_x_desktop, position_y_desktop",
        )
        .order("number", { ascending: true });

      if (withNewColumns.error) {
        const legacy = await supabase
          .from("modules")
          .select("id, number, name, description, media_type, images, position_x, position_y")
          .order("number", { ascending: true });
        if (legacy.data) setModules(legacy.data as Module[]);
        return;
      }

      if (withNewColumns.data) setModules(withNewColumns.data as Module[]);
    })();
  }, []);

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedModule(null);
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }, []);

  const handleModuleClick = useCallback((mod: Module) => {
    setSelectedZone(null);
    setSelectedModule((prev) => (prev?.id === mod.id ? null : mod));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
    setSelectedModule(null);
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Titre */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">Plan</h2>
      </div>

      {/* Container du plan */}
      <div className="relative mx-auto w-[80vw] max-w-[300px] overflow-hidden sm:w-full sm:max-w-none">
        <Image
          src={vb.src}
          alt="Plan du niveau -1"
          width={vb.width}
          height={vb.height}
          className="block w-full h-auto"
          sizes="(min-width: 1024px) 1156px, 100vw"
          priority
        />

        {/* Overlay SVG */}
        <svg
          viewBox={`0 0 ${vb.width} ${vb.height}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Zones cliquables */}
          {zones.map((zone) => (
            <polygon
              key={zone.id}
              points={zone.points}
              fill={selectedZone?.id === zone.id ? zone.hoverColor : hoveredZone === zone.id ? zone.hoverColor : zone.color}
              stroke={zone.borderColor}
              strokeWidth={
                selectedZone?.id === zone.id ? 12 * legacyScale.scale : hoveredZone === zone.id ? 10 * legacyScale.scale : 4 * legacyScale.scale
              }
              strokeDasharray={selectedZone?.id === zone.id || hoveredZone === zone.id ? "none" : "24 12"}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => handleZoneClick(zone)}
            />
          ))}

          {/* Modules placés */}
          {modules.map((mod) => {
            const isSelected = selectedModule?.id === mod.id;
            const vbX = isDesktop ? mod.position_x_desktop : mod.position_x_mobile;
            const vbY = isDesktop ? mod.position_y_desktop : mod.position_y_mobile;
            const legacyX = mod.position_x;
            const legacyY = mod.position_y;

            const cx = vbX !== null ? vbX : legacyX !== null ? legacyX * legacyScale.scaleX : null;
            const cy = vbY !== null ? vbY : legacyY !== null ? legacyY * legacyScale.scaleY : null;
            if (cx === null || cy === null) return null;
            return (
              <g
                key={mod.id}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleModuleClick(mod);
                }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? pinSizes.ringSelected : pinSizes.ring}
                  fill={isSelected ? "rgba(37, 99, 235, 0.15)" : "transparent"}
                  stroke={isSelected ? "rgba(37, 99, 235, 0.4)" : "transparent"}
                  strokeWidth={4}
                  className="transition-all duration-200"
                />
                <circle
                  cx={cx + pinSizes.shadowOffset}
                  cy={cy + pinSizes.shadowOffset}
                  r={pinSizes.r}
                  fill="rgba(0,0,0,0.2)"
                  className="pointer-events-none"
                />
                <circle cx={cx} cy={cy} r={pinSizes.r} fill={isSelected ? "#2563eb" : "#18181b"} stroke="white" strokeWidth={pinSizes.stroke} />
                <text
                  x={cx}
                  y={cy + 5 * legacyScale.scale}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={pinSizes.fontSize}
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

        {/* Tooltip */}
        {hoveredZone && !selectedZone && !selectedModule && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 z-20">
            <div className="rounded-lg bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
              {zones.find((z) => z.id === hoveredZone)?.name}
            </div>
          </div>
        )}
      </div>

      {/* Panneau d'information */}
      <FloorPlanInfoPanel selectedZone={selectedZone} selectedModule={selectedModule} onClose={handleClosePanel} />

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneClick(zone)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              selectedZone?.id === zone.id
                ? "border-zinc-400 bg-zinc-100 text-zinc-800 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.borderColor }} />
            {zone.name}
          </button>
        ))}
      </div>
    </div>
  );
}

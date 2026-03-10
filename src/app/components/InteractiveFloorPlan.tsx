"use client";

import { useState, useCallback, useEffect } from "react";
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

const VB_WIDTH = 7791;
const VB_HEIGHT = 4500;

const ZONES: Zone[] = [
  {
    id: "mirokai",
    name: "Mirokaï Experience",
    description:
      "Espace principal dédié à l'expérience immersive Mirokaï. Cette grande salle accueille les visiteurs pour une découverte interactive unique.",
    color: "rgba(200, 0, 120, 0.08)",
    hoverColor: "rgba(200, 0, 120, 0.22)",
    borderColor: "rgba(200, 0, 120, 0.7)",
    points: "378,303 3094,330 3094,2790 378,2790",
  },
  {
    id: "spoon",
    name: "Zone Partenaire Spoon",
    description:
      "Espace dédié au partenaire Spoon. Zone incluant les E.A.S., le lobby et les espaces de circulation principaux.",
    color: "rgba(0, 190, 190, 0.08)",
    hoverColor: "rgba(0, 190, 190, 0.22)",
    borderColor: "rgba(0, 190, 190, 0.7)",
    points: "3094,990 5804,990 5804,1626 4774,3178 3088,3178",
  },
  {
    id: "regie",
    name: "Régie",
    description:
      "Local technique de régie. Poste de contrôle pour la gestion des équipements audiovisuels et techniques de l'espace.",
    color: "rgba(30, 30, 180, 0.08)",
    hoverColor: "rgba(30, 30, 180, 0.25)",
    borderColor: "rgba(30, 30, 180, 0.8)",
    points: "845,2799 1279,2799 1279,3274 845,3274",
  },
  {
    id: "cyclage",
    name: "Salle de Cyclage",
    description:
      "Salle de cyclage comprenant le studio, le stockage et les espaces techniques associés. Zone dédiée à la préparation et au recyclage du contenu.",
    color: "rgba(150, 0, 180, 0.08)",
    hoverColor: "rgba(150, 0, 180, 0.22)",
    borderColor: "rgba(150, 0, 180, 0.7)",
    points: "1299,2799 2173,2799 2173,4086 1299,4086",
  },
];

export default function InteractiveFloorPlan() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("modules")
      .select("id, number, name, description, media_type, images, position_x, position_y")
      .not("position_x", "is", null)
      .order("number", { ascending: true })
      .then(({ data }) => {
        if (data) setModules(data as Module[]);
      });
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
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          Plan interactif
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cliquez sur une zone ou un module pour en savoir plus
        </p>
      </div>

      {/* Container du plan */}
      <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
        <Image
          src="/plan-1.png"
          alt="Plan du niveau -1"
          width={7791}
          height={4500}
          className="block w-full h-auto"
          priority
        />

        {/* Overlay SVG */}
        <svg
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Zones cliquables */}
          {ZONES.map((zone) => (
            <polygon
              key={zone.id}
              points={zone.points}
              fill={
                selectedZone?.id === zone.id
                  ? zone.hoverColor
                  : hoveredZone === zone.id
                  ? zone.hoverColor
                  : zone.color
              }
              stroke={zone.borderColor}
              strokeWidth={
                selectedZone?.id === zone.id
                  ? 12
                  : hoveredZone === zone.id
                  ? 10
                  : 4
              }
              strokeDasharray={
                selectedZone?.id === zone.id || hoveredZone === zone.id
                  ? "none"
                  : "24 12"
              }
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => handleZoneClick(zone)}
            />
          ))}

          {/* Modules placés */}
          {modules.map((mod) => {
            const isSelected = selectedModule?.id === mod.id;
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
                  cx={mod.position_x ?? 0}
                  cy={mod.position_y ?? 0}
                  r={isSelected ? 110 : 90}
                  fill={isSelected ? "rgba(37, 99, 235, 0.15)" : "transparent"}
                  stroke={isSelected ? "rgba(37, 99, 235, 0.4)" : "transparent"}
                  strokeWidth={4}
                  className="transition-all duration-200"
                />
                <circle
                  cx={(mod.position_x ?? 0) + 3}
                  cy={(mod.position_y ?? 0) + 3}
                  r={70}
                  fill="rgba(0,0,0,0.2)"
                  className="pointer-events-none"
                />
                <circle
                  cx={mod.position_x ?? 0}
                  cy={mod.position_y ?? 0}
                  r={70}
                  fill={isSelected ? "#2563eb" : "#18181b"}
                  stroke="white"
                  strokeWidth={6}
                />
                <text
                  x={mod.position_x ?? 0}
                  y={(mod.position_y ?? 0) + 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={48}
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
              {ZONES.find((z) => z.id === hoveredZone)?.name}
            </div>
          </div>
        )}
      </div>

      {/* Panneau d'information */}
      <FloorPlanInfoPanel
        selectedZone={selectedZone}
        selectedModule={selectedModule}
        onClose={handleClosePanel}
      />

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneClick(zone)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              selectedZone?.id === zone.id
                ? "border-zinc-400 bg-zinc-100 text-zinc-800 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: zone.borderColor }}
            />
            {zone.name}
          </button>
        ))}
      </div>
    </div>
  );
}

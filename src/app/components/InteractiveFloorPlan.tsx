"use client";

import { useState, useCallback, useRef, type MouseEvent } from "react";
import Image from "next/image";

interface Zone {
  id: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  points: string; // SVG polygon points
}

// Dimensions réelles de l'image plan-1.png
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
    // Magenta zone — grand rectangle gauche
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
    // Cyan zone — polygone irrégulier centre-droite avec mur diagonal
    points:
      "3094,990 5804,990 5804,1626 4774,3178 3088,3178",
  },
  {
    id: "regie",
    name: "Régie",
    description:
      "Local technique de régie. Poste de contrôle pour la gestion des équipements audiovisuels et techniques de l'espace.",
    color: "rgba(30, 30, 180, 0.08)",
    hoverColor: "rgba(30, 30, 180, 0.25)",
    borderColor: "rgba(30, 30, 180, 0.8)",
    // Blue zone — petit rectangle
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
    // Purple zone — rectangle bas-gauche
    points: "1299,2799 2173,2799 2173,4086 1299,4086",
  },
];

// Passer à true pour afficher les coordonnées SVG au survol (mode calibration)
const DEBUG_MODE = false;

export default function InteractiveFloorPlan() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      if (!DEBUG_MODE || !svgRef.current) return;
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = Math.round(
        ((e.clientX - rect.left) / rect.width) * VB_WIDTH
      );
      const y = Math.round(
        ((e.clientY - rect.top) / rect.height) * VB_HEIGHT
      );
      setMouseCoords({ x, y });
    },
    []
  );

  const handleMouseLeaveContainer = useCallback(() => {
    setMouseCoords(null);
  }, []);

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Titre */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
          Plan interactif
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cliquez sur une zone pour en savoir plus
        </p>
      </div>

      {/* Container du plan */}
      <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
        {/* Image du plan */}
        <Image
          src="/plan-1.png"
          alt="Plan du niveau -1"
          width={7791}
          height={4500}
          className="block w-full h-auto"
          priority
        />

        {/* Overlay SVG interactif */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMinYMin meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeaveContainer}
        >
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

          {/* Crosshair en mode debug */}
          {DEBUG_MODE && mouseCoords && (
            <>
              <line
                x1={mouseCoords.x}
                y1={0}
                x2={mouseCoords.x}
                y2={VB_HEIGHT}
                stroke="red"
                strokeWidth={2}
                opacity={0.5}
                pointerEvents="none"
              />
              <line
                x1={0}
                y1={mouseCoords.y}
                x2={VB_WIDTH}
                y2={mouseCoords.y}
                stroke="red"
                strokeWidth={2}
                opacity={0.5}
                pointerEvents="none"
              />
            </>
          )}
        </svg>

        {/* Tooltip au survol */}
        {hoveredZone && !selectedZone && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 z-20">
            <div className="rounded-lg bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
              {ZONES.find((z) => z.id === hoveredZone)?.name}
            </div>
          </div>
        )}

        {/* Affichage coordonnées en mode debug */}
        {DEBUG_MODE && mouseCoords && (
          <div className="pointer-events-none absolute left-3 bottom-3 z-20">
            <div className="rounded-md bg-black/80 px-3 py-1.5 font-mono text-xs text-green-400 shadow-lg backdrop-blur-sm">
              x: {mouseCoords.x} &nbsp; y: {mouseCoords.y}
            </div>
          </div>
        )}
      </div>

      {/* Panneau d'information */}
      <div
        className={`mt-4 overflow-hidden rounded-xl border transition-all duration-300 ${
          selectedZone
            ? "max-h-60 opacity-100 border-zinc-200 dark:border-zinc-700"
            : "max-h-0 opacity-0 border-transparent"
        }`}
      >
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
            <button
              onClick={handleClosePanel}
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Fermer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

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

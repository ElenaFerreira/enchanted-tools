"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Module } from "@/lib/types";
import { FloorPlanInfoPanel } from "./FloorPlanInfoPanel";
import {
  BASE_VB_WIDTH,
  BASE_VB_HEIGHT,
  MOBILE_VB,
  DESKTOP_VB,
  ZONE_MASK_INACTIVE,
  ZONE_STROKE,
  ZONE_POINT_RADIUS_MOBILE,
  ZONE_POINT_RADIUS_DESKTOP,
  ZONE_POINT_COLORS,
  ZONE_POINT_CENTERS_MOBILE,
  ZONE_POINT_CENTERS_DESKTOP,
  ZONES_MOBILE,
  ZONES_DESKTOP,
  type Zone,
} from "./InteractiveFloorPlan.config";

export default function InteractiveFloorPlan() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const zoneCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const vb = isDesktop ? DESKTOP_VB : MOBILE_VB;
  const zones = isDesktop ? ZONES_DESKTOP : ZONES_MOBILE;
  const zoneCenters = isDesktop ? ZONE_POINT_CENTERS_DESKTOP : ZONE_POINT_CENTERS_MOBILE;
  const zonePointRadiusBase = isDesktop ? ZONE_POINT_RADIUS_DESKTOP : ZONE_POINT_RADIUS_MOBILE;
  const activeZoneIdFromSlider = zones[activeSlideIndex]?.id ?? null;
  const activeZoneId = hoveredZone ?? activeZoneIdFromSlider;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // Valeur initiale après hydratation
    queueMicrotask(() => setIsDesktop(mql.matches));

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!selectedZone) return;
    const el = zoneCardRefs.current[selectedZone.id];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedZone]);

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth, scrollWidth } = container;
      if (!scrollWidth || !clientWidth) return;
      const slideWidth = scrollWidth / zones.length;
      if (!slideWidth) return;
      const rawIndex = scrollLeft / slideWidth;
      const nextIndex = Math.min(zones.length - 1, Math.max(0, Math.round(rawIndex)));
      setActiveSlideIndex(nextIndex);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [zones.length]);

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
        <svg viewBox={`0 0 ${vb.width} ${vb.height}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMinYMin meet">
          {/* Zones cliquables + points de repère */}
          {zones.map((zone) => {
            const isActive = activeZoneId === zone.id;
            return (
              <g key={zone.id}>
                <polygon
                  points={zone.points}
                  fill={isActive ? zone.hoverColor : ZONE_MASK_INACTIVE}
                  stroke={isActive ? zone.borderColor : ZONE_STROKE}
                  strokeWidth={isActive ? 10 * legacyScale.scale : 4 * legacyScale.scale}
                  strokeDasharray={isActive ? "none" : "24 12"}
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
              </g>
            );
          })}

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
      </div>

      {/* Panneau d'information */}
      <FloorPlanInfoPanel selectedZone={selectedZone} selectedModule={selectedModule} onClose={handleClosePanel} />

      {/* Slider de zones */}
      <div className="relative z-10 -mt-32 sm:-mt-40 lg:mt-6 lg:max-w-[480px] lg:mx-auto">
        {/* Dégradé gauche supprimé */}

        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Parcourir les zones du plan"
        >
          {zones.map((zone) => {
            const tagColor = ZONE_POINT_COLORS[zone.id] ?? "rgba(255, 255, 255, 0.7)";
            return (
              <button
                key={zone.id}
                ref={(el) => {
                  zoneCardRefs.current[zone.id] = el;
                }}
                className={[
                  "snap-center shrink-0",
                  "w-[calc(100%-2rem)] sm:w-[420px] lg:w-full",
                  "p-3 sm:p-4 text-left shadow-sm backdrop-blur",
                  "min-h-[80px] sm:min-h-[110px]",
                  "transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                ].join(" ")}
                style={{
                  borderRadius: 4,
                  border: `0.3px solid ${zone.borderColor}`,
                  background: zone.hoverColor,
                }}
                aria-label={`Sélectionner la zone : ${zone.name}`}
              >
                <div className="flex items-start">
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold text-white">{zone.name}</p>
                    <p className="mt-1 text-xs sm:text-sm text-white/70">{zone.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {zones.map((zone, index) => {
            const isActive = index === activeSlideIndex;
            return (
              <span
                key={zone.id}
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.61)" : "rgba(255, 255, 255, 0.17)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

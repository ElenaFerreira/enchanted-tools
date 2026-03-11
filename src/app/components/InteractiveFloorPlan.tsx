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
  ZONE_ZOOM_MOBILE,
  ZONE_ZOOM_DESKTOP,
  type Zone,
} from "./InteractiveFloorPlan.config";

function isPointInPolygon(x: number, y: number, polygonString: string): boolean {
  const points = polygonString
    .split(" ")
    .map((pair) => pair.split(",").map(Number))
    .filter((pair): pair is [number, number] => pair.length === 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]));

  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

export default function InteractiveFloorPlan() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [zoomedZoneId, setZoomedZoneId] = useState<string | null>(null);
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

  const zoomTransform = useMemo(() => {
    if (!zoomedZoneId) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }

    const center = zoneCenters[zoomedZoneId];
    if (!center) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }

    const presets = isDesktop ? ZONE_ZOOM_DESKTOP : ZONE_ZOOM_MOBILE;
    const preset = presets[zoomedZoneId];

    const targetX = preset?.targetX ?? 50;
    const targetY = preset?.targetY ?? 50;
    const scale = preset?.scale ?? (isDesktop ? 1.7 : 2.1);

    const centerXPct = (center.x / vb.width) * 100;
    const centerYPct = (center.y / vb.height) * 100;
    const offsetX = targetX - centerXPct;
    const offsetY = targetY - centerYPct;

    const translateX = offsetX;
    const translateY = offsetY;

    return { scale, translateX, translateY };
  }, [zoomedZoneId, zoneCenters, vb.width, vb.height, isDesktop]);

  const pinSizes = useMemo(() => {
    const factor = isDesktop ? 1 : 2.5;
    const r = 70 * legacyScale.scale * factor;
    const ring = 90 * legacyScale.scale * factor;
    const ringSelected = 110 * legacyScale.scale * factor;
    const fontSize = 48 * legacyScale.scale * factor;
    return {
      r,
      ring,
      ringSelected,
      fontSize,
      stroke: 6 * legacyScale.scale,
      shadowOffset: 3 * legacyScale.scale,
    };
  }, [legacyScale.scale, isDesktop]);

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

  const handleZoneClick = useCallback(
    (zone: Zone) => {
      setSelectedModule(null);
      setSelectedZone(null);

      const isTogglingOff = zoomedZoneId === zone.id;
      setZoomedZoneId(isTogglingOff ? null : zone.id);

      const container = sliderRef.current;
      if (!container || !zones.length) return;

      const clickedIndex = zones.findIndex((z) => z.id === zone.id);
      if (clickedIndex === -1) return;

      const targetIndex = !isDesktop ? (isTogglingOff ? 0 : clickedIndex) : clickedIndex;

      const { scrollWidth, clientWidth } = container;
      if (!scrollWidth || !clientWidth) return;

      const slideWidth = scrollWidth / zones.length;
      setActiveSlideIndex(targetIndex);
      container.scrollTo({
        left: targetIndex * slideWidth,
        behavior: "smooth",
      });
    },
    [zones, zoomedZoneId, isDesktop],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedZone(null);
    setSelectedModule(null);
  }, []);

  const modulesWithZone = useMemo(
    () =>
      modules.map((mod) => {
        const vbX = isDesktop ? mod.position_x_desktop : mod.position_x_mobile;
        const vbY = isDesktop ? mod.position_y_desktop : mod.position_y_mobile;
        const legacyX = mod.position_x;
        const legacyY = mod.position_y;

        const cx = vbX !== null ? vbX : legacyX !== null ? legacyX * legacyScale.scaleX : null;
        const cy = vbY !== null ? vbY : legacyY !== null ? legacyY * legacyScale.scaleY : null;

        if (cx === null || cy === null) {
          return { mod, zoneId: null as string | null, cx: null as number | null, cy: null as number | null };
        }

        let zoneId: string | null = null;
        for (const zone of zones) {
          if (zone.points && isPointInPolygon(cx, cy, zone.points)) {
            zoneId = zone.id;
            break;
          }
        }

        return { mod, zoneId, cx, cy };
      }),
    [modules, isDesktop, legacyScale.scaleX, legacyScale.scaleY, zones],
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Titre */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">Plan</h2>
      </div>

      {/* Container du plan */}
      <div
        className="relative mx-auto w-[80vw] max-w-[300px] overflow-hidden sm:w-full sm:max-w-none"
        onClick={() => {
          setZoomedZoneId(null);
          setSelectedZone(null);
        }}
        aria-label="Plan interactif du niveau -1"
      >
        <div
          className="relative transform transition-transform duration-500 ease-in-out"
          style={{
            transform: `translate(${zoomTransform.translateX}%, ${zoomTransform.translateY}%) scale(${zoomTransform.scale})`,
          }}
        >
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
                <g key={zone.id} className="cursor-pointer">
                  <polygon
                    points={zone.points}
                    fill={isActive ? zone.hoverColor : ZONE_MASK_INACTIVE}
                    stroke={isActive ? zone.borderColor : ZONE_STROKE}
                    strokeWidth={isActive ? 10 * legacyScale.scale : 4 * legacyScale.scale}
                    strokeDasharray={isActive ? "none" : "24 12"}
                    className="transition-all duration-200"
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoneClick(zone);
                    }}
                  />
                </g>
              );
            })}

            {/* Modules placés */}
            {modulesWithZone.map(({ mod, zoneId, cx, cy }) => {
              if (cx === null || cy === null) return null;
              if (!zoomedZoneId || zoneId !== zoomedZoneId) return null;

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
      </div>

      {/* Panneau d'information */}
      <FloorPlanInfoPanel selectedZone={selectedZone} selectedModule={selectedModule} onClose={handleClosePanel} />

      {/* Slider de zones */}
      <div
        className={[
          "relative z-10 lg:mt-6 lg:max-w-[480px] lg:mx-auto",
          zoomedZoneId ? "mt-4 sm:mt-6" : "-mt-32 sm:-mt-40",
          "transition-all duration-300",
        ].join(" ")}
      >
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
                onClick={() => handleZoneClick(zone)}
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

export interface Zone {
  id: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  points: string;
}

export const BASE_VB_WIDTH = 7791;
export const BASE_VB_HEIGHT = 4500;

export const MOBILE_VB = { width: 280, height: 513, src: "/mobile-plan.svg" as const };
export const DESKTOP_VB = { width: 1156, height: 630, src: "/desktop-plan.svg" as const };

type BaseZoneMeta = Pick<Zone, "id" | "name" | "description" | "color">;

const ZONE_HOVER_COLOR = "rgba(255, 255, 255, 0.3)";
const ZONE_BORDER_COLOR = "rgba(255, 255, 255, 1)";

const ZONES_META: BaseZoneMeta[] = [
  {
    id: "mirokai",
    name: "Mirokaï Experience",
    description:
      "Espace principal dédié à l'expérience immersive Mirokaï. Cette grande salle accueille les visiteurs pour une découverte interactive unique.",
    color: "rgba(200, 0, 120, 0.08)",
  },
  {
    id: "spoon",
    name: "Zone Partenaire Spoon",
    description: "Espace dédié au partenaire Spoon. Zone incluant les E.A.S., le lobby et les espaces de circulation principaux.",
    color: "rgba(0, 190, 190, 0.08)",
  },
  {
    id: "regie",
    name: "Régie",
    description: "Local technique de régie. Poste de contrôle pour la gestion des équipements audiovisuels et techniques de l'espace.",
    color: "rgba(30, 30, 180, 0.08)",
  },
  {
    id: "cyclage",
    name: "Salle de Cyclage",
    description:
      "Salle de cyclage comprenant le studio, le stockage et les espaces techniques associés. Zone dédiée à la préparation et au recyclage du contenu.",
    color: "rgba(150, 0, 180, 0.08)",
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

export const ZONE_MASK_INACTIVE = "rgba(255, 255, 255, 0.08)";
export const ZONE_STROKE = "rgba(255, 255, 255, 0.55)";
export const ZONE_POINT_RADIUS_MOBILE = 115;
export const ZONE_POINT_RADIUS_DESKTOP = 60;

export const ZONE_POINT_COLORS: Record<string, string> = {
  mirokai: "#0074FB",
  spoon: "#C44296",
  regie: "#FFF3D0",
  cyclage: "#FFD872",
};

export const ZONE_POINT_CENTERS_MOBILE: Record<string, { x: number; y: number }> = {
  mirokai: { x: 185.5, y: 140 },
  spoon: { x: 150, y: 350 },
  regie: { x: 82, y: 65 },
  cyclage: { x: 80, y: 103 },
};

export const ZONE_POINT_CENTERS_DESKTOP: Record<string, { x: number; y: number }> = {
  mirokai: { x: 232, y: 270 },
  spoon: { x: 650, y: 370 },
  regie: { x: 124, y: 470 },
  cyclage: { x: 233, y: 575 },
};

export const ZONES_MOBILE: Zone[] = ZONES_META.map((z) => ({
  ...z,
  hoverColor: ZONE_HOVER_COLOR,
  borderColor: ZONE_BORDER_COLOR,
  points: ZONE_POINTS_MOBILE[z.id] ?? "",
}));

export const ZONES_DESKTOP: Zone[] = ZONES_META.map((z) => ({
  ...z,
  hoverColor: ZONE_HOVER_COLOR,
  borderColor: ZONE_BORDER_COLOR,
  points: ZONE_POINTS_DESKTOP[z.id] ?? "",
}));


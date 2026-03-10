export interface Module {
  id: string;
  number: number;
  name: string;
  description: string;
  media_type: "audio" | "video";
  media_url: string;
  images: string[];
  position_x: number | null;
  position_y: number | null;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ModuleInsert = Omit<Module, "id" | "created_at" | "updated_at">;
export type ModuleUpdate = Partial<ModuleInsert>;

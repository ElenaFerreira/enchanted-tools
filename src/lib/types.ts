export interface OnboardingPlayer {
  id: string;
  name: string;
}

export interface QuizTheme {
  id: string;
  slug: string;
  ordre: number;
  titre: string;
  intro_texte: string;
  intro_audio_url: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  theme_id: string;
  ordre: number;
  texte: string;
  aide_texte: string;
  created_at: string;
}

export interface QuizAnswer {
  id: string;
  question_id: string;
  ordre: number;
  texte: string;
  is_correct: boolean;
  created_at: string;
}

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
  position_x_mobile: number | null;
  position_y_mobile: number | null;
  position_x_desktop: number | null;
  position_y_desktop: number | null;
  zone_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ModuleInsert = Omit<Module, "id" | "created_at" | "updated_at">;
export type ModuleUpdate = Partial<ModuleInsert>;

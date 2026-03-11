"use client";

import { useState } from "react";
import type { Module, ModuleInsert } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";
import { MediaUploader } from "./MediaUploader";

interface ModuleFormProps {
  module?: Module | null;
  defaultNumber?: number;
  onSave: (data: ModuleInsert) => Promise<void>;
  onCancel: () => void;
}

export default function ModuleForm({ module, defaultNumber = 1, onSave, onCancel }: ModuleFormProps) {
  const [number, setNumber] = useState(module?.number ?? defaultNumber);
  const [name, setName] = useState(module?.name ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [mediaType, setMediaType] = useState<"audio" | "video">(module?.media_type ?? "video");
  const [mediaUrl, setMediaUrl] = useState(module?.media_url ?? "");
  const [images, setImages] = useState<string[]>(module?.images ?? []);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        number,
        name: name.trim(),
        description: description.trim(),
        media_type: mediaType,
        media_url: mediaUrl.trim(),
        images,
        position_x: module?.position_x ?? null,
        position_y: module?.position_y ?? null,
        position_x_mobile: module?.position_x_mobile ?? null,
        position_y_mobile: module?.position_y_mobile ?? null,
        position_x_desktop: module?.position_x_desktop ?? null,
        position_y_desktop: module?.position_y_desktop ?? null,
        zone_id: module?.zone_id ?? null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {module ? "Modifier le module" : "Nouveau module"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Numéro + Nom */}
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label htmlFor="module-number" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Numéro
              </label>
              <input
                id="module-number"
                type="number"
                min={1}
                required
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="module-name" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Nom
              </label>
              <input
                id="module-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du module"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Description / Cartel */}
          <div>
            <label htmlFor="module-description" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Cartel / Description
            </label>
            <textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description du module, texte du cartel..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Type de média */}
          <div>
            <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Type de média
            </span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition cursor-pointer ${
                  mediaType === "video"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Vidéo
              </button>
              <button
                type="button"
                onClick={() => setMediaType("audio")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition cursor-pointer ${
                  mediaType === "audio"
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-950 dark:text-purple-300"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
                Audio
              </button>
            </div>
          </div>

          {/* Fichier média */}
          <MediaUploader
            mediaType={mediaType}
            value={mediaUrl}
            onChange={setMediaUrl}
          />

          {/* Images */}
          <ImageUploader images={images} onChange={setImages} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 cursor-pointer dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Enregistrement..." : module ? "Mettre à jour" : "Créer le module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

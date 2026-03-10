"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Module, ModuleInsert } from "@/lib/types";

interface ModuleFormProps {
  module?: Module | null;
  defaultNumber?: number;
  onSave: (data: ModuleInsert) => Promise<void>;
  onCancel: () => void;
}

export default function ModuleForm({ module, defaultNumber = 1, onSave, onCancel }: ModuleFormProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [number, setNumber] = useState(module?.number ?? defaultNumber);
  const [name, setName] = useState(module?.name ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [mediaType, setMediaType] = useState<"audio" | "video">(module?.media_type ?? "video");
  const [mediaUrl, setMediaUrl] = useState(module?.media_url ?? "");
  const [images, setImages] = useState<string[]>(module?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setUploadError(`"${file.name}" n'est pas une image.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" dépasse 5 Mo.`);
        continue;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `modules/${fileName}`;

      const { error } = await supabase.storage
        .from("module-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        setUploadError(`Erreur upload "${file.name}" : ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("module-assets")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        newImages.push(urlData.publicUrl);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    const url = images[index];
    setImages(images.filter((_, i) => i !== index));

    if (url.includes("module-assets")) {
      try {
        const path = url.split("module-assets/").pop();
        if (path) {
          await supabase.storage.from("module-assets").remove([path]);
        }
      } catch {
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Numéro
              </label>
              <input
                type="number"
                min={1}
                required
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value) || 1)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Nom
              </label>
              <input
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
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Cartel / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description du module, texte du cartel..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Type de média */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Type de média
            </label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
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
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
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

          {/* URL du média */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              URL du média ({mediaType})
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={`https://exemple.com/fichier.${mediaType === "video" ? "mp4" : "mp3"}`}
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Images — Upload de fichiers */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Images
            </label>

            {/* Zone d'upload */}
            <div
              className={`mt-1 relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition cursor-pointer ${
                uploading
                  ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-750"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploading ? (
                <>
                  <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    Upload en cours...
                  </p>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">Cliquez pour choisir</span> ou glissez des images ici
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    PNG, JPG, WebP — max 5 Mo par image
                  </p>
                </>
              )}
            </div>

            {/* Erreur d'upload */}
            {uploadError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}

            {/* Grille de miniatures */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <img
                      src={img}
                      alt={`Image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || uploading || !name.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Enregistrement..." : module ? "Mettre à jour" : "Créer le module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

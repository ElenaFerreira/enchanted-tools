"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const LIMITS = {
  audio: { maxSize: 20 * 1024 * 1024, label: "20 Mo", accept: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4", extensions: "MP3, WAV, OGG, AAC" },
  video: { maxSize: 50 * 1024 * 1024, label: "50 Mo", accept: "video/mp4,video/webm,video/ogg", extensions: "MP4, WebM, OGG" },
} as const;

interface MediaUploaderProps {
  mediaType: "audio" | "video";
  value: string;
  onChange: (url: string) => void;
}

export function MediaUploader({ mediaType, value, onChange }: MediaUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">(
    value && !value.includes("module-assets") ? "url" : "upload"
  );

  const limit = LIMITS[mediaType];
  const hasFile = value.length > 0;
  const isStoredInSupabase = value.includes("module-assets");

  const removeCurrentFile = async () => {
    if (isStoredInSupabase) {
      try {
        const path = value.split("module-assets/").pop();
        if (path) {
          await supabase.storage.from("module-assets").remove([path]);
        }
      } catch {
        /* noop */
      }
    }
    onChange("");
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith(`${mediaType}/`)) {
      setUploadError(`Ce fichier n'est pas un fichier ${mediaType === "audio" ? "audio" : "vidéo"}.`);
      return;
    }

    if (file.size > limit.maxSize) {
      setUploadError(`Le fichier dépasse ${limit.label}.`);
      return;
    }

    setUploading(true);

    if (isStoredInSupabase) {
      await removeCurrentFile();
    }

    const ext = file.name.split(".").pop() ?? (mediaType === "video" ? "mp4" : "mp3");
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `media/${fileName}`;

    const { error } = await supabase.storage
      .from("module-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setUploadError(`Erreur upload : ${error.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("module-assets")
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      onChange(urlData.publicUrl);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileName = isStoredInSupabase
    ? decodeURIComponent(value.split("/").pop() ?? "")
    : "";

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Fichier {mediaType === "video" ? "vidéo" : "audio"}
        </span>

        {/* Bascule upload / URL */}
        <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer ${
              mode === "upload"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer ${
              mode === "url"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <>
          {/* Fichier déjà uploadé */}
          {hasFile && isStoredInSupabase ? (
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <MediaIcon mediaType={mediaType} />
              <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                {fileName}
              </span>
              <button
                type="button"
                onClick={removeCurrentFile}
                className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-red-600 cursor-pointer dark:hover:bg-zinc-700 dark:hover:text-red-400"
                aria-label="Supprimer le fichier"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              className={`mt-1 relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 transition cursor-pointer ${
                uploading
                  ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                  : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-750"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={limit.accept}
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
                  <MediaIcon mediaType={mediaType} className="h-8 w-8 text-zinc-400" />
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">
                      Cliquez pour choisir
                    </span>{" "}
                    un fichier {mediaType === "video" ? "vidéo" : "audio"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {limit.extensions} — max {limit.label}
                  </p>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`https://exemple.com/fichier.${mediaType === "video" ? "mp4" : "mp3"}`}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      )}

      {uploadError && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}
    </div>
  );
}

function MediaIcon({ mediaType, className = "h-4 w-4" }: { mediaType: "audio" | "video"; className?: string }) {
  return mediaType === "video" ? (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ) : (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
  );
}

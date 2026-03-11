"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      onChange([...images, ...newImages]);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async (index: number) => {
    const url = images[index];
    onChange(images.filter((_, i) => i !== index));

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

  return (
    <div>
      <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Images
      </span>

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
              <Image
                src={img}
                alt={`Image ${i + 1}`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
                aria-label={`Supprimer l'image ${i + 1}`}
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
  );
}

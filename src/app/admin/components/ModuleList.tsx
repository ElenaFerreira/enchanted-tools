"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Module, ModuleInsert } from "@/lib/types";
import ModuleForm from "./ModuleForm";

export default function ModuleList() {
  const supabase = createClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<Module | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const nextNumber = modules.length > 0
    ? Math.max(...modules.map((m) => m.number)) + 1
    : 1;

  const fetchModules = useCallback(async () => {
    const withNewColumns = await supabase
      .from("modules")
      .select(
        "id, number, name, description, media_type, media_url, images, position_x, position_y, position_x_mobile, position_y_mobile, position_x_desktop, position_y_desktop, zone_id"
      )
      .order("number", { ascending: true });

    if (withNewColumns.error) {
      const legacy = await supabase
        .from("modules")
        .select("id, number, name, description, media_type, media_url, images, position_x, position_y, zone_id")
        .order("number", { ascending: true });
      setModules((legacy.data as Module[]) ?? []);
      setLoading(false);
      return;
    }

    setModules((withNewColumns.data as Module[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchModules();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchModules]);

  const handleSave = async (data: ModuleInsert) => {
    const legacyData = (({
      position_x_mobile: _pxm,
      position_y_mobile: _pym,
      position_x_desktop: _pxd,
      position_y_desktop: _pyd,
      ...rest
    }) => rest)(data);

    if (editingModule === null) {
      const res = await supabase.from("modules").insert(data);
      if (res.error) {
        await supabase.from("modules").insert(legacyData);
      }
    } else if (editingModule) {
      const res = await supabase.from("modules").update(data).eq("id", editingModule.id);
      if (res.error) {
        await supabase.from("modules").update(legacyData).eq("id", editingModule.id);
      }
    }
    setEditingModule(undefined);
    fetchModules();
  };

  const handleDelete = async (id: string) => {
    const mod = modules.find((m) => m.id === id);

    if (mod) {
      const pathsToRemove: string[] = [];

      if (mod.media_url?.includes("module-assets")) {
        const path = mod.media_url.split("module-assets/").pop();
        if (path) pathsToRemove.push(path);
      }

      for (const img of mod.images) {
        if (img.includes("module-assets")) {
          const path = img.split("module-assets/").pop();
          if (path) pathsToRemove.push(path);
        }
      }

      if (pathsToRemove.length > 0) {
        await supabase.storage.from("module-assets").remove(pathsToRemove);
      }
    }

    await supabase.from("modules").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchModules();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Blocs de modules
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {modules.length} module{modules.length !== 1 ? "s" : ""} configuré{modules.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setEditingModule(null)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 cursor-pointer sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ajouter un module
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="mt-12 text-center text-sm text-zinc-400">Chargement...</div>
      ) : modules.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Aucun module
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Commencez par créer votre premier module.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* Numéro badge */}
              <div className="absolute -top-2.5 -left-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                {mod.number}
              </div>

              {/* Image preview */}
              {mod.images.length > 0 ? (
                <div className="relative mb-3 h-28 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={mod.images[0]}
                    alt={mod.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <svg className="h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {mod.name}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {mod.description || "Pas de description"}
              </p>

              {/* Tags */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    mod.media_type === "video"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                  }`}
                >
                  {mod.media_type === "video" ? "Vidéo" : "Audio"}
                </span>
                {(mod.position_x_mobile !== null ||
                  mod.position_x_desktop !== null ||
                  mod.position_x !== null) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                    Placé
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  onClick={() => setEditingModule(mod)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Modifier
                </button>
                {deleteConfirm === mod.id ? (
                  <button
                    onClick={() => handleDelete(mod.id)}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 cursor-pointer"
                  >
                    Confirmer
                  </button>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(mod.id)}
                    aria-label="Supprimer le module"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 cursor-pointer dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {editingModule !== undefined && (
        <ModuleForm
          module={editingModule}
          defaultNumber={nextNumber}
          onSave={handleSave}
          onCancel={() => setEditingModule(undefined)}
        />
      )}
    </div>
  );
}

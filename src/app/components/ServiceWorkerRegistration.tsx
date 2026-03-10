"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker enregistré avec succès:", registration.scope);

          // Vérifier les mises à jour périodiquement
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "activated" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("Nouveau contenu disponible, rechargement...");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Erreur lors de l'enregistrement du Service Worker:", error);
        });
    }
  }, []);

  return null;
}

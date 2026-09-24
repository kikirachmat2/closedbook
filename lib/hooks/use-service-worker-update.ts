// =========================================================================
// CLOSEDBOOK PRODUCTION OS — SERVICE WORKER UPDATE HOOK (G.2 PWA)
// =========================================================================

"use client";

import { useEffect, useState, useCallback } from "react";

export interface ServiceWorkerUpdateState {
  isSupported: boolean;
  updateAvailable: boolean;
  isUpdating: boolean;
  applyUpdate: () => void;
  dismissUpdate: () => void;
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdateState {
  const [isSupported, setIsSupported] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    setIsSupported(true);

    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing && hadController) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If there's an already waiting worker on initial load
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[SW] Registration error:", err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      setIsUpdating(true);
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    isSupported,
    updateAvailable,
    isUpdating,
    applyUpdate,
    dismissUpdate,
  };
}

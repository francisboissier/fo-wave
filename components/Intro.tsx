"use client";

import { useRef } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { mountHalftone } from "@/lib/halftone";
import { introStorageKey } from "@/lib/intro";

const holdAfterReadyMs = 2200;
const maxWaitMs = 8000;
const exitMs = 900;
const reducedExitMs = 400;
const dismissEvents = ["pointerdown", "wheel", "touchmove", "keydown"] as const;

const introImages = {
  lowresUrl: "/fo-wave/flag-256.jpg",
  hiresUrl: "/fo-wave/flag.jpg",
  maskUrl: "/fo-wave/blackmask.png",
  width: 1920,
  height: 1434,
};

function rememberIntroSeen() {
  try {
    sessionStorage.setItem(introStorageKey, "1");
  } catch {}
}

export function Intro() {
  const hostRef = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    const root = document.documentElement;
    const host = hostRef.current;
    if (!host || root.dataset.intro === "done") return;

    root.dataset.intro = "active";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = new Set<number>();
    let dismissed = false;

    const schedule = (callback: () => void, delay: number) => {
      timers.add(window.setTimeout(callback, delay));
    };

    const stopListening = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      dismissEvents.forEach((name) => window.removeEventListener(name, dismiss));
    };

    const destroyHalftone = mountHalftone(host, introImages, () => schedule(dismiss, holdAfterReadyMs));

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      stopListening();
      rememberIntroSeen();
      root.dataset.intro = "leaving";
      window.setTimeout(
        () => {
          root.dataset.intro = "done";
          destroyHalftone();
        },
        reducedMotion ? reducedExitMs : exitMs,
      );
    }

    schedule(dismiss, maxWaitMs);
    dismissEvents.forEach((name) => window.addEventListener(name, dismiss, { passive: true }));

    return () => {
      stopListening();
      destroyHalftone();
    };
  });

  return (
    <div className="intro" aria-hidden>
      <div ref={hostRef} className="intro-halftone" />
    </div>
  );
}

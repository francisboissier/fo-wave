"use client";

import { useRef } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";
import { mountHalftone, type HalftoneImages } from "@/lib/halftone";

export function HalftoneBackdrop({ images }: { images: HalftoneImages }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    if (!hostRef.current) return;
    return mountHalftone(hostRef.current, images);
  });

  return (
    <div className="backdrop" aria-hidden>
      <div ref={hostRef} className="backdrop-contents" />
    </div>
  );
}

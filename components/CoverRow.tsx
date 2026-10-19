"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { closedView, MagazineViewer } from "@/components/MagazineViewer";
import { useMountEffect } from "@/hooks/useMountEffect";
import { covers } from "@/lib/magazine";

const coverSizes = "(max-width: 700px) 40vw, (max-width: 1100px) 17vw, 16vw";

export function CoverRow() {
  const rowRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState(closedView);

  useMountEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        row.dataset.revealed = "true";
        observer.disconnect();
      },
      { threshold: 0.25 },
    );
    observer.observe(row);
    return () => observer.disconnect();
  });

  const openMagazine = () => {
    setView(closedView);
    dialogRef.current?.showModal();
  };

  return (
    <section className="covers" aria-label="FO—WAVE Issue One covers">
      <ul ref={rowRef} className="cover-row">
        {covers.map((cover, index) => (
          <li key={cover.src} className="cover" style={{ "--i": index } as CSSProperties}>
            {index === 0 ? (
              <button type="button" className="cover-open" onClick={openMagazine} aria-label="Open Issue One">
                <Image src={cover.src} alt={cover.alt} fill sizes={coverSizes} />
              </button>
            ) : (
              <Image src={cover.src} alt={cover.alt} fill sizes={coverSizes} />
            )}
          </li>
        ))}
      </ul>
      <MagazineViewer dialogRef={dialogRef} view={view} onViewChange={setView} />
    </section>
  );
}

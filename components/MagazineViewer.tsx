"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { leaves, pageLabel, type MagazinePage } from "@/lib/magazine";

const swipeThreshold = 40;
const renderWindow = 2;
const lastTurn = leaves.length - 1;
const singlePageQuery = "(max-width: 640px) and (orientation: portrait)";
const pageSizes = "(max-width: 640px) 92vw, (max-width: 900px) 50vw, 45vw";

export type MagazineView = { turned: number; side: "left" | "right" };

export const closedView: MagazineView = { turned: 0, side: "right" };

type MagazineViewerProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  view: MagazineView;
  onViewChange: (view: MagazineView) => void;
};

function PageFace({ page, side, visible }: { page: MagazinePage; side: "front" | "back"; visible: boolean }) {
  return (
    <div className={`leaf-face leaf-face-${side}`}>
      {page && visible && <Image src={page.src} alt={page.alt} fill sizes={pageSizes} draggable={false} />}
    </div>
  );
}

function nextView({ turned, side }: MagazineView, singlePage: boolean): MagazineView | null {
  if (singlePage && turned > 0 && side === "left") return { turned, side: "right" };
  if (turned >= lastTurn) return null;
  return { turned: turned + 1, side: "left" };
}

function previousView({ turned, side }: MagazineView, singlePage: boolean): MagazineView | null {
  if (turned === 0) return null;
  if (singlePage && side === "right") return { turned, side: "left" };
  return { turned: turned - 1, side: "right" };
}

export function MagazineViewer({ dialogRef, view, onViewChange }: MagazineViewerProps) {
  const singlePage = useMediaQuery(singlePageQuery);
  const [lastTurned, setLastTurned] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const { turned, side } = view;

  const goTo = (target: MagazineView | null) => {
    if (!target) return;
    if (target.turned !== turned) setLastTurned(Math.min(target.turned, turned));
    onViewChange(target);
  };

  const goNext = () => goTo(nextView(view, singlePage));
  const goPrevious = () => goTo(previousView(view, singlePage));

  const close = () => dialogRef.current?.close();

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight") goNext();
    if (event.key === "ArrowLeft") goPrevious();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const deltaX = event.clientX - pointerStart.current;
    pointerStart.current = null;

    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX < 0) goNext();
      else goPrevious();
      return;
    }

    const isRightHalf = event.clientX > window.innerWidth / 2;
    if (isRightHalf) goNext();
    else goPrevious();
  };

  const closeOnSelfClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) close();
  };

  const bookPosition = turned === 0 ? "closed" : singlePage ? side : "open";

  return (
    <dialog
      ref={dialogRef}
      className="magazine-dialog"
      aria-label="FO—WAVE Issue One"
      onKeyDown={handleKeyDown}
      onClick={closeOnSelfClick}
    >
      <div className="magazine-stage" onClick={closeOnSelfClick}>
        <div
          className="magazine-book"
          data-position={bookPosition}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => (pointerStart.current = null)}
        >
          {leaves.map((leaf, index) => {
            const isTurned = index < turned;
            const isActive = index === lastTurned;
            const zIndex = isActive ? leaves.length * 3 : isTurned ? leaves.length + index : leaves.length - index;
            const visible = Math.abs(index - turned) <= renderWindow || Math.abs(index - (turned - 1)) <= renderWindow;
            return (
              <div key={index} className="leaf" data-turned={isTurned} style={{ zIndex }}>
                <PageFace page={leaf.front} side="front" visible={visible} />
                <PageFace page={leaf.back} side="back" visible={visible} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="magazine-controls">
        <button type="button" onClick={goPrevious} disabled={!previousView(view, singlePage)} aria-label="Previous page">
          ←
        </button>
        <span className="magazine-counter" aria-live="polite">
          {pageLabel(turned)}
        </span>
        <button type="button" onClick={goNext} disabled={!nextView(view, singlePage)} aria-label="Next page">
          →
        </button>
      </div>

      <button type="button" className="magazine-close" onClick={close} aria-label="Close">
        Close
      </button>
    </dialog>
  );
}

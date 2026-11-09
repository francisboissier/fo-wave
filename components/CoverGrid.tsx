import Image from "next/image";
import type { CSSProperties } from "react";
import { covers } from "@/lib/covers";

const coverSizes = "(max-width: 640px) 45vw, (max-width: 1100px) 30vw, 15vw";

export function CoverGrid() {
  return (
    <ul className="cover-grid">
      {covers.map((cover, index) => (
        <li key={cover.src} className="cover" style={{ "--i": index } as CSSProperties}>
          <div className="cover-image">
            <Image src={cover.src} alt={cover.alt} fill sizes={coverSizes} loading={index < 3 ? "eager" : "lazy"} />
          </div>
          <p className="cover-caption">{cover.caption}</p>
        </li>
      ))}
    </ul>
  );
}

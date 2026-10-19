const coverExtensions = ["jpg", "jpg", "jpg", "jpg", "jpg", "jpeg"];

export const covers = coverExtensions.map((extension, index) => ({
  src: encodeURI(`/COVERS/FO—WAVE ISSUE ONE COVER ${index + 1}.${extension}`),
  alt: `FO—WAVE Issue One, cover ${index + 1}`,
}));

const spreadCount = 18;

const spreadPage = (spread: number, side: "A" | "B") => {
  const id = String(spread).padStart(3, "0");
  return {
    src: encodeURI(`/TEST SPREADS/${id}/${id}${side}.jpg`),
    alt: `Spread ${id}, ${side === "A" ? "left" : "right"} page`,
  };
};

export type MagazinePage = { src: string; alt: string } | null;

export type Leaf = { front: MagazinePage; back: MagazinePage };

export const leaves: Leaf[] = Array.from({ length: spreadCount + 1 }, (_, index) => ({
  front: index === 0 ? covers[0] : spreadPage(index, "B"),
  back: index < spreadCount ? spreadPage(index + 1, "A") : null,
}));

export const pageLabel = (turned: number) => {
  if (turned === 0) return "Cover";
  return `${String(turned).padStart(3, "0")} / ${String(spreadCount).padStart(3, "0")}`;
};

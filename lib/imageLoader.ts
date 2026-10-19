import manifest from "./image-manifest.json";

type ImageVariants = { base: string; widths: number[] };
type LoaderProps = { src: string; width: number; quality?: number };

const variants: Record<string, ImageVariants> = manifest;

export default function imageLoader({ src, width }: LoaderProps) {
  const entry = variants[decodeURI(src)];
  if (!entry) return src;
  const match = entry.widths.find((candidate) => candidate >= width) ?? entry.widths[entry.widths.length - 1];
  return `${entry.base}-${match}.webp`;
}

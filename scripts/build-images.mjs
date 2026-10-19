import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const outputDir = path.join(publicDir, "_img");
const manifestPath = path.join(root, "lib", "image-manifest.json");
const sourceDirs = ["COVERS", "TEST SPREADS", "fo-wave/logo.png"];
const targetWidths = [320, 480, 640, 960, 1280, 1600];
const imagePattern = /\.(jpe?g|png)$/i;

async function collectImages(relativePath) {
  const absolutePath = path.join(publicDir, relativePath);
  const info = await stat(absolutePath);
  if (info.isFile()) return imagePattern.test(relativePath) ? [relativePath] : [];
  const entries = await readdir(absolutePath);
  const nested = await Promise.all(entries.map((entry) => collectImages(path.join(relativePath, entry))));
  return nested.flat();
}

function slugFor(relativePath) {
  return relativePath
    .replace(imagePattern, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function widthsFor(originalWidth) {
  const largest = Math.min(originalWidth, targetWidths.at(-1));
  return [...targetWidths.filter((width) => width < largest), largest];
}

async function isFresh(outputPath, sourceModified) {
  try {
    return (await stat(outputPath)).mtimeMs >= sourceModified;
  } catch {
    return false;
  }
}

async function buildImage(relativePath) {
  const sourcePath = path.join(publicDir, relativePath);
  const sourceModified = (await stat(sourcePath)).mtimeMs;
  const { width: originalWidth } = await sharp(sourcePath).metadata();
  const slug = slugFor(relativePath);
  const widths = widthsFor(originalWidth);

  let generated = 0;
  for (const width of widths) {
    const outputPath = path.join(outputDir, `${slug}-${width}.webp`);
    if (await isFresh(outputPath, sourceModified)) continue;
    await sharp(sourcePath, { limitInputPixels: false })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);
    generated += 1;
  }

  const src = `/${relativePath.split(path.sep).join("/")}`;
  return { src, entry: { base: `/_img/${slug}`, widths }, generated };
}

await mkdir(outputDir, { recursive: true });
const images = (await Promise.all(sourceDirs.map(collectImages))).flat().sort();
const results = [];
for (const image of images) results.push(await buildImage(image));

const manifest = Object.fromEntries(results.map(({ src, entry }) => [src, entry]));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const generatedCount = results.reduce((total, { generated }) => total + generated, 0);
console.log(`Images: ${results.length} sources, ${generatedCount} variants generated`);

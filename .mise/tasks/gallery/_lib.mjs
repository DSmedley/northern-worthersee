// Shared helpers for the gallery:optimize and gallery:check-duplicates tasks.
// Not executable, so mise does not pick it up as a task itself.

import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const SRC_ROOT = "assets/gallery";

export const IMAGE_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".tif", ".tiff",
]);

export const isImage = (file) => IMAGE_EXTS.has(path.extname(file).toLowerCase());

export function humanSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile() && isImage(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Normalize CLI args to gallery-relative POSIX paths, dropping anything that
// is not an image inside the gallery. Paths that no longer exist (e.g. a
// deletion staged for commit, or an original replaced by its .webp) are
// dropped too, unless a sibling .webp exists — then that is used instead.
export function resolveGalleryArgs(args) {
  const files = [];
  for (const arg of args) {
    const rel = path.relative(process.cwd(), path.resolve(arg));
    const norm = rel.split(path.sep).join("/");
    if (!norm.startsWith(SRC_ROOT + "/")) continue;
    if (!isImage(norm)) continue;
    if (existsSync(norm)) {
      files.push(norm);
      continue;
    }
    const parsed = path.parse(norm);
    const webp = path.posix.join(parsed.dir, parsed.name + ".webp");
    if (existsSync(webp)) files.push(webp);
  }
  return [...new Set(files)].sort();
}

// Difference hash: downscale to 9x8 grayscale and compare adjacent horizontal
// pixels, yielding 64 bits that survive resizing and re-compression.
export async function dhash(input) {
  const { data } = await sharp(input)
    .rotate()
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bits = new Uint8Array(64);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const i = r * 9 + c;
      bits[r * 8 + c] = data[i] < data[i + 1] ? 1 : 0;
    }
  }
  return bits;
}

export function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

// Two images are treated as duplicates when the Hamming distance between
// their 64-bit hashes is <= this threshold. Unrelated photos typically score
// ~30; genuine re-encodes score 0–6.
export const DUPLICATE_THRESHOLD = 7;

// Cluster entries whose perceptual hashes are within threshold of each other
// (single-linkage union-find). Returns groups of size > 1, each annotated
// with the largest pairwise distance inside the group.
export function findDuplicateGroups(entries, threshold = DUPLICATE_THRESHOLD) {
  const parent = entries.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (hamming(entries[i].hash, entries[j].hash) <= threshold) {
        parent[find(i)] = find(j);
      }
    }
  }
  const clusters = new Map();
  for (let i = 0; i < entries.length; i++) {
    const root = find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(entries[i]);
  }
  return [...clusters.values()]
    .filter((g) => g.length > 1)
    .map((g) => {
      let maxDistance = 0;
      for (let i = 0; i < g.length; i++)
        for (let j = i + 1; j < g.length; j++)
          maxDistance = Math.max(maxDistance, hamming(g[i].hash, g[j].hash));
      return { files: g.map((e) => e.ref).sort(), maxDistance };
    })
    .sort((a, b) => a.maxDistance - b.maxDistance);
}

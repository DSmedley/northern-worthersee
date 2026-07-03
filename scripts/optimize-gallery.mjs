#!/usr/bin/env node
// Optimize gallery images in place: resize (keeping aspect ratio) and re-encode
// each image to WebP, replacing the original file (e.g. photo.jpg -> photo.webp,
// removing photo.jpg). Also detects duplicate images with a perceptual hash and
// writes a Markdown report.
//
// Usage:
//   node scripts/optimize-gallery.mjs                 # optimize the whole gallery
//   node scripts/optimize-gallery.mjs <file> [file…]  # optimize only the given files
//
// The subset form is used by the pre-commit hook so commits stay in small batches.

import { readdir, readFile, writeFile, stat, rename, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// ---- Configuration ---------------------------------------------------------
const SRC_ROOT = "assets/gallery";
const REPORT_PATH = "gallery-optimization-report.md";

const FORMAT = "webp"; // well-supported, Hugo-native, strong compression
const OUT_EXT = ".webp";
const QUALITY = 80; // visually lossless-ish for photos, big size win
const MAX_EDGE = 2048; // common web/lightbox max on the longest side; never upscale

// Duplicate detection uses a perceptual hash (dHash) so it catches the same
// photo even when it was re-saved at a different size or compression level —
// not just byte-for-byte copies. Two images are treated as duplicates when the
// Hamming distance between their 64-bit hashes is <= this threshold. Unrelated
// photos typically score ~30; genuine re-encodes score 0–6.
const DUPLICATE_THRESHOLD = 7;

const IMAGE_EXTS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".tif", ".tiff",
]);

// ---- Helpers ---------------------------------------------------------------
const isImage = (file) => IMAGE_EXTS.has(path.extname(file).toLowerCase());

function humanSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Difference hash: downscale to 9x8 grayscale and compare adjacent horizontal
// pixels, yielding 64 bits that survive resizing and re-compression.
async function dhash(input) {
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

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

// Cluster entries whose perceptual hashes are within DUPLICATE_THRESHOLD of each
// other (single-linkage union-find). Returns groups of size > 1, each annotated
// with the largest pairwise distance inside the group.
function findDuplicateGroups(entries) {
  const parent = entries.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (hamming(entries[i].hash, entries[j].hash) <= DUPLICATE_THRESHOLD) {
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

async function walk(dir) {
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

// In-place target: same directory and base name, WebP extension.
function outputPath(src) {
  const parsed = path.parse(src);
  return path.join(parsed.dir, parsed.name + OUT_EXT);
}

// Determine the set of files to process from CLI args (subset mode) or the
// whole gallery (full mode).
async function resolveInputs(args) {
  if (args.length === 0) {
    return { files: (await walk(SRC_ROOT)).sort(), mode: "full" };
  }
  const files = [];
  for (const arg of args) {
    const rel = path.relative(process.cwd(), path.resolve(arg));
    const norm = rel.split(path.sep).join("/");
    if (!norm.startsWith(SRC_ROOT + "/")) continue; // ignore anything outside the gallery
    if (!isImage(norm)) continue;
    if (!existsSync(norm)) continue; // e.g. a deletion staged for commit
    files.push(norm);
  }
  return { files: files.sort(), mode: "subset" };
}

// ---- Main ------------------------------------------------------------------
async function main() {
  const { files, mode } = await resolveInputs(process.argv.slice(2));

  if (files.length === 0) {
    console.log("No gallery images to optimize.");
    return;
  }

  console.log(
    `Optimizing ${files.length} image(s) [${mode} mode] in place ` +
    `(${FORMAT}, max ${MAX_EDGE}px, q${QUALITY})\n`,
  );

  // perceptual-hash entries, for duplicate detection
  const entries = [];
  // per-directory tallies of converted images
  const perDir = new Map();
  let totalSrc = 0;
  let totalOut = 0;
  let optimized = 0;
  let skipped = 0;
  let failures = 0;

  for (const src of files) {
    const out = outputPath(src);
    const dirKey = path.dirname(path.relative(SRC_ROOT, src)).split(path.sep).join("/");

    try {
      const input = await readFile(src);
      const meta = await sharp(input).metadata();

      // Reference the resulting file (the WebP that exists after this run) in the
      // duplicate report, not the soon-to-be-deleted original.
      entries.push({ ref: out, hash: await dhash(input) });

      // Idempotent re-runs: skip images that are already WebP and within bounds
      // so repeated full runs don't re-compress (and slowly degrade) them.
      const alreadyOptimized =
        path.extname(src).toLowerCase() === OUT_EXT &&
        meta.width &&
        meta.height &&
        Math.max(meta.width, meta.height) <= MAX_EDGE;

      if (alreadyOptimized) {
        skipped++;
        process.stdout.write(`  – ${src} (already optimized, skipped)\n`);
        continue;
      }

      // Write to a temp file first, then atomically move it into place, so a
      // failure mid-encode can never truncate the original image.
      const tmp = out + ".tmp-optimizing";
      await sharp(input)
        .rotate() // respect EXIF orientation before stripping metadata
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: "inside", // preserve aspect ratio
          withoutEnlargement: true, // never upscale smaller images
        })
        .toFormat(FORMAT, { quality: QUALITY })
        .toFile(tmp);
      await rename(tmp, out);
      if (out !== src) await unlink(src); // remove the original (e.g. the .jpg)

      const srcSize = input.length;
      const outSize = (await stat(out)).size;
      totalSrc += srcSize;
      totalOut += outSize;

      const tally = perDir.get(dirKey) ?? { count: 0, src: 0, out: 0 };
      tally.count++;
      tally.src += srcSize;
      tally.out += outSize;
      perDir.set(dirKey, tally);

      optimized++;
      process.stdout.write(
        `  ✓ ${src} → ${out}  (${humanSize(srcSize)} → ${humanSize(outSize)})\n`,
      );
    } catch (err) {
      failures++;
      process.stdout.write(`  ✗ ${src}: ${err.message}\n`);
    }
  }

  const duplicateGroups = findDuplicateGroups(entries);

  await writeReport({
    mode, files, perDir, totalSrc, totalOut, duplicateGroups, optimized, skipped, failures,
  });

  // ---- Console summary ----
  const saved = totalSrc - totalOut;
  const pct = totalSrc > 0 ? ((saved / totalSrc) * 100).toFixed(1) : "0.0";
  console.log("\nDone.");
  console.log(`  Optimized:  ${optimized}`);
  if (skipped > 0) console.log(`  Skipped:    ${skipped} (already optimized)`);
  if (failures > 0) console.log(`  Failures:   ${failures}`);
  console.log(`  Size:       ${humanSize(totalSrc)} → ${humanSize(totalOut)} (saved ${humanSize(saved)}, ${pct}%)`);
  console.log(`  Duplicates: ${duplicateGroups.length} group(s)`);
  console.log(`  Report:     ${REPORT_PATH}`);

  if (duplicateGroups.length > 0) {
    console.log("\n  Duplicate images detected (see report for full list):");
    for (const group of duplicateGroups) {
      console.log(`   • [dist ${group.maxDistance}] ${group.files.join("  ==  ")}`);
    }
  }

  if (failures > 0) process.exitCode = 1;
}

async function writeReport({
  mode, files, perDir, totalSrc, totalOut, duplicateGroups, optimized, skipped, failures,
}) {
  const saved = totalSrc - totalOut;
  const pct = totalSrc > 0 ? ((saved / totalSrc) * 100).toFixed(1) : "0.0";

  const lines = [];
  lines.push("# Gallery Optimization Report");
  lines.push("");
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push(`- Scope: ${mode === "full" ? "entire gallery" : "subset (" + files.length + " file(s))"}`);
  lines.push(`- Settings: ${FORMAT}, max ${MAX_EDGE}px longest edge, quality ${QUALITY}, in-place`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Images optimized: ${optimized}`);
  if (skipped > 0) lines.push(`- Skipped (already optimized): ${skipped}`);
  if (failures > 0) lines.push(`- Failures: ${failures}`);
  lines.push(`- Source size: ${humanSize(totalSrc)}`);
  lines.push(`- Optimized size: ${humanSize(totalOut)}`);
  lines.push(`- Saved: ${humanSize(saved)} (${pct}%)`);
  lines.push(`- Duplicate groups: ${duplicateGroups.length}`);
  lines.push("");

  lines.push("## Images optimized per directory");
  lines.push("");
  lines.push("| Directory | Images | Source | Optimized | Saved |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const dir of [...perDir.keys()].sort()) {
    const t = perDir.get(dir);
    const dirSaved = t.src - t.out;
    const dirPct = t.src > 0 ? ((dirSaved / t.src) * 100).toFixed(1) : "0.0";
    lines.push(
      `| ${dir || "."} | ${t.count} | ${humanSize(t.src)} | ${humanSize(t.out)} | ${humanSize(dirSaved)} (${dirPct}%) |`,
    );
  }
  lines.push("");

  lines.push("## Duplicate images");
  lines.push("");
  if (duplicateGroups.length === 0) {
    lines.push("No duplicate images found.");
  } else {
    lines.push(
      `The following groups contain visually identical or near-identical images ` +
      `(perceptual-hash distance <= ${DUPLICATE_THRESHOLD}; candidates for removal):`,
    );
    lines.push("");
    duplicateGroups.forEach((group, i) => {
      lines.push(`### Group ${i + 1} (distance ${group.maxDistance})`);
      for (const f of group.files) lines.push(`- ${f}`);
      lines.push("");
    });
  }
  lines.push("");

  await writeFile(REPORT_PATH, lines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

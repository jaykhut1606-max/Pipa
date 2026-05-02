// Pippa hero image generator.
//
// Run from /Users/jay/pippa with:
//   node scripts/generate-images.mjs
//
// What it does:
//   1) Loads OPENAI_API_KEY from .env.local (parses manually so we don't add
//      a dotenv dependency we don't already have).
//   2) For each image in the IMAGES array, asks OpenAI to generate a 1024x1024
//      PNG. Tries gpt-image-1 first; on failure falls back to dall-e-3.
//   3) Writes the bytes to /public/images/<name>.png.
//   4) Skips any image that already exists on disk so re-runs are cheap.
//
// On any image failure (rate limit, model not available, network) we log and
// move on — we never crash the whole batch.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const OUT_DIR = path.join(PROJECT_ROOT, "public", "images");

const IMAGES = [
  {
    name: "hero-mom-baby",
    size: "1024x1024",
    prompt:
      "Editorial close-up photograph of a mother's hands tenderly holding a sleeping newborn baby's tiny foot, warm golden-hour light through soft window, cream and peach color palette, kodak portra 400 aesthetic, shallow depth of field, intimate and tender, no faces visible, square composition",
  },
  {
    name: "hero-newborn",
    size: "1024x1024",
    prompt:
      "Peaceful sleeping newborn wrapped in soft cream muslin, head visible from the side, warm natural light through linen curtain, peach and sage tones, editorial documentary photography, calm intimate mood, no facial features visible",
  },
  {
    name: "hero-hand",
    size: "1024x1024",
    prompt:
      "Close-up of a baby's tiny hand wrapped around an adult parent's index finger, soft cream blanket, warm morning light, editorial style, peach color tones, shallow depth of field",
  },
];

// --- env loader -------------------------------------------------------------

async function loadEnvLocal() {
  // If the user already has the key in their shell env, prefer that.
  if (process.env.OPENAI_API_KEY) return;
  let raw;
  try {
    raw = await fs.readFile(ENV_FILE, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") return;
    throw err;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip optional surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// --- helpers ----------------------------------------------------------------

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchAsBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  const arr = new Uint8Array(await res.arrayBuffer());
  return Buffer.from(arr);
}

async function generateOne(client, spec) {
  const outPath = path.join(OUT_DIR, `${spec.name}.png`);

  if (await fileExists(outPath)) {
    console.log(`  - ${spec.name}: already exists, skipping`);
    return { ok: true, skipped: true, path: outPath };
  }

  // gpt-image-1 always returns b64_json; dall-e-3 supports url + b64_json.
  // We try gpt-image-1 first. On failure, try dall-e-3.
  const attempts = [
    {
      model: "gpt-image-1",
      params: {
        model: "gpt-image-1",
        prompt: spec.prompt,
        size: spec.size,
        n: 1,
      },
    },
    {
      model: "dall-e-3",
      params: {
        model: "dall-e-3",
        prompt: spec.prompt,
        size: spec.size,
        n: 1,
        response_format: "b64_json",
        quality: "hd",
      },
    },
  ];

  let lastErr;
  for (const attempt of attempts) {
    try {
      console.log(`  - ${spec.name}: requesting via ${attempt.model}…`);
      const res = await client.images.generate(attempt.params);
      const item = res?.data?.[0];
      if (!item) throw new Error("Empty response.data");

      let buffer;
      if (item.b64_json) {
        buffer = Buffer.from(item.b64_json, "base64");
      } else if (item.url) {
        buffer = await fetchAsBuffer(item.url);
      } else {
        throw new Error("Response missing both b64_json and url");
      }
      await fs.writeFile(outPath, buffer);
      console.log(
        `    saved ${path.relative(PROJECT_ROOT, outPath)} (${buffer.length} bytes, model=${attempt.model})`
      );
      return { ok: true, path: outPath, model: attempt.model };
    } catch (err) {
      lastErr = err;
      const msg = err && err.message ? err.message : String(err);
      console.warn(`    ${attempt.model} failed: ${msg}`);
    }
  }

  console.error(
    `  ! ${spec.name}: all models failed; skipping. Last error: ${lastErr?.message ?? lastErr}`
  );
  return { ok: false, error: lastErr };
}

// --- main -------------------------------------------------------------------

async function main() {
  await loadEnvLocal();

  if (!process.env.OPENAI_API_KEY) {
    console.log(
      "OPENAI_API_KEY is not set (looked in process.env and .env.local). Skipping image generation. Set the key and re-run when ready."
    );
    process.exit(0);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 90_000 });

  console.log(`Generating ${IMAGES.length} hero image${IMAGES.length === 1 ? "" : "s"} into ${path.relative(PROJECT_ROOT, OUT_DIR) || OUT_DIR}/`);

  const results = [];
  for (const spec of IMAGES) {
    const r = await generateOne(client, spec);
    results.push({ name: spec.name, ...r });
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log("");
  console.log(`Done. ${ok}/${results.length} succeeded${failed ? `, ${failed} failed` : ""}.`);
}

main().catch((err) => {
  console.error("Image generation crashed:", err);
  process.exit(1);
});

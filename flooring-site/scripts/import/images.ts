import { access, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { slugify } from "@/lib/slugify";

// Downloaded product photos live outside `public/` (which gets rebuilt on
// every deploy) and are symlinked in as `public/uploads` — see README.md.
const STORAGE_DIR = path.join(process.cwd(), "storage", "images", "products");
const PUBLIC_PATH_PREFIX = "/uploads/products";
const MAX_WIDTH = 1600;

function hashUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadOne(sku: string, url: string, index: number): Promise<string | null> {
  // The hash is part of the filename so a changed source URL (new photo)
  // naturally produces a new file instead of silently keeping a stale one.
  const filename = `${slugify(sku)}-${index}-${hashUrl(url)}.webp`;
  const destPath = path.join(STORAGE_DIR, filename);
  const publicPath = `${PUBLIC_PATH_PREFIX}/${filename}`;

  if (await fileExists(destPath)) {
    return publicPath;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Image download failed (${response.status}): ${url}`);
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const optimized = await sharp(buffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    await mkdir(STORAGE_DIR, { recursive: true });
    await writeFile(destPath, optimized);
    return publicPath;
  } catch (error) {
    console.error(`Failed to process image ${url} for SKU ${sku}:`, error);
    return null;
  }
}

export async function downloadProductImages(sku: string, urls: string[]): Promise<string[]> {
  const saved: string[] = [];
  for (const [index, url] of urls.entries()) {
    const result = await downloadOne(sku, url, index);
    if (result) saved.push(result);
  }
  return saved;
}

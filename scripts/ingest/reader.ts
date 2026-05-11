import { promises as fs } from "node:fs";
import path from "node:path";
import type { RawDocument } from "./types";

const ALLOWED_EXT = new Set([".md", ".mdx", ".txt", ".markdown"]);

export async function readContentFolder(rootDir: string): Promise<RawDocument[]> {
  const docs: RawDocument[] = [];
  await walk(rootDir, rootDir, docs);
  return docs;
}

async function walk(rootDir: string, currentDir: string, out: RawDocument[]) {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await walk(rootDir, full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) continue;
      const content = await fs.readFile(full, "utf8");
      out.push({
        filePath: full,
        relativePath: path.relative(rootDir, full),
        content,
      });
    }
  }
}

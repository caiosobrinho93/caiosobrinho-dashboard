import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve("out");
let copied = 0;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("__next.")) {
        const payloads = await readdir(fullPath, { withFileTypes: true });
        for (const payload of payloads) {
          if (!payload.isFile()) continue;
          const flatName = `${entry.name}.${payload.name}`;
          const target = join(directory, flatName);
          await copyFile(join(fullPath, payload.name), target);
          copied += 1;
        }
        continue;
      }

      if (directory !== root || entry.name !== "_next") {
        await walk(fullPath);
      }
    }
  }
}

await mkdir(root, { recursive: true });
await walk(root);
console.log(`Static export: ${copied} RSC payloads flattened for offline hosting.`);

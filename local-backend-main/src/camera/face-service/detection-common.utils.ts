import fs from 'fs/promises';
import path from 'path';

/**
 * Reads and filters directory
 */
export async function readdir(_path: string, folders: boolean = false) {
  const items = await fs.readdir(_path, { withFileTypes: true });
  const filtered = items.filter((item) =>
    folders ? item.isDirectory() : item.isFile(),
  );
  return filtered.map((dir) => path.resolve(dir.parentPath, dir.name)); // getting absolute paths
}

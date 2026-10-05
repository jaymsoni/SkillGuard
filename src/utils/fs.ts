import fs from 'node:fs';
import path from 'node:path';

export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

export function listFilesRecursive(dir: string, filter?: (p: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full, filter));
    } else if (!filter || filter(full)) {
      results.push(full);
    }
  }
  return results;
}

export function isTextFile(filePath: string): boolean {
  const exts = [
    '.md', '.txt', '.sh', '.bash', '.zsh', '.ps1', '.js', '.ts',
    '.json', '.yaml', '.yml', '.py', '.go', '.rb', '.toml', '.ini'
  ];
  return exts.includes(path.extname(filePath).toLowerCase());
}

export function pathExists(p: string): boolean {
  try { fs.accessSync(p); return true; } catch { return false; }
}

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

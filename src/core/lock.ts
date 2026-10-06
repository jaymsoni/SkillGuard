import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { listFilesRecursive, isTextFile } from '../utils/fs.js';
import { getScannerVersion, scanSkillDir } from './scan.js';
import { SkillLockEntry } from '../types/index.js';

function relevantFiles(dir: string): string[] {
  // All files except lock files and node_modules; only text files considered for hash
  const files = listFilesRecursive(dir, (p) => isTextFile(p));
  return files
    .filter(f => !/skill-lock\.json$/i.test(f))
    .filter(f => !f.includes('node_modules'))
    .sort();
}

export function hashSkillDir(dir: string): string {
  const files = relevantFiles(dir);
  const hash = crypto.createHash('sha256');
  for (const f of files) {
    const rel = path.relative(dir, f);
    hash.update(rel + '\n');
    hash.update(fs.readFileSync(f));
    hash.update('\n');
  }
  return hash.digest('hex');
}

export function writeLock(dir: string): SkillLockEntry {
  const scan = scanSkillDir(dir);
  const contentHash = hashSkillDir(dir);
  const lock: SkillLockEntry = {
    name: scan.name,
    path: path.resolve(dir),
    contentHash,
    qualityScore: scan.qualityScore,
    severitySummary: scan.severitySummary,
    scannerVersion: getScannerVersion(),
    lockedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(dir, 'skill-lock.json'), JSON.stringify(lock, null, 2) + '\n');
  return lock;
}

export function readLock(dir: string): SkillLockEntry | null {
  const p = path.join(dir, 'skill-lock.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as SkillLockEntry;
  } catch {
    return null;
  }
}

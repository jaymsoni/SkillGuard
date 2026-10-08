import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from '../utils/fs.js';
import { readLock, hashSkillDir } from './lock.js';
import { scanSkillDir } from './scan.js';

export type InstallTarget = 'cursor' | 'claude' | 'agents';

function resolveRealTargetDir(target: InstallTarget): string {
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  switch (target) {
    case 'cursor': return path.join(home, '.cursor', 'skills');
    case 'agents': return path.join(home, '.agents', 'skills');
    // Claude Code skills: personal directory is ~/.claude/skills (project-level: ./.claude/skills)
    case 'claude': return path.join(home, '.claude', 'skills');
  }
}

export interface InstallOptions {
  outDir?: string; // default .skilldoorman-out/target-<name>
  dryRun?: boolean; // when outDir is not set, we still write to .skilldoorman-out
}

export function installSkill(dir: string, target: InstallTarget, opts: InstallOptions = {}) {
  const lock = readLock(dir);
  if (!lock) {
    throw new Error('skill-lock.json not found; run "skilldoorman lock" first');
  }
  const scan = scanSkillDir(dir);
  if (scan.severitySummary.critical > 0) {
    throw new Error('scan policy failed: critical findings present');
  }
  const currentHash = hashSkillDir(dir);
  if (currentHash !== lock.contentHash) {
    throw new Error('lock hash mismatch; update lock or review changes');
  }

  const targetDir = opts.outDir ? path.resolve(opts.outDir) : path.join(process.cwd(), `.skilldoorman-out/target-${target}`);
  const finalDir = path.join(targetDir, path.basename(dir));
  ensureDir(targetDir);

  // copy dir recursively
  copyDir(dir, finalDir);
  return { installedPath: finalDir, targetReal: resolveRealTargetDir(target) };
}

function copyDir(src: string, dest: string) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

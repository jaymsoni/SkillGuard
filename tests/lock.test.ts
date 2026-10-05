import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { writeLock, readLock, hashSkillDir } from '../src/core/lock.js';
import { copyFixture } from './helpers.js';

describe('lockfile', () => {
  it('writes lock and matches hash', () => {
    const dir = copyFixture('clean-skill');
    const lock = writeLock(dir);
    const h = hashSkillDir(dir);
    expect(lock.contentHash).toBe(h);
    const read = readLock(dir)!;
    expect(read.contentHash).toBe(lock.contentHash);
  });

  it('detects change after edit', () => {
    const dir = copyFixture('clean-skill');
    const skillMd = path.join(dir, 'SKILL.md');
    const hBefore = hashSkillDir(dir);
    fs.appendFileSync(skillMd, '\nextra');
    const hAfter = hashSkillDir(dir);
    expect(hBefore).not.toBe(hAfter);
    const lock = writeLock(dir);
    expect(lock.contentHash).toBe(hAfter);
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import { FIXTURES, copyFixture } from './helpers.js';

const BIN = path.join(process.cwd(), 'dist/cli.cjs');
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')).version;

async function run(args: string[], cwd?: string) {
  return await execa('node', [BIN, ...args], { reject: false, cwd });
}

describe('cli integration', () => {
  it('scan of malicious fixtures exits non-zero', async () => {
    const res = await run(['scan', FIXTURES, '--format', 'json']);
    expect(res.exitCode).toBe(1);
    const json = JSON.parse(res.stdout);
    expect(json.totals.findings).toBeGreaterThan(0);
  });

  it('scan of clean fixture exits zero', async () => {
    const res = await run(['scan', path.join(FIXTURES, 'clean-skill'), '--format', 'json']);
    expect(res.exitCode).toBe(0);
  });

  it('works outside the repo and reports its own version', async () => {
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldoorman-cwd-'));
    const res = await run(['scan', path.join(FIXTURES, 'clean-skill'), '--format', 'json'], elsewhere);
    expect(res.exitCode).toBe(0);
    expect(JSON.parse(res.stdout).scannerVersion).toBe(PKG_VERSION);
    const ver = await run(['--version'], elsewhere);
    expect(ver.stdout.trim()).toBe(PKG_VERSION);
  });

  it('install refuses without passing scan and matching lock, succeeds for clean', async () => {
    // malicious should fail
    const bad = await run(['install', path.join(FIXTURES, 'curl-bash-bad')]);
    expect(bad.exitCode).toBe(1);

    // clean: lock then install (on a temp copy so repo fixtures are untouched)
    const cleanDir = copyFixture('clean-skill');
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldoorman-out-'));
    const lock = await run(['lock', cleanDir]);
    expect(lock.exitCode).toBe(0);
    const clean = await run(['install', cleanDir, '--out-dir', outDir]);
    expect(clean.exitCode).toBe(0);
    expect(fs.existsSync(path.join(outDir, 'clean-skill'))).toBe(true);
  });
});

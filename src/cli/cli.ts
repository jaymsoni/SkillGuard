#!/usr/bin/env node
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
// minimal color helpers to avoid ESM/CJS interop issues
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};
const color = (c: keyof typeof colors, s: string) => `${colors[c]}${s}${colors.reset}`;
import { scanPath } from '../core/scan.js';
import { writeLock } from '../core/lock.js';
import { installSkill, InstallTarget } from '../core/install.js';
import { VERSION } from '../version.js';

const program = new Command();
program
  .name('skilldoorman')
  .description('Scan Agent Skills for security issues, score, lock, and safe-install')
  .version(VERSION);

program
  .command('scan')
  .argument('<path>', 'Skill directory or a directory of skills')
  .option('--format <fmt>', 'output format: human|json', 'human')
  .action((p: string, opts: { format: 'human' | 'json' }) => {
    const abs = path.resolve(p);
    const summary = scanPath(abs);
    if (opts.format === 'json') {
      process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    } else {
      printHuman(summary);
    }
    process.exitCode = summary.policy.failed ? 1 : 0;
  });

program
  .command('lock')
  .argument('<path>', 'Skill directory or a directory of skills')
  .action((p: string) => {
    const abs = path.resolve(p);
    const skills = findSkillDirs(abs);
    for (const dir of skills) {
      writeLock(dir);
      console.log(color('green', `lock written:`), path.join(dir, 'skill-lock.json'));
    }
  });

program
  .command('install')
  .argument('<skill-dir>', 'Skill directory')
  .option('--target <t>', 'cursor|claude|agents', 'cursor')
  .option('--out-dir <d>', 'output directory (default: ./.skilldoorman-out)')
  .action((p: string, opts: { target: InstallTarget; outDir?: string }) => {
    const abs = path.resolve(p);
    const res = installSkill(abs, opts.target, { outDir: opts.outDir });
    console.log(color('green', 'Installed to'), res.installedPath);
    console.log(color('gray', 'Real target dir (documented):'), res.targetReal);
  });

program.parseAsync(process.argv);

function findSkillDirs(root: string): string[] {
  const stat = fs.statSync(root);
  if (stat.isDirectory()) {
    if (fs.existsSync(path.join(root, 'SKILL.md'))) return [root];
    return fs.readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'SKILL.md')))
      .map(e => path.join(root, e.name));
  }
  throw new Error('path must be a directory');
}

function printHuman(summary: ReturnType<typeof scanPath>) {
  const fail = summary.policy.failed;
  console.log(fail ? color('red', `Policy FAILED.`) : color('green', `Policy PASSED.`));
  console.log(`Scanned ${summary.totals.skills} skill(s); Findings: ${summary.totals.findings}`);
  for (const s of summary.skills) {
    const sev = s.severitySummary;
    const order: Array<keyof typeof sev> = ['critical','high','medium','low','info'];
    const worst = order.find(k => sev[k] > 0) || 'none';
    console.log(`\n${color('bold', s.name)} (${s.path})`);
    console.log(`  Frontmatter: ${s.validFrontmatter ? color('green', 'valid') : color('red', 'invalid')}`);
    console.log(`  Quality: ${s.qualityScore}/100  Severity: ${worst}`);
    for (const f of s.findings) {
      const sevColor: 'red' | 'yellow' | 'gray' = f.severity === 'critical' ? 'red' : f.severity === 'high' ? 'yellow' : 'gray';
      console.log(`   - [${color(sevColor, f.severity)}] ${f.ruleId} ${f.file}:${f.line} - ${f.message}`);
    }
  }
}

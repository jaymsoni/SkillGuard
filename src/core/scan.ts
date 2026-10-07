import fs from 'node:fs';
import path from 'node:path';
import { listFilesRecursive, isTextFile } from '../utils/fs.js';
import { parseSkill, isSkillDir } from './skill.js';
import { Detector, DetectorContext } from '../detectors/common.js';
import { promptInjectionDetector } from '../detectors/promptInjection.js';
import { remoteExecDetector } from '../detectors/remoteExec.js';
import { obfuscationDetector } from '../detectors/obfuscation.js';
import { suspiciousDownloadsDetector } from '../detectors/suspiciousDownloads.js';
import { secretsDetector } from '../detectors/secrets.js';
import { allowedToolsAbuseDetector } from '../detectors/allowedToolsAbuse.js';
import { Finding, ScanSummary, SkillScanResult, Severity } from '../types/index.js';
import { VERSION } from '../version.js';

const DETECTORS: Detector[] = [
  promptInjectionDetector,
  remoteExecDetector,
  obfuscationDetector,
  suspiciousDownloadsDetector,
  secretsDetector,
  allowedToolsAbuseDetector
];

function scoreQuality(parsed: ReturnType<typeof parseSkill>, dir: string): number {
  let score = 0;
  const fmValid = parsed.frontmatterErrors.length === 0 && parsed.frontmatter;
  if (fmValid) score += 30;
  const descLen = parsed.frontmatter?.description?.trim().length || 0;
  if (descLen >= 20 && descLen <= 600) score += 20; else if (descLen >= 1) score += 10;
  if ((parsed.body || '').trim().length > 0) score += 20;
  if (parsed.frontmatter?.license) score += 5;
  if (parsed.frontmatter?.compatibility && parsed.frontmatter.compatibility.length > 0) score += 5;
  // referenced scripts exist
  const refs = (parsed.body.match(/(?:scripts|references|assets)\/[\w\-./]+/g) || []);
  let missing = 0;
  for (const r of refs) {
    const p = path.join(dir, r);
    if (!fs.existsSync(p)) missing++;
  }
  const refScore = Math.max(0, 20 - missing * 5);
  score += refScore;
  return Math.max(0, Math.min(100, score));
}

export interface ScanOptions {
  policyFailOn?: Severity[]; // v0 default: only critical
}

export function findSkillsUnder(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const skills: string[] = [];
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory() && isSkillDir(full)) skills.push(full);
  }
  if (isSkillDir(root)) skills.unshift(root);
  return Array.from(new Set(skills));
}

export function scanSkillDir(dir: string): SkillScanResult {
  const parsed = parseSkill(dir);
  const files = listFilesRecursive(dir, (p) => isTextFile(p));

  const ctx: DetectorContext = { rootDir: dir };
  const findings: Finding[] = [];
  for (const file of files) {
    const rel = path.relative(dir, file);
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const input = { filePath: path.join(dir, rel), lines };
    for (const det of DETECTORS) {
      findings.push(...det.run(input, ctx));
    }
  }

  const sevSummary: Record<Severity, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
  for (const f of findings) sevSummary[f.severity]++;

  const qualityScore = scoreQuality(parsed, dir);

  return {
    name: parsed.frontmatter?.name || path.basename(dir),
    path: dir,
    findings,
    severitySummary: sevSummary,
    qualityScore,
    frontmatter: parsed.frontmatter,
    validFrontmatter: parsed.frontmatterErrors.length === 0
  };
}

export function scanPath(p: string, opts: ScanOptions = {}): ScanSummary {
  const policyFailOn: Severity[] = opts.policyFailOn || ['critical'];
  const skills = findSkillsUnder(p);
  const results: SkillScanResult[] = skills.map(scanSkillDir);
  const totals: ScanSummary['totals'] = {
    skills: results.length,
    findings: 0,
    severity: { info: 0, low: 0, medium: 0, high: 0, critical: 0 }
  };
  for (const r of results) {
    totals.findings += r.findings.length;
    for (const s of Object.keys(r.severitySummary) as Severity[]) {
      totals.severity[s] += r.severitySummary[s];
    }
  }
  const failed = results.some(r => policyFailOn.some(s => r.severitySummary[s] > 0));
  return {
    scannerVersion: getScannerVersion(),
    scannedAt: new Date().toISOString(),
    skills: results,
    totals,
    policy: { failOn: policyFailOn, failed }
  };
}

export function getScannerVersion(): string {
  return VERSION;
}

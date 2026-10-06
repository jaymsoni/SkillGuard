import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { scanSkillDir } from '../src/core/scan.js';

const FIX = (name: string) => path.join(process.cwd(), 'tests/fixtures/skills', name);

describe('detectors', () => {
  it('flags prompt injection', () => {
    const res = scanSkillDir(FIX('prompt-injection-bad'));
    expect(res.findings.some(f => f.ruleId === 'SG001')).toBe(true);
    expect(res.severitySummary.high + res.severitySummary.critical).toBeGreaterThan(0);
  });

  it('flags curl|bash and IP download', () => {
    const res = scanSkillDir(FIX('curl-bash-bad'));
    expect(res.findings.some(f => f.ruleId === 'SG100')).toBe(true);
    expect(res.findings.some(f => f.ruleId === 'SG120')).toBe(true);
    expect(res.severitySummary.critical).toBeGreaterThan(0);
  });

  it('flags base64 exfil', () => {
    const res = scanSkillDir(FIX('base64-exfil-bad'));
    expect(res.findings.some(f => f.ruleId === 'SG050')).toBe(true);
    expect(res.severitySummary.high + res.severitySummary.medium).toBeGreaterThan(0);
  });

  it('flags hardcoded secrets', () => {
    const res = scanSkillDir(FIX('hardcoded-secret-bad'));
    expect(res.findings.some(f => f.ruleId === 'SG200')).toBe(true);
    expect(res.severitySummary.critical).toBeGreaterThan(0);
  });

  it('validates frontmatter and quality', () => {
    const bad = scanSkillDir(FIX('invalid-frontmatter'));
    expect(bad.validFrontmatter).toBe(false);
    const good = scanSkillDir(FIX('clean-skill'));
    expect(good.validFrontmatter).toBe(true);
    expect(good.qualityScore).toBeGreaterThan(bad.qualityScore);
  });
});

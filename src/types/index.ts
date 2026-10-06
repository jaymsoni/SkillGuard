export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Finding {
  ruleId: string;
  message: string;
  severity: Severity;
  file: string;
  line: number;
  evidence?: string;
}

export interface FrontmatterMeta {
  name: string;
  description: string;
  license?: string;
  compatibility?: string[];
  metadata?: Record<string, unknown>;
  allowedTools?: string[];
}

export interface SkillScanResult {
  name: string;
  path: string;
  findings: Finding[];
  severitySummary: Record<Severity, number>;
  qualityScore: number;
  frontmatter: FrontmatterMeta | null;
  validFrontmatter: boolean;
}

export interface ScanSummary {
  scannerVersion: string;
  scannedAt: string; // ISO timestamp
  skills: SkillScanResult[];
  totals: {
    skills: number;
    findings: number;
    severity: Record<Severity, number>;
  };
  policy: {
    failOn: Severity[];
    failed: boolean;
  };
}

export interface SkillLockEntry {
  name: string;
  path: string;
  contentHash: string; // sha256
  qualityScore: number;
  severitySummary: Record<Severity, number>; 
  scannerVersion: string;
  lockedAt: string;
}

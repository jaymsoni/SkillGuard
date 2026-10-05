import { Finding, Severity } from '../types/index.js';

export interface DetectorContext {
  rootDir: string;
}

export interface DetectorInput {
  filePath: string;
  lines: string[];
}

export interface Detector {
  id: string;
  description: string;
  severity: Severity; // default severity for this detector
  run(input: DetectorInput, ctx: DetectorContext): Finding[];
}

export function makeFinding(
  ruleId: string,
  severity: Severity,
  file: string,
  line: number,
  message: string,
  evidence?: string
): Finding {
  return { ruleId, severity, file, line, message, evidence };
}

export function eachLine(input: DetectorInput, fn: (line: string, idx: number) => void) {
  input.lines.forEach((line, i) => fn(line, i + 1));
}

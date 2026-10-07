import { Detector, eachLine, makeFinding } from './common.js';
import type { Finding } from '../types/index.js';

const patterns: { re: RegExp; label: string }[] = [
  { re: /(curl|wget)\s+[^\n|]+\|\s*(bash|sh)/i, label: 'pipe to shell' },
  { re: /bash\s+-c\s+\$\(curl[^\n]+\)/i, label: 'bash -c $(curl …)' },
  { re: /wget\s+[^\n]+-O-\s*\|\s*(bash|sh)/i, label: 'wget output piped to shell' },
  { re: /eval\s+\$\(echo\s+.+\|\s*base64\s+-d\)/i, label: 'eval of base64-decoded content' }
];

export const remoteExecDetector: Detector = {
  id: 'SG100',
  description: 'Remote execution patterns (curl|bash, wget|sh, eval base64)',
  severity: 'critical',
  run(input) {
    const findings: Finding[] = [];
    eachLine(input, (line, num) => {
      for (const { re, label } of patterns) {
        const m = line.match(re);
        if (m) {
          findings.push(makeFinding(this.id, this.severity, input.filePath, num, `Remote execution: ${label}`, line.trim()));
          break;
        }
      }
    });
    return findings;
  }
};

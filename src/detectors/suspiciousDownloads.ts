import { Detector, eachLine, makeFinding } from './common.js';
import type { Finding } from '../types/index.js';

const IP_URL = /(https?:\/\/)\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/;
const PASS_ZIP = /(zip\s+-P\s+\S+|unzip\s+-P\s+\S+|7z\s+\S*\s+-p\S+)/i;

export const suspiciousDownloadsDetector: Detector = {
  id: 'SG120',
  description: 'Suspicious download patterns: raw IP URLs, password-protected archives',
  severity: 'high',
  run(input) {
    const findings: Finding[] = [];
    eachLine(input, (line, num) => {
      if (IP_URL.test(line)) {
        const m = line.match(IP_URL)!;
        findings.push(makeFinding(this.id, 'high', input.filePath, num, `Download from raw IP: ${m[0]}`, line.trim()));
      }
      if (PASS_ZIP.test(line)) {
        findings.push(makeFinding(this.id, 'medium', input.filePath, num, 'Password-protected archive usage', line.trim()));
      }
    });
    return findings;
  }
};


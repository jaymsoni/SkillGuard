import { Detector, eachLine, makeFinding } from './common.js';
import type { Finding } from '../types/index.js';

// Common API key/token patterns (conservative). Avoid placeholders with YOUR/TEST/EXAMPLE/XXXX etc.
const SECRET_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /sk-[A-Za-z0-9]{32,}/, label: 'OpenAI-like key' },
  { re: /ghp_[A-Za-z0-9]{36,}/, label: 'GitHub token' },
  { re: /AKIA[0-9A-Z]{16}/, label: 'AWS Access Key ID' },
  { re: /aws_secret_access_key\s*[:=]\s*[A-Za-z0-9/+]{40}/i, label: 'AWS Secret Access Key' },
  { re: /xox[abpt]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
  { re: /SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}/, label: 'SendGrid API Key' },
  { re: /-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/, label: 'Private key' }
];

function isPlaceholder(s: string): boolean {
  return /(YOUR|TEST|DEMO|EXAMPLE|DUMMY|SAMPLE|PLACEHOLDER|XXXX|REDACT)/i.test(s);
}

export const secretsDetector: Detector = {
  id: 'SG200',
  description: 'Hardcoded secrets (API keys, tokens, private keys)',
  severity: 'critical',
  run(input) {
    const findings: Finding[] = [];
    eachLine(input, (line, num) => {
      for (const { re, label } of SECRET_PATTERNS) {
        const m = line.match(re);
        if (m) {
          if (isPlaceholder(m[0])) continue;
          findings.push(makeFinding(this.id, this.severity, input.filePath, num, `${label} detected`, m[0]));
          break;
        }
      }
    });
    return findings;
  }
};

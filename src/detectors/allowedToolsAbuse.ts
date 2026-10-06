import { Detector, eachLine, makeFinding } from './common.js';

// Conservative: flag when 'allowed-tools' mentions direct shell/exec tools
const SUSPICIOUS_TOOLS = [
  'shell', 'bash', 'sh', 'powershell', 'cmd', 'exec', 'subprocess'
];

export const allowedToolsAbuseDetector: Detector = {
  id: 'SG300',
  description: 'allowed-tools includes direct shell/exec tools',
  severity: 'medium',
  run(input, ctx) {
    // This detector expects to run on SKILL.md only. It inspects the frontmatter lines.
    const findings: any[] = [];
    eachLine(input, (line, num) => {
      if (/^allowed-?tools\s*:/.test(line)) {
        const lower = line.toLowerCase();
        for (const t of SUSPICIOUS_TOOLS) {
          if (lower.includes(t)) {
            findings.push(makeFinding(this.id, this.severity, input.filePath, num, `allowed-tools contains \"${t}\"`, line.trim()));
          }
        }
      }
    });
    return findings;
  }
};

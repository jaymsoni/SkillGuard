import { Detector, eachLine, makeFinding } from './common.js';
import type { Finding } from '../types/index.js';

const patterns = [
  /ignore (all|any|the)?\s*previous instructions/i,
  /disregard (the )?above/i,
  /you are now the system message/i,
  /as (the )?system[, ]/i,
  /override system (prompt|instructions)/i,
  /do not follow (the )?instructions/i
];

export const promptInjectionDetector: Detector = {
  id: 'SG001',
  description: 'Prompt-injection phrases that attempt to override prior instructions or impersonate the system message',
  severity: 'high',
  run(input) {
    const findings: Finding[] = [];
    eachLine(input, (line, num) => {
      for (const re of patterns) {
        const m = line.match(re);
        if (m) {
          findings.push(makeFinding(
            this.id,
            this.severity,
            input.filePath,
            num,
            `Prompt-injection phrase: ${m[0]}`,
            line.trim()
          ));
          break;
        }
      }
    });
    return findings;
  }
};

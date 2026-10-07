import { Detector, eachLine, makeFinding } from './common.js';
import type { Finding } from '../types/index.js';

function looksBase64(token: string): boolean {
  return /^[A-Za-z0-9+/=]{40,}$/.test(token) && /={0,2}$/.test(token);
}

function decodeBase64(s: string): string | null {
  try {
    const buf = Buffer.from(s, 'base64');
    const text = buf.toString('utf8');
    // ensure mostly printable
    const printable = text.replace(/[\x20-\x7E\n\r\t]/g, '');
    if (printable.length / text.length < 0.2) {
      return text;
    }
    return null;
  } catch {
    return null;
  }
}

function decodedLooksShell(s: string): boolean {
  return /(bash|sh|powershell|cmd|curl|wget|nc\\s|bash -c)/i.test(s) || /#!/.test(s);
}

const ZERO_WIDTH = /[\u200B\u200C\u200D\u2060\uFEFF]/;

export const obfuscationDetector: Detector = {
  id: 'SG050',
  description: 'Obfuscation patterns: suspicious base64 blobs decoding to shell, zero-width characters',
  severity: 'high',
  run(input) {
    const findings: Finding[] = [];
    eachLine(input, (line, num) => {
      if (ZERO_WIDTH.test(line)) {
        findings.push(makeFinding(this.id, 'medium', input.filePath, num, 'Contains zero-width or BOM characters', line));
      }
      const tokens = line.match(/[A-Za-z0-9/+_=]{40,}/g) || [];
      for (const t of tokens) {
        if (!looksBase64(t)) continue;
        const decoded = decodeBase64(t);
        if (decoded && decodedLooksShell(decoded)) {
          findings.push(makeFinding(this.id, this.severity, input.filePath, num, 'Base64 blob decodes to shell-like content', decoded.slice(0, 200)));
          break;
        }
      }
    });
    return findings;
  }
};

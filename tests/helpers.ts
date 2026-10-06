import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const FIXTURES = path.join(process.cwd(), 'tests/fixtures/skills');

// Copy a fixture skill into a fresh temp dir (keeping its directory name, which must match
// the frontmatter name) so tests that write lockfiles or edit files never mutate the repo
// fixtures or race with other test files running in parallel.
export function copyFixture(name: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillguard-test-'));
  const dest = path.join(root, name);
  fs.cpSync(path.join(FIXTURES, name), dest, { recursive: true });
  return dest;
}

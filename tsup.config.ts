import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  entry: ['src/cli/cli.ts'],
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  outDir: 'dist',
  clean: true,
  // Inline the package version at build time so the CLI never reads package.json from the user's cwd.
  define: {
    __SKILLDOORMAN_VERSION__: JSON.stringify(pkg.version)
  }
});

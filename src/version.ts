// Replaced at build time (tsup) and test time (vitest) with the version from package.json.
declare const __SKILLGUARD_VERSION__: string | undefined;

export const VERSION: string =
  typeof __SKILLGUARD_VERSION__ === 'string' ? __SKILLGUARD_VERSION__ : '0.0.0';

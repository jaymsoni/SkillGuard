// Replaced at build time (tsup) and test time (vitest) with the version from package.json.
declare const __SKILLDOORMAN_VERSION__: string | undefined;

export const VERSION: string =
  typeof __SKILLDOORMAN_VERSION__ === 'string' ? __SKILLDOORMAN_VERSION__ : '0.0.0';

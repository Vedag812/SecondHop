import * as schema from './schema';

export function getDb() {
  const globalEnv = (globalThis as any).env ?? (globalThis as any).process?.env;
  if (!globalEnv?.DB) {
    return null;
  }
  return null;
}

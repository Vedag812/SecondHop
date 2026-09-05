import type { AuditEvent, RescueCase, Workspace } from './rescue';

export class RescueError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface WorkspaceRow {
  id: string;
  payload: string;
  revision: number;
  updated_at: string;
}

// In-memory persistent workspace store for Node.js / Vercel Serverless runtimes
const inMemoryWorkspaces = new Map<string, WorkspaceRow>();

export type StorageMode = 'd1' | 'memory';

function runtimeEnv() {
  return (globalThis as any).env ?? (globalThis as any).process?.env;
}

/** Reports whether this runtime has a real D1 binding or the demo fallback. */
export function storageMode(): StorageMode {
  const globalEnv = runtimeEnv();
  return globalEnv?.DB && typeof globalEnv.DB.prepare === 'function'
    ? 'd1'
    : 'memory';
}

// Memory D1-compatible statement interface
class MemoryPreparedStatement {
  private sql: string;
  private params: any[] = [];

  constructor(sql: string) {
    this.sql = sql;
  }

  bind(...params: any[]) {
    this.params = params;
    return this;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const s = this.sql.trim();
    if (s.startsWith('INSERT OR IGNORE INTO rescue_workspaces')) {
      const [id, payload, updated_at] = this.params;
      if (!inMemoryWorkspaces.has(id)) {
        inMemoryWorkspaces.set(id, { id, payload, revision: 0, updated_at });
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }
    if (s.startsWith('UPDATE rescue_workspaces')) {
      const [payload, updated_at, id, expectedRevision] = this.params;
      const current = inMemoryWorkspaces.get(id);
      if (current && current.revision === expectedRevision) {
        current.payload = payload;
        current.revision += 1;
        current.updated_at = updated_at;
        return { meta: { changes: 1 } };
      }
      return { meta: { changes: 0 } };
    }
    return { meta: { changes: 1 } };
  }

  async first<T>(): Promise<T | null> {
    const s = this.sql.trim();
    if (s.includes('SELECT 1')) {
      return { '1': 1 } as unknown as T;
    }
    if (s.startsWith('SELECT payload, revision FROM rescue_workspaces WHERE id = ?')) {
      const [id] = this.params;
      const row = inMemoryWorkspaces.get(id);
      if (!row) return null;
      return { payload: row.payload, revision: row.revision } as unknown as T;
    }
    if (s.includes("SELECT w.id FROM rescue_workspaces w, json_each(w.payload, '$.cases') c")) {
      const [caseId] = this.params;
      for (const [wId, wRow] of inMemoryWorkspaces.entries()) {
        try {
          const parsed = JSON.parse(wRow.payload);
          if (Array.isArray(parsed.cases) && parsed.cases.some((c: any) => c.id === caseId)) {
            return { id: wId } as unknown as T;
          }
        } catch {}
      }
      return null;
    }
    if (s.includes("SELECT w.id AS workspaceId, json_extract(c.value, '$.id') AS caseId")) {
      const [field, targetValue] = this.params;
      const key = String(field).replace('$.', '');
      for (const [wId, wRow] of inMemoryWorkspaces.entries()) {
        try {
          const parsed = JSON.parse(wRow.payload);
          if (Array.isArray(parsed.cases)) {
            const found = parsed.cases.find((c: any) => c[key] === targetValue);
            if (found) {
              return { workspaceId: wId, caseId: found.id } as unknown as T;
            }
          }
        } catch {}
      }
      return null;
    }
    return null;
  }
}

const memoryDatabase = {
  exec: async (_sql: string) => {},
  prepare: (sql: string) => new MemoryPreparedStatement(sql),
};

const schema = `CREATE TABLE IF NOT EXISTS rescue_workspaces (id TEXT PRIMARY KEY, payload TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS rescue_webhooks (id TEXT PRIMARY KEY, processed_at TEXT NOT NULL);`;

export async function database() {
  const globalEnv = runtimeEnv();
  if (globalEnv?.DB && typeof globalEnv.DB.prepare === 'function') {
    await globalEnv.DB.exec(schema);
    return globalEnv.DB;
  }
  return memoryDatabase;
}

export const randomToken = () =>
  crypto.randomUUID().replaceAll('-', '') +
  crypto.randomUUID().replaceAll('-', '');

export function newWorkspace(): Workspace {
  return {
    createdAt: new Date().toISOString(),
    cutoffAt: new Date(Date.now() + 45 * 60000).toISOString(),
    cases: [],
    rejectedDecisions: [],
  };
}

export async function readWorkspace(id: string) {
  const db = await database();
  await db
    .prepare(
      'INSERT OR IGNORE INTO rescue_workspaces (id, payload, updated_at) VALUES (?, ?, ?)',
    )
    .bind(id, JSON.stringify(newWorkspace()), new Date().toISOString())
    .run();
  const row = await db
    .prepare('SELECT payload, revision FROM rescue_workspaces WHERE id = ?')
    .bind(id)
    .first<{ payload: string; revision: number }>();
  if (!row) throw new RescueError('Workspace not found.', 404);
  return {
    workspace: JSON.parse(row.payload) as Workspace,
    revision: row.revision,
  };
}

export async function changeWorkspace<T>(
  id: string,
  change: (workspace: Workspace) => Promise<T> | T,
): Promise<T> {
  const db = await database();
  for (let attempt = 0; attempt < 4; attempt++) {
    const { workspace, revision } = await readWorkspace(id);
    const result = await change(workspace);
    const write = await db
      .prepare(
        'UPDATE rescue_workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?',
      )
      .bind(JSON.stringify(workspace), new Date().toISOString(), id, revision)
      .run();
    if (write.meta.changes === 1) return result;
  }
  throw new RescueError(
    'Another action updated this parcel. Refresh and try again; it was not changed twice.',
    409,
  );
}

export async function hash(text: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}

export async function record(
  c: RescueCase,
  actor: string,
  action: string,
  detail: string,
) {
  const event: Omit<AuditEvent, 'hash'> = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    detail,
    state: c.state,
    previousHash: c.events.at(-1)?.hash ?? 'GENESIS',
  };
  c.events.push({ ...event, hash: await hash(JSON.stringify(event)) });
}

export function findCase(w: Workspace, id: unknown) {
  const c = w.cases.find((c) => c.id === id);
  if (!c) throw new RescueError('Return case not found.', 404);
  return c;
}

export async function findWorkspaceForCase(caseId: string) {
  const db = await database();
  const row = await db
    .prepare(
      "SELECT w.id FROM rescue_workspaces w, json_each(w.payload, '$.cases') c WHERE json_extract(c.value, '$.id') = ? LIMIT 1",
    )
    .bind(caseId)
    .first<{ id: string }>();
  if (!row) throw new RescueError('Handoff pass not found.', 404);
  return row.id;
}

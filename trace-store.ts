import type { BbPluginApi } from '@get-bb/plugin-sdk';
import type { TraceEntry } from './trace';

export function createTraceStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    'CREATE TABLE voice_trace_sessions (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, adapter TEXT NOT NULL, started_at INTEGER NOT NULL, bytes INTEGER NOT NULL DEFAULT 0, dropped INTEGER NOT NULL DEFAULT 0)',
    'CREATE TABLE voice_trace_events (session_id TEXT NOT NULL, source TEXT NOT NULL, seq INTEGER NOT NULL, received_at INTEGER NOT NULL, entry TEXT NOT NULL, PRIMARY KEY(session_id, source, seq))',
    'CREATE TABLE voice_briefings (thread_id TEXT PRIMARY KEY, touched INTEGER NOT NULL, revision TEXT, generated_at INTEGER, text TEXT, status TEXT NOT NULL DEFAULT \'missing\', error TEXT)',
  ]);
  const prune = db.transaction(() => {
    db.prepare('DELETE FROM voice_trace_sessions WHERE started_at < ? OR id NOT IN (SELECT id FROM voice_trace_sessions ORDER BY started_at DESC, rowid DESC LIMIT 20)').run(Date.now() - 7 * 86400000);
    db.prepare('DELETE FROM voice_trace_events WHERE session_id NOT IN (SELECT id FROM voice_trace_sessions)').run();
  });
  prune();
  const write = db.transaction((sessionId: string, source: string, entries: TraceEntry[]) => {
    const session = db.prepare('SELECT bytes FROM voice_trace_sessions WHERE id = ?').get(sessionId) as { bytes: number } | undefined;
    if (!session) return false;
    let bytes = session.bytes;
    for (const entry of entries) {
      const json = JSON.stringify(entry), length = Buffer.byteLength(json);
      if (bytes + length > 2_000_000) { db.prepare('UPDATE voice_trace_sessions SET dropped = dropped + 1 WHERE id = ?').run(sessionId); continue; }
      const result = db.prepare('INSERT OR IGNORE INTO voice_trace_events VALUES (?, ?, ?, ?, ?)').run(sessionId, source, entry.seq, Date.now(), json);
      if (result.changes) bytes += length;
    }
    db.prepare('UPDATE voice_trace_sessions SET bytes = ? WHERE id = ?').run(bytes, sessionId);
    return true;
  });
  return {
    database: db,
    start(id: string, threadId: string, adapter: string) { db.prepare('INSERT OR REPLACE INTO voice_trace_sessions (id, thread_id, adapter, started_at) VALUES (?, ?, ?, ?)').run(id, threadId, adapter, Date.now()); prune(); },
    write,
    prune,
    list(threadId?: string) { prune(); return db.prepare('SELECT id AS sessionId, thread_id AS threadId, adapter, started_at AS startedAt, bytes, dropped FROM voice_trace_sessions WHERE (? IS NULL OR thread_id = ?) ORDER BY started_at DESC, rowid DESC').all(threadId ?? null, threadId ?? null); },
    read(id: string, afterId: number) { prune(); return db.prepare('SELECT rowid AS cursor, source, received_at AS receivedAt, entry FROM voice_trace_events WHERE session_id = ? AND rowid > ? ORDER BY rowid LIMIT 200').all(id, afterId).map((row: unknown) => { const r = row as { cursor: number; source: string; receivedAt: number; entry: string }; return { ...r, entry: JSON.parse(r.entry) as TraceEntry }; }); },
  };
}

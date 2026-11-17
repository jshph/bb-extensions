import { z } from 'zod';
import type { SpokenTurn } from '../shared/conversation';
import type { Database } from './storage';

const rowSchema = z.object({ id: z.number(), session_id: z.string(), started_at: z.number(), turns: z.string() });
export function createVoiceMemory(db: Database) {
  function prune() {
    db.prepare('DELETE FROM voice_memory WHERE started_at < ? OR id NOT IN (SELECT id FROM voice_memory ORDER BY started_at DESC, id DESC LIMIT 20)').run(Date.now() - 7 * 86400000);
  }
  return {
    prune,
    save(session: { id: string; threadId: string; startedAt: number }, turns: SpokenTurn[], version: number) {
      const completed = turns.filter(turn => turn.complete && turn.text.trim());
      if (!completed.length) return false;
      db.prepare('INSERT INTO voice_memory (session_id, thread_id, started_at, turns, version) VALUES (?, ?, ?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET turns = excluded.turns, version = excluded.version, started_at = excluded.started_at, thread_id = excluded.thread_id WHERE excluded.started_at > voice_memory.started_at OR (voice_memory.started_at = excluded.started_at AND excluded.version > voice_memory.version)').run(session.id, session.threadId, session.startedAt, JSON.stringify(completed), version);
      prune();
      return true;
    },
    read(threadId: string, after = 0): z.infer<typeof rowSchema>[] {
      prune();
      return db.prepare('SELECT id, session_id, started_at, turns FROM voice_memory WHERE thread_id = ? AND started_at > ? ORDER BY started_at, id').all(threadId, after).map((row: unknown) => rowSchema.parse(row));
    },
    forget(threadId: string) { db.prepare('DELETE FROM voice_memory WHERE thread_id = ?').run(threadId); },
  };
}
export type VoiceMemory = ReturnType<typeof createVoiceMemory>;

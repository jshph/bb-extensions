import { expect, it } from 'vitest';
import { createFakePluginHost } from '@get-bb/plugin-sdk/testing';
import { openDatabase } from './storage';
import { createVoiceMemory } from './voice-memory';

it('keeps completed speech across instances, rejects late snapshots and separates threads', async () => {
  const { bb, harness } = createFakePluginHost({ pluginId: 'live-voice' });
  try {
    const db = openDatabase(bb), memory = createVoiceMemory(db);
    const session = { id: 'call', threadId: 'thread', startedAt: Date.now() };
    memory.save(session, [{ seq: 1, role: 'user', text: 'Use the blue version', complete: true }, { seq: 2, role: 'assistant', text: 'unfinished', complete: false }], 2);
    memory.save(session, [{ seq: 1, role: 'user', text: 'Use the red version', complete: true }], 1);
    const reopened = createVoiceMemory(db);
    expect(reopened.read('thread')).toHaveLength(1);
    expect(reopened.read('thread')[0]!.turns).toContain('blue version');
    expect(reopened.read('thread')[0]!.turns).not.toContain('unfinished');
    expect(reopened.read('other')).toEqual([]);
    expect(reopened.read('thread', session.startedAt)).toEqual([]);
    reopened.forget('thread');
    expect(memory.read('thread')).toEqual([]);
  } finally { await harness.lifecycle.dispose(); }
});

it('bounds retained calls and expires old conversation', async () => {
  const { bb, harness } = createFakePluginHost({ pluginId: 'live-voice' });
  try {
    const memory = createVoiceMemory(openDatabase(bb));
    for (let i = 0; i < 25; i++) memory.save({ id: String(i), threadId: 'thread', startedAt: Date.now() + i }, [{ seq: 1, role: 'user', text: String(i), complete: true }], 1);
    expect(memory.read('thread')).toHaveLength(20);
    memory.save({ id: 'expired', threadId: 'thread', startedAt: Date.now() - 8 * 86400000 }, [{ seq: 1, role: 'user', text: 'old', complete: true }], 1);
    expect(memory.read('thread')).toHaveLength(20);
    expect(memory.read('thread').some(row => row.session_id === 'expired')).toBe(false);
  } finally { await harness.lifecycle.dispose(); }
});

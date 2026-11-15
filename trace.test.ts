import { describe, expect, it, vi } from 'vitest';
import { createFakePluginHost, makeThreadResponse } from '@get-bb/plugin-sdk/testing';
import { BrowserTrace, describeVoiceEvent, type TraceEntry } from './trace';
import { createPlugin } from './server';
import { createTraceStore } from './trace-store';

const sessionId = 'a77bc81a-9777-466c-b231-e04784794cf6';
const entry: TraceEntry = { seq: 1, at: 100, elapsedMs: 5, name: 'context.sent', data: { text: 'quoted background', channel: 'developer', bytes: 17 } };

describe('diagnostic tracing', () => {
  it('selects transcript/turn data without recording audio, SDP, credentials or unrelated payloads', () => {
    expect(describeVoiceEvent({ type: 'output_audio.delta', delta: 'audio bytes' })).toBeNull();
    expect(describeVoiceEvent({ type: 'session.created', sdp: 'secret' })).toBeNull();
    expect(describeVoiceEvent({ type: 'turn.done', turn: { role: 'user', id: 'turn' }, token: 'secret', sdp: 'secret' })).toEqual({ type: 'turn.done', role: 'user', id: 'turn' });
    expect(describeVoiceEvent({ type: 'output_transcript.added', item: { text: 'hello', id: 'speech' }, audio: 'bytes' })).toEqual({ type: 'output_transcript.added', id: 'speech', text: 'hello', characters: 5, truncated: false });
    expect(describeVoiceEvent({ type: 'input_transcript.added', item: { text: 'x'.repeat(33000) } })).toMatchObject({ characters: 33000, truncated: true, text: 'x'.repeat(32000) });
  });
  it('flushes ordered batches and marks failed batches with sequence gaps instead of blocking later delivery', async () => {
    const batches: TraceEntry[][] = [];
    const send = vi.fn(async (entries: TraceEntry[]) => { batches.push(entries); if (batches.length === 1) throw new Error('offline'); });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const trace = new BrowserTrace(send);
      for (let i = 0; i < 55; i++) trace.record('turn', { id: String(i) });
      await trace.flush();
      expect(batches.map(batch => batch.length)).toEqual([50, 5]);
      expect(batches[1]![0]!.seq).toBe(51);
      expect(warn).toHaveBeenCalledOnce();
    } finally { warn.mockRestore(); }
  });
  it('retains per-call traces after call end, with idempotent browser batches', async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: 'live-voice', sdk: { threads: { get: async () => makeThreadResponse({ id: 'thread', providerId: 'claude', status: 'idle' }) } } });
    const plugin = createPlugin(async () => 'answer');
    await plugin(bb);
    try {
      await harness.behavior.callRpc('start', { sessionId, threadId: 'thread', sdp: 'sensitive SDP' });
      await harness.behavior.callRpc('stop', { sessionId });
      await harness.behavior.callRpc('trace', { sessionId, entries: [entry] });
      await harness.behavior.callRpc('trace', { sessionId, entries: [entry] });
      const rows = await harness.behavior.callRpc('traceRead', { sessionId }) as { source: string; entry: TraceEntry }[];
      expect(rows.filter(row => row.source === 'browser')).toHaveLength(1);
      expect(rows.some(row => row.entry.name === 'session.stop')).toBe(true);
      expect(JSON.stringify(rows)).not.toContain('sensitive SDP');
      expect(await harness.behavior.callRpc('traceSessions', { threadId: 'other' })).toEqual([]);
      expect(await harness.behavior.callRpc('traceSessions', { threadId: 'thread' })).toMatchObject([{ sessionId, adapter: 'delegated', dropped: 0 }]);
    } finally { await harness.lifecycle.dispose(); }
  });
  it('bounds retained calls and bytes, reports drops, and returns stable cursor pages', async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: 'live-voice' });
    try {
      const store = createTraceStore(bb);
      for (let i = 0; i < 21; i++) store.start('call-' + i, 'thread', 'native');
      expect(store.list()).toHaveLength(20);
      store.start(sessionId, 'thread', 'native');
      for (let i = 1; i <= 100; i++) store.write(sessionId, 'browser', [{ ...entry, seq: i, data: { text: 'x'.repeat(32000) } }]);
      const session = store.list().find((row: unknown) => (row as { sessionId: string }).sessionId === sessionId) as { bytes: number; dropped: number };
      expect(session.bytes).toBeLessThanOrEqual(2_000_000);
      expect(session.dropped).toBeGreaterThan(0);
      const page = store.read(sessionId, 0);
      expect(page.length).toBeGreaterThan(0);
      expect(store.read(sessionId, page.at(-1)!.cursor)).toEqual([]);
    } finally { await harness.lifecycle.dispose(); }
  });
});

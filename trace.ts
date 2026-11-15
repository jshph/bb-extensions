import { z } from 'zod';

export const traceEntrySchema = z.object({
  seq: z.number().int().positive(),
  at: z.number().finite(),
  elapsedMs: z.number().nonnegative(),
  name: z.string().min(1).max(100),
  data: z.object({
    type: z.string().max(100).optional(),
    id: z.string().max(200).optional(),
    role: z.string().max(40).optional(),
    text: z.string().max(32000).optional(),
    channel: z.string().max(40).optional(),
    characters: z.number().nonnegative().optional(),
    bytes: z.number().nonnegative().optional(),
    eventAt: z.number().finite().optional(),
    updateSeq: z.number().nonnegative().optional(),
    final: z.boolean().optional(),
    truncated: z.boolean().optional(),
    state: z.string().max(100).optional(),
    inputActive: z.boolean().optional(),
    assistantActive: z.boolean().optional(),
    firstExchangeDone: z.boolean().optional(),
    contextPending: z.boolean().optional(),
  }),
});
export type TraceEntry = z.infer<typeof traceEntrySchema>;
export type TraceData = TraceEntry['data'];
export type TraceSink = (name: string, data?: TraceData) => void;

export class BrowserTrace {
  private sequence = 0;
  private started = performance.now();
  private queue: TraceEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private sending: Promise<void> | null = null;
  constructor(private readonly send: (entries: TraceEntry[]) => Promise<unknown>) {}
  record: TraceSink = (name, data = {}) => {
    this.queue.push({ seq: ++this.sequence, at: Date.now(), elapsedMs: performance.now() - this.started, name, data });
    if (this.queue.length > 1000) this.queue.shift();
    if (!this.timer) this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, 250);
  };
  async flush(): Promise<void> {
    clearTimeout(this.timer); this.timer = undefined;
    if (this.sending) { await this.sending; if (this.queue.length) await this.flush(); return; }
    this.sending = (async () => {
      while (this.queue.length) {
        const batch = this.queue.splice(0, 50);
        try { await this.send(batch); }
        catch { console.warn('Live Voice diagnostic trace batch was not saved; its sequence numbers will be missing.'); }
      }
    })();
    try { await this.sending; } finally { this.sending = null; }
  }
}

export function describeVoiceEvent(value: unknown): TraceData | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as Record<string, unknown>;
  if (typeof event.type !== 'string' || !/^(turn\.|.*transcript[._]|delegation\.|session\.context\.|input_audio_buffer\.speech_|error$)/.test(event.type)) return null;
  const item = (event.item && typeof event.item === 'object' ? event.item : {}) as Record<string, unknown>;
  const turn = (event.turn && typeof event.turn === 'object' ? event.turn : {}) as Record<string, unknown>;
  const content = Array.isArray(item.content) ? item.content : [];
  const error = (event.error && typeof event.error === 'object' ? event.error : {}) as Record<string, unknown>;
  const text = typeof error.message === 'string' ? error.message : typeof item.text === 'string' ? item.text : typeof event.transcript === 'string' ? event.transcript : typeof event.delta === 'string' ? event.delta : content.filter(part => part && typeof part === 'object' && typeof part.text === 'string').map(part => part.text).join('\n');
  const id = item.id ?? event.delegation_item_id ?? event.item_id ?? turn.id;
  const role = turn.role ?? item.role;
  return { type: event.type.slice(0, 100), ...(typeof id === 'string' ? { id: id.slice(0, 200) } : {}), ...(typeof role === 'string' ? { role: role.slice(0, 40) } : {}), ...(text ? { text: text.slice(0, 32000), characters: text.length, truncated: text.length > 32000 } : {}) };
}

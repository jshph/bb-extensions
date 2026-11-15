import { useEffect, useRef, useState } from 'react';
import { definePluginApp, useComposer, useRpc, useRealtime } from '@get-bb/plugin-sdk/app';
import { z } from 'zod';
import type { rpcContract } from './contract';
import { VoiceClient } from './voice-client';
import { SpokenConversation } from './conversation';
import { BrowserTrace } from './trace';

const eventSchema = z.object({
  type: z.string(),
  item: z.object({ id: z.string().optional(), type: z.string().optional(), target: z.string().optional(), text: z.string().optional(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional() }).optional(),
  turn: z.object({ role: z.string().optional() }).optional(),
  error: z.object({ message: z.string() }).optional(),
});

function Waveform() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" className="size-5" aria-hidden="true"><path d="M4 10v4m5-9v14m5-11v8m5-6v4" /></svg>;
}

function Voice({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const audio = useRef<HTMLAudioElement>(null);
  const client = useRef<VoiceClient | null>(null);
  const [status, setStatus] = useState<'closed' | 'connecting' | 'active'>('closed');
  const [message, setMessage] = useState<string | null>(null);
  const [backend, setBackend] = useState('ready');
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const delivered = useRef(new Set<string>());
  const conversation = useRef(new SpokenConversation());
  const submissions = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; send(): void }>());
  const contextRequested = useRef(false);
  const adapter = useRef<'native' | 'delegated'>('delegated');
  const afterSeq = useRef(0);
  const diagnostics = useRef<BrowserTrace | null>(null);
  const replyText = useRef(new Map<string, string>());
  const synchronize = useRef<() => void>(() => {});
  const refreshing = useRef(false);
  const refreshAgain = useRef(false);

  useEffect(() => {
    const stop = () => { client.current?.stop(); client.current = null; };
    window.addEventListener('pagehide', stop);
    return () => { window.removeEventListener('pagehide', stop); stop(); };
  }, [threadId]);

  const apply = (result: Awaited<ReturnType<typeof rpc.call<'poll'>>>, current: VoiceClient) => {
    if (client.current !== current) return;
    if (result.ended) { current.stop(result.ended); return; }
    setBackend(result.state);
    if (result.backgroundContext) current.addBackgroundContext(result.backgroundContext);
    for (const update of result.updates) {
      if (update.seq <= afterSeq.current) continue;
      diagnostics.current?.record('backing.received', { id: update.id, updateSeq: update.seq, characters: update.text.length, final: update.final, channel: update.channel });
      if (update.text) {
        current.sendResult(update.id, update.text, update.channel);
        if (update.channel === 'speakable') replyText.current.set(update.id, (replyText.current.get(update.id) ?? '') + update.text);
      }
      if (update.final) conversation.current.rememberBackendAnswer(replyText.current.get(update.id) ?? '');
      afterSeq.current = update.seq;
    }
  };
  synchronize.current = () => {
    const current = client.current;
    if (!current || status !== 'active') return;
    if (refreshing.current) { refreshAgain.current = true; return; }
    refreshing.current = true;
    void rpc.call('poll', { sessionId: current.sessionId, afterSeq: afterSeq.current }).then(result => apply(result, current)).catch(error => current.stop(error instanceof Error ? error.message : 'Voice session ended')).finally(() => { refreshing.current = false; if (refreshAgain.current) { refreshAgain.current = false; synchronize.current(); } });
  };
  useRealtime('voice-changed', payload => {
    if (typeof payload === 'object' && payload && 'sessionId' in payload && payload.sessionId === client.current?.sessionId) synchronize.current();
  });
  useEffect(() => { if (status === 'active') synchronize.current(); }, [status]);

  function start() {
    if (!audio.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setMessage('Voice needs microphone access in a supported browser over HTTPS.');
      return;
    }
    delivered.current.clear(); conversation.current = new SpokenConversation(); contextRequested.current = false; afterSeq.current = 0; replyText.current.clear();
    setMuted(false); setBlocked(false); setBackend('ready');
    let traceReady!: () => void;
    const ready = new Promise<void>(resolve => { traceReady = resolve; });
    const diagnostic = new BrowserTrace(async entries => {
      await ready;
      const result = await rpc.call('trace', { sessionId: next.sessionId, entries });
      if (!result.saved) throw new Error('Trace session unavailable');
    });
    diagnostics.current = diagnostic;
    const next = new VoiceClient({
      trace: diagnostic.record,
      audio: audio.current,
      mediaDevices: navigator.mediaDevices,
      createPeer: () => new RTCPeerConnection(),
      state: (state, error) => {
        if (state === 'closed') { for (const pending of submissions.current.values()) clearTimeout(pending.timer); submissions.current.clear(); }
        setStatus(state); setMessage(error);
      },
      audioBlocked: () => setBlocked(true),
      request: async command => {
        if (command.action === 'start') { try { const result = await rpc.call('start', { threadId, sessionId: command.sessionId, sdp: command.sdp }); adapter.current = result.adapter; diagnostic.record('adapter.selected', { state: result.adapter }); return result; } finally { traceReady(); } }
        if (command.action === 'stop') { void diagnostic.flush(); await rpc.call('stop', { sessionId: command.sessionId }); }
        else apply(await rpc.call('poll', { sessionId: command.sessionId, afterSeq: afterSeq.current }), next);
        return { sdp: null };
      },
      event: value => {
        const parsed = eventSchema.safeParse(value);
        if (!parsed.success) return;
        const event = parsed.data;
        if (event.type === 'error') { next.stop(event.error?.message ?? 'Voice connection failed'); return; }
        if (adapter.current === 'native') return;
        conversation.current.consume(value);
        if (event.type === 'turn.done' && event.turn?.role === 'user') {
          for (const pending of [...submissions.current.values()]) pending.send();
        }
        if (event.type === 'turn.done' && event.turn?.role === 'assistant' && !contextRequested.current) {
          contextRequested.current = true;
          void rpc.call('context', { sessionId: next.sessionId }).then(result => {
            if (client.current === next && result.text) next.addBackgroundContext(result.text);
          }).catch(() => setMessage('Thread background was unavailable. Voice can still ask the backing agent.'));
        }
        if (event.type === 'delegation.created' && event.item?.type === 'delegation' && event.item.target === 'client' && event.item.id) {
          const id = event.item.id;
          const text = event.item.content?.filter(part => part.type === 'input_text').map(part => part.text ?? '').join('\n').trim();
          if (!text) { next.sendResult(id, 'The delegation contained no request. Please ask again.'); return; }
          setBackend('working');
          if (submissions.current.has(id)) return;
          const send = () => {
            const pending = submissions.current.get(id);
            if (!pending) return;
            clearTimeout(pending.timer);
            submissions.current.delete(id);
            void rpc.call('delegate', { sessionId: next.sessionId, id, text, turns: conversation.current.snapshot() }).catch(error => {
              next.sendResult(id, 'The backing request failed: ' + (error instanceof Error ? error.message : String(error)));
            });
          };
          submissions.current.set(id, { send, timer: setTimeout(send, 350) });
          if (conversation.current.userComplete) send();
        }
      },
    });
    client.current = next;
    void next.start().finally(traceReady);
  }

  const label = status === 'connecting' ? 'Connecting voice…' : backend === 'attention' ? 'Approve in BB' : backend === 'working' ? 'Agent working' : muted ? 'Mic muted' : 'Voice connected';
  return <div className="flex shrink-0 items-center gap-1 text-xs">
    <audio ref={audio} autoPlay />
    {status === 'closed' ? <button type="button" aria-label="Start live voice" title={message ?? 'Start live voice · Codex subscription'} onClick={start} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><Waveform /></button> : <>
      <span role="status" className={status === 'connecting' ? 'animate-pulse' : ''} title={message ?? label}>{label}</span>
      <button type="button" className="rounded-md px-2 py-1 hover:bg-muted" onClick={() => { client.current?.mute(!muted); setMuted(!muted); }} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? 'Unmute' : 'Mute'}</button>
      {backend !== 'ready' ? <button type="button" className="rounded-md px-2 py-1 hover:bg-muted" onClick={() => { const current = client.current; if (current) void rpc.call('control', { sessionId: current.sessionId, action: 'cancelWork' }).then(() => setMessage('Cancellation requested. Completed actions are not undone.')).catch(error => setMessage(String(error))); }}>Stop agent</button> : null}
      <button type="button" className="rounded-md px-2 py-1 hover:bg-muted" onClick={() => client.current?.stop()}>End</button>
    </>}
    {blocked && status === 'active' ? <button type="button" className="rounded-md px-2 py-1 hover:bg-muted" onClick={() => { void audio.current?.play().then(() => setBlocked(false)).catch(() => setMessage('Allow browser audio playback to hear the call.')); }}>Enable audio</button> : null}
    {message ? <span role="alert" className="sr-only">{message}</span> : null}
  </div>;
}

function VoiceAction() {
  const { scope } = useComposer();
  const rpc = useRpc<typeof rpcContract>();
  const threadId = scope.kind === 'thread' ? scope.threadId : null;
  const [available, setAvailable] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    setAvailable(null);
    if (threadId) void rpc.call('available', { threadId }).then(result => { if (!disposed && result.available) setAvailable(threadId); }).catch(() => {});
    return () => { disposed = true; };
  }, [threadId, rpc]);
  return threadId && available === threadId ? <Voice key={threadId} threadId={threadId} /> : null;
}

export default definePluginApp(app => {
  app.composer.customize({ id: 'live-voice', scopes: ['thread'], actions: [{ id: 'live-voice', component: VoiceAction }] });
});

import { describe, expect, it, vi } from 'vitest';
import { VoiceClient } from './voice-client';

function fixture() {
  const sent: Record<string, unknown>[] = [];
  const channel = { readyState: 'open', onmessage: null as null | ((event: { data: string }) => void), send: (text: string) => sent.push(JSON.parse(text)), close: vi.fn() };
  const track = { enabled: true, onended: null, stop: vi.fn() };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const peer = { addTrack: vi.fn(), createDataChannel: () => channel, createOffer: async () => ({ type: 'offer', sdp: 'offer' }), setLocalDescription: async () => {}, localDescription: { sdp: 'offer' }, setRemoteDescription: async () => {}, close: vi.fn() };
  const request = vi.fn(async () => ({ sdp: 'answer' }));
  const audio = { play: async () => {}, pause: vi.fn(), srcObject: null };
  const client = new VoiceClient({ audio: audio as unknown as HTMLAudioElement, mediaDevices: { getUserMedia: async () => stream as unknown as MediaStream }, createPeer: () => peer as unknown as RTCPeerConnection, request, state: vi.fn(), audioBlocked: vi.fn() });
  const event = (value: unknown) => channel.onmessage?.({ data: JSON.stringify(value) });
  return { client, channel, sent, track, request, event };
}

describe('browser voice lifecycle', () => {
  it('defers quiet background until the first exchange and pauses while the user speaks', async () => {
    const { client, sent, event } = fixture();
    try {
      await client.start();
      client.addBackgroundContext('x'.repeat(1500));
      expect(sent).toHaveLength(0);
      event({ type: 'turn.done', turn: { role: 'assistant' } });
      expect(sent).toHaveLength(1);
      expect(sent[0]).toMatchObject({ type: 'session.context.append', channel: 'developer' });
      event({ type: 'input_transcript.added', item: { text: 'question' } });
      event({ type: 'session.context.appended' });
      expect(sent).toHaveLength(1);
      event({ type: 'turn.done', turn: { role: 'user' } });
      event({ type: 'turn.done', turn: { role: 'assistant' } });
      expect(sent).toHaveLength(2);
    } finally { client.stop(); }
  });
  it('releases microphone and transport once and drops late delegation answers', async () => {
    const { client, channel, track, request, sent } = fixture();
    await client.start();
    client.stop(); client.stop();
    client.sendResult('id', 'late response');
    expect(sent).toHaveLength(0);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(request.mock.calls).toHaveLength(2);
  });
});

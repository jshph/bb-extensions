import type { Voice } from './voices';
import type { BbPluginApi } from '@get-bb/plugin-sdk';

export type NativeVoiceCommand = { action: 'start'; sessionId: string; sdp: string; experimental_voice?: Voice; experimental_startupBriefing?: string | null } | { action: 'stop' | 'keepAlive'; sessionId: string };
type NativeThreads = { voice?: (args: { threadId: string; command: NativeVoiceCommand }) => Promise<{ sdp: string | null }> };

export async function nativeVoice(bb: BbPluginApi, threadId: string, command: NativeVoiceCommand): Promise<{ sdp: string | null }> {
  const threads = bb.sdk.threads as typeof bb.sdk.threads & NativeThreads;
  if (typeof threads.voice !== 'function') throw new Error('Native Codex voice requires BB’s native voice transport bridge. This BB build does not expose it. No second Codex writer or delegated fallback will be started.');
  return threads.voice({ threadId, command });
}

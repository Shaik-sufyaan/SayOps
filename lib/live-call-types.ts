export type LiveCallSpeaker = "assistant" | "user" | null

export interface LiveCallTranscriptTurn {
  id: string
  role: "assistant" | "user"
  text: string
  final: boolean
  createdAt: string
}

export interface LiveCallHighlight {
  id: string
  kind: "memory" | "booking" | "payment" | "handoff" | "tool" | "status"
  label: string
  detail?: string
  tone: "info" | "success" | "warning" | "accent"
  createdAt: string
}

export interface LiveCallWaveform {
  mixed: number[]
  assistant: number[]
  user: number[]
}

export interface LiveCallSession {
  id: string
  callId: string
  conversationId?: string
  organizationId?: string
  toLabel: string
  fromLabel: string
  status: string
  elapsedSeconds: number
  activeSpeaker: LiveCallSpeaker
  waveform: LiveCallWaveform
  transcriptTurns: LiveCallTranscriptTurn[]
  highlights: LiveCallHighlight[]
  updatedAt: string
  startedAt: string
}

export type LiveCallEvent =
  | { type: "snapshot"; sessions: LiveCallSession[] }
  | { type: "call-started"; session: LiveCallSession }
  | { type: "call-status"; session: LiveCallSession }
  | { type: "transcript-partial"; session: LiveCallSession; turn: LiveCallTranscriptTurn }
  | { type: "transcript-final"; session: LiveCallSession; turn: LiveCallTranscriptTurn }
  | { type: "speech-state"; session: LiveCallSession; status: "started" | "stopped"; role: LiveCallSpeaker }
  | { type: "conversation-update"; session: LiveCallSession }
  | { type: "model-output"; session: LiveCallSession; highlight?: LiveCallHighlight }
  | { type: "waveform-sample"; session: LiveCallSession }
  | { type: "user-interrupted"; session: LiveCallSession }
  | { type: "call-ended"; callId: string; session: LiveCallSession }

export type LiveCallsConnectionState = "connecting" | "open" | "reconnecting" | "error"

const TERMINAL_LIVE_CALL_STATUSES = new Set(["ended", "completed", "failed", "canceled"])

export function isTerminalLiveCallStatus(status: string | null | undefined): boolean {
  return TERMINAL_LIVE_CALL_STATUSES.has((status ?? "").trim().toLowerCase())
}

export function formatLiveCallStatus(status: string): string {
  const normalized = status.trim()
  if (!normalized) return "Live"
  return normalized.replace(/[-_]+/g, " ")
}

export function getLiveCallSessionKey(session: Pick<LiveCallSession, "id" | "callId" | "conversationId">): string {
  return session.conversationId ?? session.callId ?? session.id
}

export function sortLiveCallSessions(sessions: LiveCallSession[]): LiveCallSession[] {
  return [...sessions].sort((left, right) => {
    const rightTimestamp = Date.parse(right.updatedAt) || Date.parse(right.startedAt) || 0
    const leftTimestamp = Date.parse(left.updatedAt) || Date.parse(left.startedAt) || 0
    return rightTimestamp - leftTimestamp
  })
}

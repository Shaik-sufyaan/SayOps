import { auth } from "@/lib/firebase"
import {
  fetchLiveConversations,
  fetchMessages,
  mapConversationToCallRecord,
} from "@/lib/api-client"
import { buildRenderableTranscriptTurns } from "@/lib/transcript-display"
import type { Conversation } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import type {
  LiveCallEvent,
  LiveCallHighlight,
  LiveCallSession,
  LiveCallWaveform,
} from "@/lib/live-call-types"
import { sortLiveCallSessions } from "@/lib/live-call-types"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.AGENT_BACKEND_URL ||
  "http://localhost:3001"

const FALLBACK_WAVEFORM_PATTERN = [
  0.16, 0.24, 0.12, 0.3, 0.2, 0.36, 0.22, 0.42,
  0.18, 0.28, 0.14, 0.34, 0.16, 0.22, 0.1, 0.26,
] as const

function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) return endpoint
  return `${BACKEND_URL}${endpoint.startsWith("/api") ? "" : "/api"}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => "")
  if (!text) return `Live calls request failed (${response.status})`

  try {
    const parsed = JSON.parse(text)
    if (typeof parsed?.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error
    }
  } catch {}

  return text
}

async function getStreamHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser
  if (!user) {
    throw new Error("You need to be signed in to view live calls.")
  }

  const token = await user.getIdToken()
  const currentOrgId = useOrgStore.getState().currentOrgId

  return {
    Authorization: `Bearer ${token}`,
    Accept: "text/event-stream",
    ...(currentOrgId ? { "X-Organization-Id": currentOrgId } : {}),
  }
}

function normalizeStatus(conversation: Conversation): string {
  const rawStatus = typeof conversation.metadata?.vapi_status === "string"
    ? conversation.metadata.vapi_status
    : conversation.status

  return rawStatus.trim().toLowerCase() || "live"
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildFallbackLane(seed: number, scale: number): number[] {
  return Array.from({ length: 32 }, (_, index) => {
    const pattern = FALLBACK_WAVEFORM_PATTERN[(index + seed) % FALLBACK_WAVEFORM_PATTERN.length] ?? 0.2
    const wobble = (((seed + 3) * (index + 5)) % 9) / 100
    return clamp(pattern * scale + wobble, 0.08, 0.88)
  })
}

function buildFallbackWaveform(seed: number, activeRole: LiveCallSession["activeSpeaker"]): LiveCallWaveform {
  const assistant = buildFallbackLane(seed, activeRole === "assistant" ? 1.1 : 0.7)
  const user = buildFallbackLane(seed + 5, activeRole === "user" ? 1.1 : 0.68)

  return {
    mixed: assistant.map((value, index) => clamp(Math.max(value, user[index] ?? 0.08), 0.08, 0.9)),
    assistant,
    user,
  }
}

function buildBootstrapHighlights(conversation: Conversation): LiveCallHighlight[] {
  const highlights: LiveCallHighlight[] = []
  const status = normalizeStatus(conversation)
  const summary = typeof conversation.metadata?.summary === "string"
    ? conversation.metadata.summary
    : typeof conversation.metadata?.summary?.summary === "string"
      ? conversation.metadata.summary.summary
      : ""

  if (status === "forwarding") {
    highlights.push({
      id: `${conversation.id}:handoff`,
      kind: "handoff",
      label: "Handoff in progress",
      detail: "The call is being routed live.",
      tone: "warning",
      createdAt: conversation.updated_at,
    })
  }

  if (/book|appointment|calendar/i.test(summary)) {
    highlights.push({
      id: `${conversation.id}:booking`,
      kind: "booking",
      label: "Booking context detected",
      detail: "Conversation summary mentions scheduling.",
      tone: "success",
      createdAt: conversation.updated_at,
    })
  }

  if (/payment|refund|invoice/i.test(summary)) {
    highlights.push({
      id: `${conversation.id}:payment`,
      kind: "payment",
      label: "Payment topic detected",
      detail: "Conversation summary mentions billing or payments.",
      tone: "accent",
      createdAt: conversation.updated_at,
    })
  }

  return highlights
}

function buildBootstrapSession(conversation: Conversation, messages: Awaited<ReturnType<typeof fetchMessages>>): LiveCallSession {
  const call = mapConversationToCallRecord(conversation)
  const fallbackTurnTimestamp = messages[messages.length - 1]?.created_at ?? conversation.updated_at
  const transcriptTurns = buildRenderableTranscriptTurns(messages)
    .slice(-12)
    .map((turn) => ({
      id: turn.id,
      role: turn.role,
      text: turn.text,
      final: true,
      createdAt: fallbackTurnTimestamp,
    }))

  const activeSpeaker = transcriptTurns[transcriptTurns.length - 1]?.role ?? null
  const seed = conversation.id.length + transcriptTurns.length * 7
  const durationSeconds = Number(conversation.metadata?.vapi_duration_seconds ?? 0)
  const elapsedSeconds = durationSeconds > 0
    ? durationSeconds
    : Math.max(0, Math.floor((Date.now() - Date.parse(conversation.started_at)) / 1000))

  return {
    id: conversation.id,
    callId: typeof conversation.metadata?.vapi_call_id === "string"
      ? conversation.metadata.vapi_call_id
      : conversation.id,
    conversationId: conversation.id,
    organizationId: conversation.organization_id,
    toLabel: call.agent_name?.trim() || "Agent",
    fromLabel: call.caller_phone,
    status: normalizeStatus(conversation),
    elapsedSeconds,
    activeSpeaker,
    waveform: buildFallbackWaveform(seed, activeSpeaker),
    transcriptTurns,
    highlights: buildBootstrapHighlights(conversation),
    updatedAt:
      (typeof conversation.metadata?.vapi_runtime_seen_at === "string" && conversation.metadata.vapi_runtime_seen_at) ||
      conversation.last_message_at ||
      conversation.updated_at,
    startedAt: conversation.started_at,
  }
}

export async function fetchBootstrapLiveSessions(): Promise<LiveCallSession[]> {
  const conversations = await fetchLiveConversations()
  if (conversations.length === 0) return []

  const results = await Promise.allSettled(
    conversations.map(async (conversation) => {
      const messages = await fetchMessages(conversation.id).catch(() => [])
      return buildBootstrapSession(conversation, messages)
    })
  )

  return sortLiveCallSessions(
    results
      .filter((result): result is PromiseFulfilledResult<LiveCallSession> => result.status === "fulfilled")
      .map((result) => result.value)
  )
}

export async function streamLiveCalls(input: {
  signal: AbortSignal
  onOpen?: () => void
  onEvent: (event: LiveCallEvent) => void
}): Promise<void> {
  const response = await fetch(buildApiUrl("/live-calls/stream"), {
    method: "GET",
    cache: "no-store",
    headers: await getStreamHeaders(),
    signal: input.signal,
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  if (!response.body) {
    throw new Error("Live call stream body missing.")
  }

  input.onOpen?.()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
      buffer = buffer.replace(/\r\n/g, "\n")

      let boundaryIndex = buffer.indexOf("\n\n")
      while (boundaryIndex !== -1) {
        const rawFrame = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)

        const data = rawFrame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n")

        if (data.length > 0) {
          try {
            input.onEvent(JSON.parse(data) as LiveCallEvent)
          } catch (error) {
            console.error("Failed to parse live call stream payload:", error)
          }
        }

        boundaryIndex = buffer.indexOf("\n\n")
      }

      if (done) break
    }
  } finally {
    reader.releaseLock()
  }
}

"use client"

import { formatDistanceToNowStrict } from "date-fns"

import { AudioWaveformRail } from "@/components/live-calls/AudioWaveformRail"
import { ConversationBubble } from "@/components/live-calls/ConversationBubble"
import { LiveCallHeaderPill } from "@/components/live-calls/LiveCallHeaderPill"
import { RecordingTimerChip } from "@/components/live-calls/RecordingTimerChip"
import type { LiveCallHighlight, LiveCallSession } from "@/lib/live-call-types"
import { formatLiveCallStatus } from "@/lib/live-call-types"
import { cn } from "@/lib/utils"

const HIGHLIGHT_TONE_CLASSNAMES: Record<LiveCallHighlight["tone"], string> = {
  info: "border-[#7ec7ff]/18 bg-[#7ec7ff]/10 text-[#d3eeff]",
  success: "border-[#7ef5c2]/18 bg-[#7ef5c2]/10 text-[#d7fff0]",
  warning: "border-[#f6bb64]/20 bg-[#f6bb64]/10 text-[#ffe2bc]",
  accent: "border-[#d6a0ff]/18 bg-[#d6a0ff]/10 text-[#f0dcff]",
}

function formatUpdatedAt(timestamp: string): string {
  const parsed = Date.parse(timestamp)
  if (!Number.isFinite(parsed)) {
    return "Updated just now"
  }

  return `Updated ${formatDistanceToNowStrict(new Date(parsed), { addSuffix: true })}`
}

function getConnectionCopy(session: LiveCallSession): string {
  if (session.activeSpeaker === "assistant") return "Agent speaking"
  if (session.activeSpeaker === "user") return "Caller speaking"
  return formatLiveCallStatus(session.status)
}

export function LiveCallCard({
  session,
  className,
}: {
  session: LiveCallSession
  className?: string
}) {
  const transcriptTurns = session.transcriptTurns.slice(-6)
  const inspectHref = `/assistant?ref=${encodeURIComponent(session.conversationId ?? session.callId)}`

  return (
    <article className={cn("relative animate-[live-call-card-in_0.32s_ease] pt-7", className)}>
      <LiveCallHeaderPill
        toLabel={session.toLabel}
        fromLabel={session.fromLabel}
        className="absolute left-4 top-0 z-20 max-w-[calc(100%-8rem)]"
      />

      <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(45,50,58,0.28)_0%,rgba(20,20,20,0)_36%),linear-gradient(180deg,#1a1a1b_0%,#141414_100%)] p-4 pt-16 text-white shadow-[0_30px_70px_-42px_rgba(0,0,0,0.92)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0)_100%)]" />

        <RecordingTimerChip
          elapsedSeconds={session.elapsedSeconds}
          status={session.status}
          className="absolute right-4 top-4 z-20"
        />

        <div className="mb-3 flex items-center justify-between gap-3 pr-24 text-[11px] uppercase tracking-[0.22em] text-white/48">
          <span>{getConnectionCopy(session)}</span>
          <span className="hidden sm:inline">{formatUpdatedAt(session.updatedAt)}</span>
        </div>

        <AudioWaveformRail
          waveform={session.waveform}
          activeSpeaker={session.activeSpeaker}
          status={session.status}
        />

        {session.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {session.highlights.slice(0, 3).map((highlight) => (
              <span
                key={highlight.id}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium tracking-[-0.01em]",
                  HIGHLIGHT_TONE_CLASSNAMES[highlight.tone]
                )}
                title={highlight.detail}
              >
                {highlight.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
          {transcriptTurns.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-white/6 bg-white/[0.03] px-6 text-center text-sm text-white/44">
              Waiting for the first live turn to land.
            </div>
          ) : (
            transcriptTurns.map((turn) => (
              <ConversationBubble
                key={turn.id}
                role={turn.role}
                text={turn.text}
                final={turn.final}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/6 pt-3 text-[11px] text-white/42">
          <span className="truncate">
            {session.waveform.mixed.length > 0 ? "Realtime audio visualization active" : "Live transcript fallback active"}
          </span>
          <a
            href={inspectHref}
            className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-white/66 transition-colors hover:border-white/20 hover:text-white"
          >
            Inspect
          </a>
        </div>
      </div>
    </article>
  )
}

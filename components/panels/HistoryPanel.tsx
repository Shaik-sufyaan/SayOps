"use client"

import React from "react"

import { LiveCallCard } from "@/components/live-calls/LiveCallCard"
import { CallHistoryTable } from "@/components/call-history-table"
import { Badge } from "@/components/ui/badge"
import { useLiveCallsFeed } from "@/hooks/useLiveCallsFeed"
import {
  fetchConversations,
  mapConversationToCallRecord,
} from "@/lib/api-client"
import type { CallRecord, Conversation } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"

function getTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || value.trim().length === 0) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getConversationActivityTimestamp(conversation: Conversation): number {
  const candidates = [
    getTimestamp(conversation.metadata?.vapi_runtime_seen_at),
    getTimestamp(conversation.last_message_at),
    getTimestamp(conversation.metadata?.vapi_last_status_at),
    getTimestamp(conversation.started_at),
  ].filter((value): value is number => value !== null)

  return candidates.length > 0 ? Math.max(...candidates) : 0
}

function getRealtimeStatusCopy(connectionState: ReturnType<typeof useLiveCallsFeed>["connectionState"]): string {
  switch (connectionState) {
    case "connecting":
      return "Connecting to the realtime live-call feed."
    case "reconnecting":
      return "Realtime feed reconnecting. Existing live cards will stay on screen."
    case "error":
      return "Realtime feed hit a problem. We will keep retrying automatically."
    default:
      return "Live phone calls update here in realtime."
  }
}

export function HistoryPanel() {
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const { sessions: liveSessions, connectionState, error: liveError } = useLiveCallsFeed()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadCalls = React.useCallback(async () => {
    try {
      const nextConversations = await fetchConversations()
      const visibleConversations = nextConversations.filter((conversation) => conversation.channel === "voice")

      React.startTransition(() => {
        setConversations(visibleConversations)
      })
    } catch (err) {
      console.error("Failed to load calls:", err)
    }
  }, [currentOrgId])

  React.useEffect(() => {
    let isActive = true

    React.startTransition(() => {
      setLoading(true)
      setConversations([])
    })

    const initialize = async () => {
      try {
        await loadCalls()
      } catch (err) {
        console.error("Failed to initialize calls view:", err)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void initialize()

    return () => {
      isActive = false
    }
  }, [currentOrgId, loadCalls])

  React.useEffect(() => {
    if (loading) return

    const intervalId = window.setInterval(() => {
      void loadCalls()
    }, 8_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadCalls, loading])

  const sortedConversations = React.useMemo(
    () => [...conversations].sort(
      (left, right) => getConversationActivityTimestamp(right) - getConversationActivityTimestamp(left)
    ),
    [conversations]
  )

  const calls = React.useMemo(
    () => sortedConversations.map((conversation) => mapConversationToCallRecord(conversation)),
    [sortedConversations]
  )

  const liveConversationIds = React.useMemo(
    () => new Set(
      liveSessions
        .map((session) => session.conversationId)
        .filter((conversationId): conversationId is string => Boolean(conversationId))
    ),
    [liveSessions]
  )

  const historyCalls = React.useMemo(
    () => calls.filter((call) => !liveConversationIds.has(call.id)),
    [calls, liveConversationIds]
  )

  const liveConversationKey = React.useMemo(
    () => liveSessions.map((session) => session.conversationId ?? session.callId).join(":"),
    [liveSessions]
  )

  React.useEffect(() => {
    if (loading) return
    void loadCalls()
  }, [liveConversationKey, loadCalls, loading])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading calls...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
          <p className="mt-1 text-muted-foreground">
            Live phone calls on top, past phone calls underneath.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{liveSessions.length} live now</Badge>
          <Badge variant="outline">{historyCalls.length} in history</Badge>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Live</h2>
            <p className="text-sm text-muted-foreground">
              {getRealtimeStatusCopy(connectionState)}
            </p>
            {liveError ? (
              <p className="mt-1 text-sm text-rose-500">{liveError}</p>
            ) : null}
          </div>

          {connectionState !== "open" ? (
            <Badge variant="outline" className="w-fit capitalize">
              {connectionState === "error" ? "stream issue" : connectionState}
            </Badge>
          ) : null}
        </div>

        {liveSessions.length === 0 ? (
          <div className="overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(45,50,58,0.2)_0%,rgba(20,20,20,0)_34%),linear-gradient(180deg,#1a1a1b_0%,#141414_100%)] p-8 text-white shadow-[0_30px_70px_-42px_rgba(0,0,0,0.92)]">
            <div className="max-w-md">
              <p className="text-lg font-semibold tracking-tight">No live calls right now.</p>
              <p className="mt-2 text-sm text-white/56">
                New calls will appear here automatically with live transcript turns, waveform motion, and action highlights.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {liveSessions.map((session) => (
              <LiveCallCard
                key={session.conversationId ?? session.callId ?? session.id}
                session={session}
              />
            ))}
          </div>
        )}
      </section>

      <CallHistoryTable
        calls={historyCalls}
        title="Call History"
        emptyStateText="No past calls yet."
        defaultDatePreset="last30"
        showAgent
        layout="table"
      />
    </div>
  )
}

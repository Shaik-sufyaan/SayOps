"use client"

import React from "react"
import { IconPhoneCall } from "@tabler/icons-react"
import { formatDistanceToNowStrict } from "date-fns"

import { CallTranscript } from "@/components/call-transcript"
import { CallHistoryTable } from "@/components/call-history-table"
import {
  fetchConversations,
  fetchLiveConversations,
  fetchMessages,
  mapConversationToCallRecord,
} from "@/lib/api-client"
import type { CallRecord, Conversation, Message } from "@/lib/types"
import { useOrgStore } from "@/stores/orgStore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const TERMINAL_VAPI_STATUSES = new Set(["ended", "completed", "failed", "canceled"])
const LIVE_SIGNAL_PATTERN = [12, 20, 14, 24, 11, 22, 15, 26]

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "Just now"
  return formatDistanceToNowStrict(new Date(dateString), { addSuffix: true })
}

function getChannelLabel(call: CallRecord): string {
  return call.channel === "voice" ? "Phone" : "Web Chat"
}

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

function getConversationLiveStatusLabel(conversation: Conversation): string | null {
  const rawStatus = typeof conversation.metadata?.vapi_status === "string"
    ? conversation.metadata.vapi_status.trim().toLowerCase()
    : ""

  if (!rawStatus || TERMINAL_VAPI_STATUSES.has(rawStatus)) return null
  return rawStatus.replace(/[-_]+/g, " ")
}

function LiveSignalPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
      <div className="flex h-5 items-end gap-1">
        {LIVE_SIGNAL_PATTERN.map((height, index) => (
          <span
            key={`${index}-${height}`}
            className="block w-[3px] rounded-full bg-emerald-400 animate-[landing-waveform_0.7s_ease-in-out_infinite_alternate]"
            style={{
              height: `${height}px`,
              animationDelay: `${index * 0.06}s`,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function HistoryPanel() {
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [liveConversations, setLiveConversations] = React.useState<Conversation[]>([])
  const [liveMessagesById, setLiveMessagesById] = React.useState<Record<string, Message[]>>({})
  const [liveMessagesLoading, setLiveMessagesLoading] = React.useState<Record<string, boolean>>({})
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

  const loadLiveCalls = React.useCallback(async () => {
    try {
      const nextLiveConversations = await fetchLiveConversations()
      React.startTransition(() => {
        setLiveConversations(nextLiveConversations)
      })
    } catch (err) {
      console.error("Failed to load live calls:", err)
    }
  }, [currentOrgId])

  React.useEffect(() => {
    let isActive = true

    React.startTransition(() => {
      setLoading(true)
      setConversations([])
      setLiveConversations([])
      setLiveMessagesById({})
      setLiveMessagesLoading({})
    })

    const initialize = async () => {
      try {
        await Promise.all([
          loadCalls(),
          loadLiveCalls(),
        ])
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
  }, [currentOrgId, loadCalls, loadLiveCalls])

  React.useEffect(() => {
    if (loading) return

    const intervalId = window.setInterval(() => {
      void loadCalls()
    }, 8000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadCalls, loading])

  React.useEffect(() => {
    if (loading) return

    const intervalId = window.setInterval(() => {
      void loadLiveCalls()
    }, 2000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadLiveCalls, loading])

  const sortedConversations = React.useMemo(
    () => [...conversations].sort(
      (left, right) => getConversationActivityTimestamp(right) - getConversationActivityTimestamp(left)
    ),
    [conversations]
  )

  const liveCallIds = React.useMemo(
    () => new Set(liveConversations.map((conversation) => conversation.id)),
    [liveConversations]
  )

  const liveConversationById = React.useMemo(
    () => new Map(liveConversations.map((conversation) => [conversation.id, conversation])),
    [liveConversations]
  )

  const calls = React.useMemo(
    () => sortedConversations.map((conversation) => mapConversationToCallRecord(conversation)),
    [sortedConversations]
  )

  const presentCalls = React.useMemo(
    () => liveConversations.map((conversation) => mapConversationToCallRecord(conversation)),
    [liveConversations]
  )

  const historyConversationIds = React.useMemo(
    () => new Set(
      sortedConversations
        .filter((conversation) => !liveCallIds.has(conversation.id))
        .map((conversation) => conversation.id)
    ),
    [liveCallIds, sortedConversations]
  )

  const historyCalls = React.useMemo(
    () => calls.filter((call) => historyConversationIds.has(call.id)),
    [calls, historyConversationIds]
  )

  const liveConversationKey = React.useMemo(
    () => liveConversations.map((conversation) => conversation.id).join(":"),
    [liveConversations]
  )

  React.useEffect(() => {
    if (loading) return
    void loadCalls()
  }, [liveConversationKey, loadCalls, loading])

  const loadLiveTranscripts = React.useCallback(async () => {
    if (liveConversations.length === 0) {
      React.startTransition(() => {
        setLiveMessagesById({})
        setLiveMessagesLoading({})
      })
      return
    }

    const liveIds = new Set(liveConversations.map((conversation) => conversation.id))

    setLiveMessagesLoading((current) => {
      const next: Record<string, boolean> = {}
      liveConversations.forEach((conversation) => {
        next[conversation.id] = current[conversation.id] ?? true
      })
      return next
    })

    const results = await Promise.allSettled(
      liveConversations.map(async (conversation) => ({
        conversationId: conversation.id,
        messages: await fetchMessages(conversation.id),
      }))
    )

    React.startTransition(() => {
      setLiveMessagesById((current) => {
        const nextEntries = Object.entries(current).filter(([conversationId]) => liveIds.has(conversationId))
        const next = Object.fromEntries(nextEntries) as Record<string, Message[]>

        results.forEach((result) => {
          if (result.status !== "fulfilled") return
          next[result.value.conversationId] = result.value.messages
        })

        return next
      })

      setLiveMessagesLoading((current) => {
        const nextEntries = Object.entries(current).filter(([conversationId]) => liveIds.has(conversationId))
        const next = Object.fromEntries(nextEntries) as Record<string, boolean>

        liveConversations.forEach((conversation) => {
          next[conversation.id] = false
        })

        return next
      })
    })
  }, [liveConversations])

  React.useEffect(() => {
    void loadLiveTranscripts()

    if (liveConversations.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadLiveTranscripts()
    }, 4000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [liveConversationKey, loadLiveTranscripts, liveConversations.length])

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
          <Badge variant="secondary">{presentCalls.length} live now</Badge>
          <Badge variant="outline">{historyCalls.length} in history</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Present</CardTitle>
          <CardDescription>
            Live phone calls only. Each active call keeps its own transcript panel here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {presentCalls.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No live phone calls right now.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {presentCalls.map((call) => {
                const conversation = liveConversationById.get(call.id)
                const liveStatusLabel = conversation ? getConversationLiveStatusLabel(conversation) : null
                const messages = liveMessagesById[call.id] ?? []
                const lastActivity = (typeof conversation?.metadata?.vapi_runtime_seen_at === "string"
                  ? conversation.metadata.vapi_runtime_seen_at
                  : null)
                  ?? conversation?.last_message_at
                  ?? (typeof conversation?.metadata?.vapi_last_status_at === "string"
                    ? conversation.metadata.vapi_last_status_at
                    : null)
                  ?? call.timestamp

                return (
                  <Card key={call.id} className="border-border/80 bg-card/70">
                    <CardHeader className="gap-3 pb-3">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <IconPhoneCall className="size-5" />
                            </span>
                            <div className="min-w-0">
                              <CardTitle className="truncate text-lg">{call.agent_name || "Agent"}</CardTitle>
                              <CardDescription className="truncate">{call.caller_phone}</CardDescription>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <Badge>Live</Badge>
                          <Badge variant="outline">{getChannelLabel(call)}</Badge>
                          <LiveSignalPill label={liveStatusLabel ?? "connected"} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Started {formatRelativeDate(call.timestamp)}</span>
                        <span>Last activity {formatRelativeDate(lastActivity)}</span>
                        <span>{messages.length > 0 ? "Transcript live" : "Waiting for transcript"}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      <div className="rounded-xl border bg-background/70 p-4">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">Live transcript</p>
                            <p className="text-xs text-muted-foreground">
                              Updates automatically while the call is still active.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/assistant?ref=${call.id}`
                            }}
                          >
                            Inspect call
                          </Button>
                        </div>

                        <CallTranscript
                          messages={messages}
                          loading={Boolean(liveMessagesLoading[call.id])}
                          emptyText="Waiting for live transcript..."
                          className="max-h-[360px]"
                          followLatest
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CallHistoryTable
        calls={historyCalls}
        title="Call History"
        emptyStateText="No past calls yet."
        defaultDatePreset="last30"
        showAgent
      />
    </div>
  )
}

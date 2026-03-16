"use client"

import React from "react"
import {
  IconActivity,
  IconClock,
  IconPhone,
  IconPhoneCall,
} from "@tabler/icons-react"
import { formatDistanceToNowStrict } from "date-fns"

import { CallTranscript } from "@/components/call-transcript"
import { CallHistoryTable } from "@/components/call-history-table"
import {
  fetchAgents,
  fetchConversations,
  fetchMessages,
  mapConversationToCallRecord,
} from "@/lib/api-client"
import type { CallRecord, Conversation, Message } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const LIVE_CALL_STALE_MS = 90 * 1000
const TERMINAL_VAPI_STATUSES = new Set(["ended", "completed", "failed", "canceled"])

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

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

function isLiveVoiceConversation(conversation: Conversation, now = Date.now()): boolean {
  if (conversation.channel !== "voice") return false
  if (conversation.status === "completed" || conversation.status === "archived") return false
  if (typeof conversation.metadata?.vapi_end_of_call_report_at === "string") return false

  const vapiStatus = typeof conversation.metadata?.vapi_status === "string"
    ? conversation.metadata.vapi_status.trim().toLowerCase()
    : ""

  if (vapiStatus && TERMINAL_VAPI_STATUSES.has(vapiStatus)) return false

  return getConversationActivityTimestamp(conversation) >= now - LIVE_CALL_STALE_MS
}

export function HistoryPanel() {
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [agentNameById, setAgentNameById] = React.useState<Map<string, string>>(new Map())
  const [liveMessagesById, setLiveMessagesById] = React.useState<Record<string, Message[]>>({})
  const [liveMessagesLoading, setLiveMessagesLoading] = React.useState<Record<string, boolean>>({})
  const [loading, setLoading] = React.useState(true)

  const loadCalls = React.useCallback(async () => {
    try {
      const [agents, nextConversations] = await Promise.all([
        fetchAgents(),
        fetchConversations(),
      ])

      const nextAgentNameById = new Map(agents.map((agent) => [agent.id, agent.name]))
      const visibleConversations = nextConversations.filter((conversation) => conversation.channel === "voice")

      React.startTransition(() => {
        setAgentNameById(nextAgentNameById)
        setConversations(visibleConversations)
      })
    } catch (err) {
      console.error("Failed to load calls:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCalls()

    const intervalId = window.setInterval(() => {
      void loadCalls()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadCalls])

  const sortedConversations = React.useMemo(
    () => [...conversations].sort(
      (left, right) => getConversationActivityTimestamp(right) - getConversationActivityTimestamp(left)
    ),
    [conversations]
  )

  const liveConversations = React.useMemo(
    () => sortedConversations.filter((conversation) => isLiveVoiceConversation(conversation)),
    [sortedConversations]
  )

  const liveCallIds = React.useMemo(
    () => new Set(liveConversations.map((conversation) => conversation.id)),
    [liveConversations]
  )

  const calls = React.useMemo(
    () => sortedConversations.map((conversation) => (
      mapConversationToCallRecord(conversation, agentNameById.get(conversation.agent_id))
    )),
    [agentNameById, sortedConversations]
  )

  const presentCalls = React.useMemo(
    () => liveConversations.map((conversation) => (
      mapConversationToCallRecord(conversation, agentNameById.get(conversation.agent_id))
    )),
    [agentNameById, liveConversations]
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

  const todayCalls = React.useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return calls.filter((call) => new Date(call.timestamp) >= startOfToday)
  }, [calls])

  const voiceToday = todayCalls.filter((call) => call.channel === "voice").length
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IconActivity className="size-4" />}
          title="Present"
          value={String(presentCalls.length)}
          description="Only live phone calls with fresh activity."
        />
        <StatCard
          icon={<IconClock className="size-4" />}
          title="Today"
          value={String(todayCalls.length)}
          description="Phone calls started today."
        />
        <StatCard
          icon={<IconPhone className="size-4" />}
          title="Phone"
          value={String(voiceToday)}
          description="Voice conversations started today."
        />
        <StatCard
          icon={<IconClock className="size-4" />}
          title="Past"
          value={String(historyCalls.length)}
          description="Phone calls that are no longer live."
        />
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
              {presentCalls.map((call, index) => {
                const conversation = liveConversations[index]
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
                    <CardHeader className="gap-4">
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

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Badge>Live</Badge>
                          <Badge variant="outline">{getChannelLabel(call)}</Badge>
                          {liveStatusLabel ? <Badge variant="secondary">{liveStatusLabel}</Badge> : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Started {formatRelativeDate(call.timestamp)}</span>
                        <span>Last activity {formatRelativeDate(lastActivity)}</span>
                        <span>{messages.length > 0 ? "Transcript live" : "Waiting for transcript"}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
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
        title="History"
        description="Past phone calls across all agents."
        emptyStateText="No past calls yet."
        defaultDatePreset="last30"
        showAgent
      />
    </div>
  )
}

"use client"

import * as React from "react"
import {
  IconCalendarEvent,
  IconChevronDown,
  IconFilter,
  IconMessage,
  IconPhone,
  IconPlayerPlay,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { format } from "date-fns"

import { fetchMessages, fetchRecordingUrl } from "@/lib/api-client"
import type { CallRecord, Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CallTranscript } from "@/components/call-transcript"
import { cn } from "@/lib/utils"

type DatePreset = "today" | "yesterday" | "last7" | "last30"
type CallHistoryLayout = "cards" | "table"

type StatusTone = {
  label: string
  badgeClassName: string
  accentClassName: string
}

function dayKey(date: Date): string {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate.toISOString().slice(0, 10)
}

function deriveStatusTone(summary: string): StatusTone {
  const lower = summary.toLowerCase()

  if (lower.includes("booked") || lower.includes("appointment") || lower.includes("scheduled")) {
    return {
      label: "Booked Appointment",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
      accentClassName: "bg-emerald-400",
    }
  }

  if (lower.includes("purchase") || lower.includes("bought") || lower.includes("order") || lower.includes("sale")) {
    return {
      label: "Sale",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
      accentClassName: "bg-emerald-400",
    }
  }

  if (lower.includes("resolved") || lower.includes("fixed") || lower.includes("solved")) {
    return {
      label: "Resolved",
      badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300",
      accentClassName: "bg-emerald-400",
    }
  }

  if (lower.includes("follow up") || lower.includes("follow-up") || lower.includes("callback")) {
    return {
      label: "Follow Up",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
      accentClassName: "bg-amber-400",
    }
  }

  if (lower.includes("voicemail") || lower.includes("no answer") || lower.includes("missed")) {
    return {
      label: "Missed",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
      accentClassName: "bg-rose-400",
    }
  }

  if (lower.includes("transfer") || lower.includes("escalat")) {
    return {
      label: "Transferred",
      badgeClassName: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/60 dark:text-violet-300",
      accentClassName: "bg-violet-400",
    }
  }

  if (
    lower.includes("pricing") ||
    lower.includes("quote") ||
    lower.includes("cost") ||
    lower.includes("price") ||
    lower.includes("question") ||
    lower.includes("asked") ||
    lower.includes("inquir") ||
    lower.includes("information")
  ) {
    return {
      label: "Inquiry",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300",
      accentClassName: "bg-sky-400",
    }
  }

  if (lower.includes("complaint") || lower.includes("unhappy") || lower.includes("dissatisfied")) {
    return {
      label: "Complaint",
      badgeClassName: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300",
      accentClassName: "bg-rose-400",
    }
  }

  if (lower.includes("support") || lower.includes("help") || lower.includes("assist")) {
    return {
      label: "Support",
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300",
      accentClassName: "bg-sky-400",
    }
  }

  return {
    label: "Conversation",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    accentClassName: "bg-slate-300 dark:bg-slate-700",
  }
}

function useCallDetails(call: CallRecord) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(call.recording_url ?? null)
  const [loading, setLoading] = React.useState(false)
  const [recordingUnavailable, setRecordingUnavailable] = React.useState(false)

  React.useEffect(() => {
    setRecordingUrl(call.recording_url ?? null)
    setRecordingUnavailable(false)
    setMessages([])
    setIsOpen(false)
  }, [call.id, call.recording_url])

  const ensureLoaded = React.useCallback(async () => {
    if (messages.length > 0 && (call.channel !== "voice" || recordingUrl || recordingUnavailable)) {
      return
    }

    setLoading(true)
    try {
      const [nextMessages, nextRecordingUrl] = await Promise.all([
        messages.length === 0 ? fetchMessages(call.id) : Promise.resolve(messages),
        call.channel === "voice" && !recordingUrl && !recordingUnavailable
          ? fetchRecordingUrl(call.id).catch(() => null)
          : Promise.resolve(recordingUrl),
      ])

      setMessages(nextMessages)
      if (call.channel === "voice") {
        setRecordingUrl(nextRecordingUrl)
        setRecordingUnavailable(!nextRecordingUrl)
      }
    } catch (err) {
      console.error("Failed to fetch call details:", err)
    } finally {
      setLoading(false)
    }
  }, [call.channel, call.id, messages, recordingUnavailable, recordingUrl])

  const toggleOpen = React.useCallback(async () => {
    if (!isOpen) {
      await ensureLoaded()
    }
    setIsOpen((current) => !current)
  }, [ensureLoaded, isOpen])

  return {
    isOpen,
    messages,
    recordingUrl,
    recordingUnavailable,
    loading,
    toggleOpen,
  }
}

function CallDetailsContent({
  call,
  messages,
  recordingUrl,
  recordingUnavailable,
  loading,
}: {
  call: CallRecord
  messages: Message[]
  recordingUrl: string | null
  recordingUnavailable: boolean
  loading: boolean
}) {
  return (
    <div className="space-y-5">
      {call.channel === "voice" && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <IconPlayerPlay className="size-4" />
            Call Recording
          </h4>
          {recordingUrl ? (
            <div className="rounded-lg border bg-background p-3">
              <audio controls src={recordingUrl} className="h-8 w-full" />
            </div>
          ) : recordingUnavailable ? (
            <p className="text-xs text-muted-foreground">Recording unavailable for this call.</p>
          ) : loading ? (
            <p className="animate-pulse text-xs text-muted-foreground">Loading recording...</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Summary</h4>
        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm leading-relaxed text-foreground">{call.summary}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Transcript</h4>
        <div className="rounded-lg border bg-background p-3">
          <CallTranscript messages={messages} loading={loading} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            window.location.href = `/assistant?ref=${call.id}`
          }}
        >
          Consult Business Assistant about this call
        </Button>
      </div>
    </div>
  )
}

function CallCard({
  call,
  showAgent,
}: {
  call: CallRecord
  showAgent: boolean
}) {
  const { isOpen, messages, recordingUrl, recordingUnavailable, loading, toggleOpen } = useCallDetails(call)
  const timestamp = new Date(call.timestamp)
  const status = React.useMemo(() => deriveStatusTone(call.summary), [call.summary])

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            {format(timestamp, "MMM d")} - {format(timestamp, "h:mm a")}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                status.badgeClassName
              )}
            >
              <span className="inline-block size-1.5 rounded-full bg-current" />
              {status.label}
            </span>
            <IconChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {call.channel === "voice" ? (
            <IconPhone className="size-3.5" />
          ) : (
            <IconMessage className="size-3.5" />
          )}
          {showAgent && (
            <span className="font-medium text-foreground">{call.agent_name || "Agent"}</span>
          )}
          <span>{call.caller_phone || "Web User"}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {call.summary}
        </p>
      </button>

      {isOpen && (
        <div className="border-t bg-muted/20 px-5 py-5">
          <CallDetailsContent
            call={call}
            messages={messages}
            recordingUrl={recordingUrl}
            recordingUnavailable={recordingUnavailable}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}

function CallTableRow({
  call,
  showAgent,
  columnCount,
}: {
  call: CallRecord
  showAgent: boolean
  columnCount: number
}) {
  const { isOpen, messages, recordingUrl, recordingUnavailable, loading, toggleOpen } = useCallDetails(call)
  const timestamp = new Date(call.timestamp)
  const status = React.useMemo(() => deriveStatusTone(call.summary), [call.summary])

  return (
    <>
      <TableRow
        className="group cursor-pointer border-border/60 bg-background/90 hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
        onClick={() => void toggleOpen()}
      >
        <TableCell className="w-2 p-0">
          <div className={cn("h-[96px] w-1 rounded-r-full", status.accentClassName)} />
        </TableCell>
        <TableCell className="py-5 pr-4">
          <div className="font-semibold text-foreground">{format(timestamp, "MMMM d")}</div>
        </TableCell>
        <TableCell className="py-5 pr-4 text-muted-foreground">
          {format(timestamp, "h:mm a")}
        </TableCell>
        {showAgent && (
          <TableCell className="py-5 pr-4">
            <div className="max-w-[11rem] text-sm font-medium leading-5 text-foreground">
              {call.agent_name || "Agent"}
            </div>
          </TableCell>
        )}
        <TableCell className="py-5 pr-4">
          <div className="max-w-[10rem] break-words text-sm leading-5 text-muted-foreground">
            {call.caller_phone || "Web User"}
          </div>
        </TableCell>
        <TableCell className="py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-xl border px-2.5 py-1 text-xs font-medium",
                  status.badgeClassName
                )}
              >
                {status.label}
              </span>
              <p className="line-clamp-2 max-w-[22rem] text-sm leading-6 text-muted-foreground">
                {call.summary}
              </p>
            </div>
            <IconChevronDown
              className={cn(
                "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount} className="bg-muted/30 px-6 py-6">
            <CallDetailsContent
              call={call}
              messages={messages}
              recordingUrl={recordingUrl}
              recordingUnavailable={recordingUnavailable}
              loading={loading}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function TableSummaryFooter({
  totalCalls,
  bookedAppointments,
}: {
  totalCalls: number
  bookedAppointments: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-border/60 bg-slate-50/70 px-4 py-4 text-sm text-muted-foreground dark:bg-slate-950/40">
      <span>{totalCalls} Total Calls</span>
      <span className="hidden h-4 w-px bg-border sm:block" />
      <span>{bookedAppointments} Appointments Booked</span>
    </div>
  )
}

export function CallHistoryTable({
  calls,
  title = "Call History",
  description,
  emptyStateText = "No history for this filter yet.",
  defaultDatePreset = "last7",
  showAgent = true,
  layout = "cards",
}: {
  calls: CallRecord[]
  title?: string
  description?: string
  emptyStateText?: string
  defaultDatePreset?: DatePreset
  showAgent?: boolean
  layout?: CallHistoryLayout
}) {
  const [viewFilter, setViewFilter] = React.useState<"all" | "voice" | "web">("all")
  const [datePreset, setDatePreset] = React.useState<DatePreset>(defaultDatePreset)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    setDatePreset(defaultDatePreset)
  }, [defaultDatePreset])

  const dateFilteredCalls = React.useMemo(() => {
    const now = new Date()
    const startOfDay = (date: Date) => {
      const nextDate = new Date(date)
      nextDate.setHours(0, 0, 0, 0)
      return nextDate
    }
    const today = startOfDay(now)
    const yesterday = startOfDay(new Date(now.getTime() - 86400_000))

    return calls.filter((call) => {
      const timestamp = new Date(call.timestamp)
      if (datePreset === "today") return dayKey(timestamp) === dayKey(today)
      if (datePreset === "yesterday") return dayKey(timestamp) === dayKey(yesterday)
      if (datePreset === "last7") return timestamp >= new Date(now.getTime() - 7 * 86400_000)
      if (datePreset === "last30") return timestamp >= new Date(now.getTime() - 30 * 86400_000)
      return true
    })
  }, [calls, datePreset])

  const channelFilteredCalls = React.useMemo(() => {
    if (viewFilter === "all") return dateFilteredCalls
    if (viewFilter === "voice") return dateFilteredCalls.filter((call) => call.channel === "voice")
    return dateFilteredCalls.filter((call) => call.channel === "web")
  }, [dateFilteredCalls, viewFilter])

  const filteredCalls = React.useMemo(() => {
    if (!searchQuery.trim()) return channelFilteredCalls
    const q = searchQuery.toLowerCase()
    return channelFilteredCalls.filter(
      (call) =>
        call.summary?.toLowerCase().includes(q) ||
        call.caller_phone?.toLowerCase().includes(q) ||
        call.agent_name?.toLowerCase().includes(q)
    )
  }, [channelFilteredCalls, searchQuery])

  const counts = React.useMemo(() => {
    const voice = dateFilteredCalls.filter((call) => call.channel === "voice").length
    const web = dateFilteredCalls.filter((call) => call.channel === "web").length
    const recordings = dateFilteredCalls.filter((call) => call.channel === "voice" && call.has_recording).length
    return { all: dateFilteredCalls.length, voice, web, recordings }
  }, [dateFilteredCalls])

  const footerStats = React.useMemo(() => {
    const bookedAppointments = filteredCalls.filter(
      (call) => deriveStatusTone(call.summary).label === "Booked Appointment"
    ).length
    return {
      totalCalls: filteredCalls.length,
      bookedAppointments,
    }
  }, [filteredCalls])

  const presets: { key: DatePreset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "last7", label: "Last 7 days" },
    { key: "last30", label: "Last 30 days" },
  ]

  const presetLabel = presets.find((preset) => preset.key === datePreset)?.label ?? "Last 30 days"
  const useTableLayout = layout === "table"
  const columnCount = showAgent ? 6 : 5

  return (
    <Card className={cn(useTableLayout && "overflow-hidden border-border/60 bg-background/95 shadow-sm")}>
      <CardHeader className={cn("space-y-4", useTableLayout ? "pb-4" : "pb-0")}>
        <div>
          <CardTitle className={cn(useTableLayout ? "text-[1.75rem]" : "text-xl")}>{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{presetLabel}</p>
          {!useTableLayout && description ? (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div
          className={cn(
            "text-sm text-muted-foreground",
            useTableLayout && "rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
          )}
        >
          <span className="font-semibold text-foreground">{counts.voice}</span> Calls
          <span className="mx-1.5">·</span>
          <span className="font-semibold text-foreground">{counts.web}</span> Chats
          <span className="mx-1.5">·</span>
          <span className="font-semibold text-foreground">
            {counts.recordings > 0 && counts.voice > 0
              ? `${Math.round((counts.recordings / counts.voice) * 100)}%`
              : "0%"}
          </span> Recorded
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-border/60 bg-muted/30 p-1">
            {[
              { key: "all", label: "All" },
              { key: "voice", label: "Calls" },
              { key: "web", label: "Chats" },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setViewFilter(filter.key as "all" | "voice" | "web")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  viewFilter === filter.key
                    ? "bg-slate-600 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className={cn(
                  "h-10 rounded-xl border-border/60 bg-background pl-9 pr-9 text-sm",
                  useTableLayout && "shadow-sm"
                )}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="relative">
              <div className="pointer-events-none flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-background px-4 text-sm font-medium text-foreground shadow-sm">
                {useTableLayout ? <IconCalendarEvent className="size-4 text-muted-foreground" /> : <IconFilter className="size-4 text-muted-foreground" />}
                <span>Filter</span>
              </div>
              <select
                value={datePreset}
                onChange={(event) => setDatePreset(event.target.value as DatePreset)}
                className="absolute inset-0 cursor-pointer appearance-none opacity-0"
                aria-label="Filter call history by date range"
              >
                {presets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn(useTableLayout ? "px-0 pt-0" : "px-0 pt-4")}>
        {filteredCalls.length === 0 ? (
          <p className="px-5 py-12 text-center text-muted-foreground">{emptyStateText}</p>
        ) : useTableLayout ? (
          <div className="space-y-0">
            <div className="md:hidden">
              <div className="divide-y">
                {filteredCalls.map((call) => (
                  <CallCard key={call.id} call={call} showAgent={showAgent} />
                ))}
              </div>
              <TableSummaryFooter
                totalCalls={footerStats.totalCalls}
                bookedAppointments={footerStats.bookedAppointments}
              />
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-y border-border/60 bg-muted/20 hover:bg-muted/20">
                    <TableHead className="w-2 p-0" />
                    <TableHead className="h-12 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                      Date
                    </TableHead>
                    <TableHead className="h-12 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                      Time
                    </TableHead>
                    {showAgent ? (
                      <TableHead className="h-12 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                        Agent
                      </TableHead>
                    ) : null}
                    <TableHead className="h-12 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                      Caller
                    </TableHead>
                    <TableHead className="h-12 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
                      Summary
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <CallTableRow
                      key={call.id}
                      call={call}
                      showAgent={showAgent}
                      columnCount={columnCount}
                    />
                  ))}
                </TableBody>
              </Table>

              <TableSummaryFooter
                totalCalls={footerStats.totalCalls}
                bookedAppointments={footerStats.bookedAppointments}
              />
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCalls.map((call) => (
              <CallCard key={call.id} call={call} showAgent={showAgent} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

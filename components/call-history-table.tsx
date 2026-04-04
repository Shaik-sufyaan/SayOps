"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconFilter,
  IconPhone,
  IconMessage,
  IconSearch,
  IconPlayerPlay,
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
import { CallTranscript } from "@/components/call-transcript"
import { cn } from "@/lib/utils"

type DatePreset = "today" | "yesterday" | "last7" | "last30"

function formatDuration(seconds?: number): string {
  const total = Number(seconds ?? 0)
  if (!Number.isFinite(total) || total <= 0) return "-"
  const mins = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  if (mins <= 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

function dayKey(date: Date): string {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate.toISOString().slice(0, 10)
}

/** Derive a short status label from the call summary text */
function deriveStatusLabel(summary: string): { label: string; color: string } {
  const lower = summary.toLowerCase()

  if (lower.includes("booked") || lower.includes("appointment") || lower.includes("scheduled"))
    return { label: "Booked Appointment", color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800" }
  if (lower.includes("purchase") || lower.includes("bought") || lower.includes("order") || lower.includes("sale"))
    return { label: "Sale", color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800" }
  if (lower.includes("resolved") || lower.includes("fixed") || lower.includes("solved"))
    return { label: "Resolved", color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800" }
  if (lower.includes("follow up") || lower.includes("follow-up") || lower.includes("callback"))
    return { label: "Follow Up", color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800" }
  if (lower.includes("voicemail") || lower.includes("no answer") || lower.includes("missed"))
    return { label: "Missed", color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" }
  if (lower.includes("transfer") || lower.includes("escalat"))
    return { label: "Transferred", color: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950 dark:border-violet-800" }
  if (lower.includes("pricing") || lower.includes("quote") || lower.includes("cost") || lower.includes("price"))
    return { label: "Inquiry", color: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800" }
  if (lower.includes("question") || lower.includes("asked") || lower.includes("inquir") || lower.includes("information"))
    return { label: "Inquiry", color: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800" }
  if (lower.includes("complaint") || lower.includes("unhappy") || lower.includes("dissatisfied"))
    return { label: "Complaint", color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" }
  if (lower.includes("support") || lower.includes("help") || lower.includes("assist"))
    return { label: "Support", color: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800" }

  return { label: "Conversation", color: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900 dark:border-slate-700" }
}

function CallCard({
  call,
  showAgent,
}: {
  call: CallRecord
  showAgent: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(call.recording_url ?? null)
  const [loading, setLoading] = React.useState(false)
  const [recordingUnavailable, setRecordingUnavailable] = React.useState(false)
  const timestamp = new Date(call.timestamp)
  const status = React.useMemo(() => deriveStatusLabel(call.summary), [call.summary])

  React.useEffect(() => {
    setRecordingUrl(call.recording_url ?? null)
    setRecordingUnavailable(false)
  }, [call.id, call.recording_url])

  const toggleOpen = async () => {
    if (!isOpen && (messages.length === 0 || (call.channel === "voice" && !recordingUrl))) {
      setLoading(true)
      try {
        const [nextMessages, nextRecordingUrl] = await Promise.all([
          messages.length === 0 ? fetchMessages(call.id) : Promise.resolve(messages),
          call.channel === "voice" && !recordingUrl
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
    }

    setIsOpen((current) => !current)
  }

  return (
    <div className="border-b last:border-b-0">
      {/* Card header — clickable */}
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        {/* Top row: date/time + status badge */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            {format(timestamp, "MMM d")} - {format(timestamp, "h:mm a")}
          </span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              status.color
            )}>
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

        {/* Agent + caller row */}
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

        {/* Duration + summary */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Duration: {formatDuration(call.duration_seconds)}
          </span>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {call.summary}
          </p>
        </div>
      </button>

      {/* Expanded detail */}
      {isOpen && (
        <div className="border-t bg-muted/20 px-5 py-5">
          <div className="space-y-5">
            {/* Recording */}
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

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Summary</h4>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-sm leading-relaxed text-foreground">{call.summary}</p>
              </div>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Transcript</h4>
              <div className="rounded-lg border bg-background p-3">
                <CallTranscript messages={messages} loading={loading} />
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/assistant?ref=${call.id}`
                }}
              >
                Consult Business Assistant about this call
              </Button>
            </div>
          </div>
        </div>
      )}
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
}: {
  calls: CallRecord[]
  title?: string
  description?: string
  emptyStateText?: string
  defaultDatePreset?: DatePreset
  showAgent?: boolean
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

  const presets: { key: DatePreset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "last7", label: "Last 7 days" },
    { key: "last30", label: "Last 30 days" },
  ]

  const presetLabel = presets.find((p) => p.key === datePreset)?.label ?? "Last 30 days"

  return (
    <Card>
      <CardHeader className="space-y-4 pb-0">
        {/* Title + date range */}
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">{presetLabel}</p>
        </div>

        {/* Stats bar */}
        <div className="text-sm text-muted-foreground">
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

        {/* Filter tabs + search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Pill tabs */}
          <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setViewFilter("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewFilter === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewFilter("voice")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewFilter === "voice"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Calls
            </button>
            <button
              type="button"
              onClick={() => setViewFilter("web")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewFilter === "web"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Chats
            </button>
          </div>

          {/* Search + date filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48 sm:flex-none">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </div>
            {/* Date preset dropdown styled as a button with icon */}
            <div className="relative">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                className="h-8 appearance-none rounded-md border bg-background px-3 pr-8 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                {presets.map((preset) => (
                  <option key={preset.key} value={preset.key}>{preset.label}</option>
                ))}
              </select>
              <IconFilter className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 pt-4">
        {filteredCalls.length === 0 ? (
          <p className="px-5 py-12 text-center text-muted-foreground">{emptyStateText}</p>
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

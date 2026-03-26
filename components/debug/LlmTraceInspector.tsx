"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JsonTreePanel, type JsonTreeMatcherInput } from "@/components/debug/JsonTreeView"
import {
  getInputJsonDefaultPaths,
  getOutputJsonDefaultPaths,
  getTraceSegmentClassName,
  getTraceSegmentMetaLabel,
} from "@/lib/llm-trace-inspector"
import type { LlmTraceDebugSession, LlmTraceSegment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { IconInfoCircle, IconLoader2, IconRefresh } from "@tabler/icons-react"

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatCount(value: number | null): string {
  return value == null ? "n/a" : String(value)
}

function formatMetric(value: number | null, suffix = ""): string {
  return value == null ? "n/a" : `${value}${suffix}`
}

function getTraceBadgeVariant(status: string): "secondary" | "destructive" {
  return status === "success" || status === "retried_success" ? "secondary" : "destructive"
}

const selectableCardBaseClass = "w-full rounded-2xl border p-3 text-left transition-colors"
const selectableCardActiveClass = "border-primary/40 bg-primary/10 text-foreground shadow-sm"
const selectableCardInactiveClass = "border-border bg-background hover:border-foreground/30 hover:bg-muted/30"
const selectableSubtextActiveClass = "text-foreground/80"
const selectableMetaActiveClass = "text-foreground/70"

function getSelectableCardClass(active: boolean): string {
  return cn(
    selectableCardBaseClass,
    active ? selectableCardActiveClass : selectableCardInactiveClass
  )
}

function getSelectableSubtextClass(active: boolean): string {
  return active ? selectableSubtextActiveClass : "text-muted-foreground"
}

function getSelectableMetaClass(active: boolean): string {
  return active ? selectableMetaActiveClass : "text-muted-foreground"
}

function buildPathMatcher(paths: Set<string>) {
  return (input: JsonTreeMatcherInput) => paths.has(input.path)
}

function TraceNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
      <div className="mb-2 flex items-center gap-2 font-medium text-foreground/80">
        <IconInfoCircle className="size-4" />
        Inspector notes
      </div>
      <div className="space-y-2">
        {notes.map((note, index) => (
          <p key={`${index}-${note}`}>{note}</p>
        ))}
      </div>
    </div>
  )
}

function TraceTextView({
  title,
  text,
  wrapText,
}: {
  title: string
  text: string | null
  wrapText: boolean
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-background/70">
      <div className="border-b border-border px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <pre
          className={cn(
            "font-mono text-xs leading-6 text-foreground",
            wrapText ? "whitespace-pre-wrap break-words" : "whitespace-pre"
          )}
        >
          {text?.trim() || "(empty)"}
        </pre>
      </div>
    </div>
  )
}

function TraceSegmentCard({
  segment,
  wrapText,
}: {
  segment: LlmTraceSegment
  wrapText: boolean
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", getTraceSegmentClassName(segment))}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">{segment.label}</div>
        <Badge variant="outline" className="capitalize">
          {getTraceSegmentMetaLabel(segment)}
        </Badge>
      </div>
      <pre
        className={cn(
          "font-mono text-xs leading-6 text-foreground",
          wrapText ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre"
        )}
      >
        {segment.text}
      </pre>
    </div>
  )
}

function TraceSegmentView({
  segments,
  wrapText,
}: {
  segments: LlmTraceSegment[]
  wrapText: boolean
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="space-y-3 px-1 py-1">
        {segments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            No normalized prompt segments were available for this trace.
          </div>
        ) : (
          segments.map((segment) => (
            <TraceSegmentCard key={segment.id} segment={segment} wrapText={wrapText} />
          ))
        )}
      </div>
    </div>
  )
}

function ParsedResultView({
  parsedText,
  parsedToolCalls,
  wrapText,
}: {
  parsedText: string | null
  parsedToolCalls: unknown
  wrapText: boolean
}) {
  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
      <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-background/70">
        <div className="border-b border-border px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Text</div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          <pre
            className={cn(
              "font-mono text-xs leading-6 text-foreground",
              wrapText ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}
          >
            {parsedText?.trim() || "(empty)"}
          </pre>
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-background/70">
        <div className="border-b border-border px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tool Calls</div>
        </div>
        <div className="min-h-0 flex-1 p-3">
          <JsonTreePanel
            title="Tool Calls"
            value={parsedToolCalls ?? []}
            wrapText={wrapText}
            defaultOpenMatcher={buildPathMatcher(new Set(["root"]))}
            className="h-full rounded-xl border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  )
}

function JsonView({
  title,
  value,
  wrapText,
  defaultOpenMatcher,
}: {
  title: string
  value: unknown
  wrapText: boolean
  defaultOpenMatcher: (input: JsonTreeMatcherInput) => boolean
}) {
  return (
    <JsonTreePanel
      title={title}
      value={value}
      wrapText={wrapText}
      defaultOpenMatcher={defaultOpenMatcher}
      className="h-full rounded-2xl"
    />
  )
}

export interface LlmTraceInspectorProps {
  session: LlmTraceDebugSession | null
  selectedTraceId: string | null
  onSelectTraceId?: (traceId: string) => void
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  refreshDisabled?: boolean
  className?: string
  emptyTitle?: string
  emptyDescription?: string
}

export function LlmTraceInspector({
  session,
  selectedTraceId,
  onSelectTraceId,
  loading = false,
  error = null,
  onRefresh,
  refreshDisabled = false,
  className,
  emptyTitle = "No trace selected",
  emptyDescription = "Select a traceable assistant turn to inspect its raw model input and output.",
}: LlmTraceInspectorProps) {
  const [wrapText, setWrapText] = React.useState(true)

  const selectedTrace = React.useMemo(() => {
    if (!session || session.traces.length === 0) return null
    return (
      session.traces.find((trace) => trace.id === selectedTraceId) ??
      session.traces[session.traces.length - 1]
    )
  }, [selectedTraceId, session])

  const inputJsonMatcher = React.useMemo(() => {
    return buildPathMatcher(getInputJsonDefaultPaths(selectedTrace?.requestPayload ?? null))
  }, [selectedTrace?.requestPayload])

  const outputJsonMatcher = React.useMemo(() => {
    return buildPathMatcher(getOutputJsonDefaultPaths(selectedTrace?.responsePayload ?? null))
  }, [selectedTrace?.responsePayload])

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4 lg:flex-row", className)}>
      <aside className="flex max-h-[280px] w-full shrink-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm lg:max-h-none lg:w-[240px]">
        <div className="space-y-2 border-b px-5 py-4">
          <h2 className="text-sm font-semibold">LLM Calls</h2>
          <p className="text-xs text-muted-foreground">Select the exact provider invocation you want to inspect.</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {!session && !loading ? (
              <div className="rounded-2xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                {emptyDescription}
              </div>
            ) : null}

            {session?.traces.map((trace, index) => {
              const active = trace.id === selectedTrace?.id
              return (
                <button
                  key={trace.id}
                  type="button"
                  onClick={() => onSelectTraceId?.(trace.id)}
                  className={getSelectableCardClass(active)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Call {index + 1}</div>
                      <div className={cn("mt-1 font-mono text-[11px]", getSelectableSubtextClass(active))}>
                        {trace.modelId}
                      </div>
                    </div>
                    <Badge variant={getTraceBadgeVariant(trace.status)}>{trace.status}</Badge>
                  </div>
                  <div className={cn("mt-3 flex flex-wrap gap-2 text-[11px]", getSelectableMetaClass(active))}>
                    <span>attempt {trace.attempt}</span>
                    <span>{trace.latencyMs} ms</span>
                    <span>{formatDate(trace.startedAt)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Session Metadata
              </h2>
              <div className="font-mono text-xs text-foreground/80">execution: {session?.executionId ?? "n/a"}</div>
              <div className="font-mono text-xs text-foreground/80">conversation: {session?.conversationId ?? "n/a"}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant={wrapText ? "default" : "outline"} size="sm" onClick={() => setWrapText((current) => !current)}>
                {wrapText ? "Wrap on" : "Wrap off"}
              </Button>
              {onRefresh ? (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshDisabled || loading}>
                  {loading ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconRefresh className="mr-2 size-4" />
                  )}
                  Refresh
                </Button>
              ) : null}
            </div>
          </div>

          <Separator className="my-4" />

          {selectedTrace ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{selectedTrace.provider}</Badge>
                <Badge variant="outline">{selectedTrace.modelId}</Badge>
                <Badge variant="secondary">attempt {selectedTrace.attempt}</Badge>
                <Badge variant="secondary">{selectedTrace.latencyMs} ms</Badge>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-border bg-muted/15 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tokens</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>prompt: {formatCount(selectedTrace.promptTokens)}</div>
                    <div>completion: {formatCount(selectedTrace.completionTokens)}</div>
                    <div>total: {formatCount(selectedTrace.totalTokens)}</div>
                    <div>thoughts: {formatCount(selectedTrace.thoughtsTokenCount)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/15 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt Cache</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>mode: {selectedTrace.cacheMode ?? "n/a"}</div>
                    <div>cached tokens: {formatCount(selectedTrace.cachedPromptTokens)}</div>
                    <div>retention: {selectedTrace.promptCacheRetention ?? "n/a"}</div>
                    <div className="break-all text-xs text-muted-foreground">key: {selectedTrace.cacheKey ?? "n/a"}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/15 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Event Loop</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>p95 delay: {formatMetric(selectedTrace.eventLoopDelayP95Ms, " ms")}</div>
                    <div>max delay: {formatMetric(selectedTrace.eventLoopDelayMaxMs, " ms")}</div>
                    <div>utilization: {formatMetric(selectedTrace.eventLoopUtilization)}</div>
                  </div>
                </div>
              </div>

              {selectedTrace.phaseTimingsJson ? (
                <div className="rounded-2xl border border-border bg-muted/15 p-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">Phase Timings</div>
                  <div className="h-[240px]">
                    <JsonTreePanel
                      title="Phase Timings"
                      value={selectedTrace.phaseTimingsJson}
                      wrapText={wrapText}
                      defaultOpenMatcher={buildPathMatcher(new Set(["root"]))}
                      className="h-full rounded-xl border-0 shadow-none"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              {loading ? "Loading raw traces..." : emptyTitle}
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-rows-2">
          {selectedTrace ? (
            <>
              <Tabs defaultValue="readable-input" className="flex min-h-0 flex-col rounded-xl border bg-background shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Input</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Readable prompt by default, raw provider JSON on demand.</p>
                  </div>
                  <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl bg-muted/35 p-1">
                    <TabsTrigger value="readable-input">Readable Prompt</TabsTrigger>
                    <TabsTrigger value="segmented-input">Segmented Prompt</TabsTrigger>
                    <TabsTrigger value="json-input">Provider JSON</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="readable-input" className="mt-0 flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <TraceNotes notes={selectedTrace.normalized.normalizationNotes} />
                  <TraceTextView title="Readable Prompt" text={selectedTrace.normalized.inputTextFull} wrapText={wrapText} />
                </TabsContent>

                <TabsContent value="segmented-input" className="mt-0 flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <TraceNotes notes={selectedTrace.normalized.normalizationNotes} />
                  <TraceSegmentView segments={selectedTrace.normalized.segments} wrapText={wrapText} />
                </TabsContent>

                <TabsContent value="json-input" className="mt-0 flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <TraceNotes notes={selectedTrace.normalized.normalizationNotes} />
                  <div className="min-h-0 flex-1">
                    <JsonView
                      title="Raw Input"
                      value={selectedTrace.requestPayload}
                      wrapText={wrapText}
                      defaultOpenMatcher={inputJsonMatcher}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Tabs defaultValue="readable-output" className="flex min-h-0 flex-col rounded-xl border bg-background shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Output</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Read the response first, then drop into parsed or raw payload views if needed.</p>
                  </div>
                  <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl bg-muted/35 p-1">
                    <TabsTrigger value="readable-output">Readable Output</TabsTrigger>
                    <TabsTrigger value="parsed-output">Parsed Result</TabsTrigger>
                    <TabsTrigger value="json-output">Provider JSON</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="readable-output" className="mt-0 flex min-h-0 flex-1 flex-col p-4">
                  <TraceTextView title="Readable Output" text={selectedTrace.normalized.outputTextFull} wrapText={wrapText} />
                </TabsContent>

                <TabsContent value="parsed-output" className="mt-0 flex min-h-0 flex-1 flex-col p-4">
                  <ParsedResultView
                    parsedText={selectedTrace.parsedText}
                    parsedToolCalls={selectedTrace.parsedToolCalls}
                    wrapText={wrapText}
                  />
                </TabsContent>

                <TabsContent value="json-output" className="mt-0 flex min-h-0 flex-1 flex-col p-4">
                  <JsonView
                    title="Raw Output"
                    value={selectedTrace.responsePayload}
                    wrapText={wrapText}
                    defaultOpenMatcher={outputJsonMatcher}
                  />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
              {loading ? "Loading raw traces..." : emptyDescription}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

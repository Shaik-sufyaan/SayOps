"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { JsonTreePanel, containsSystemInstruction, type JsonTreeMatcherInput } from "@/components/debug/JsonTreeView"
import type { LlmTraceDebugSession } from "@/lib/types"
import { cn } from "@/lib/utils"
import { IconLoader2, IconRefresh } from "@tabler/icons-react"

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatCount(value: number | null): string {
  return value == null ? "n/a" : String(value)
}

function getTraceBadgeVariant(status: string): "secondary" | "destructive" {
  return status === "success" || status === "retried_success" ? "secondary" : "destructive"
}

const defaultRootOpenMatcher = (input: JsonTreeMatcherInput) => input.path === "root"
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
  const [wrapText, setWrapText] = React.useState(false)

  const selectedTrace = React.useMemo(() => {
    if (!session || session.traces.length === 0) return null
    return (
      session.traces.find((trace) => trace.id === selectedTraceId) ??
      session.traces[session.traces.length - 1]
    )
  }, [selectedTraceId, session])

  const rawInputDefaultOpenMatcher = React.useCallback((input: JsonTreeMatcherInput) => {
    if (input.path === "root") return true
    if (input.label === "systemInstruction") return true
    return containsSystemInstruction(input.value)
  }, [])

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

              <div className="grid gap-4 xl:grid-cols-4">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Tokens</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>prompt: {formatCount(selectedTrace.promptTokens)}</div>
                    <div>completion: {formatCount(selectedTrace.completionTokens)}</div>
                    <div>total: {formatCount(selectedTrace.totalTokens)}</div>
                    <div>thoughts: {formatCount(selectedTrace.thoughtsTokenCount)}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/30 p-4 xl:col-span-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Parsed Result</div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border bg-background p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Text</div>
                      <div
                        className={cn(
                          "mt-2 font-mono text-xs leading-6 text-foreground",
                          wrapText ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre"
                        )}
                      >
                        {selectedTrace.parsedText?.trim() || "(empty)"}
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Tool Calls
                      </div>
                      <div className="mt-2 max-h-40 overflow-auto rounded-lg border">
                        <JsonTreePanel
                          title="Tool Calls"
                          value={selectedTrace.parsedToolCalls ?? []}
                          wrapText={wrapText}
                          defaultOpenMatcher={defaultRootOpenMatcher}
                          className="rounded-lg border-0 shadow-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              {loading ? "Loading raw traces..." : emptyTitle}
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-rows-2">
          {selectedTrace ? (
            <>
              <JsonTreePanel
                title="Raw Input"
                value={selectedTrace.requestPayload}
                wrapText={wrapText}
                defaultOpenMatcher={rawInputDefaultOpenMatcher}
              />
              <JsonTreePanel
                title="Raw Output"
                value={selectedTrace.responsePayload}
                wrapText={wrapText}
                defaultOpenMatcher={defaultRootOpenMatcher}
              />
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

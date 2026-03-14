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
      <aside className="flex max-h-[280px] w-full shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:max-h-none lg:w-[240px]">
        <div className="space-y-2 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold">LLM Calls</h2>
          <p className="text-xs text-slate-500">Select the exact provider invocation you want to inspect.</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {!session && !loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
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
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition-colors",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Call {index + 1}</div>
                      <div className={cn("mt-1 font-mono text-[11px]", active ? "text-slate-200" : "text-slate-500")}>
                        {trace.modelId}
                      </div>
                    </div>
                    <Badge variant={getTraceBadgeVariant(trace.status)}>{trace.status}</Badge>
                  </div>
                  <div className={cn("mt-3 flex flex-wrap gap-2 text-[11px]", active ? "text-slate-300" : "text-slate-500")}>
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
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Session Metadata
              </h2>
              <div className="font-mono text-xs text-slate-700">execution: {session?.executionId ?? "n/a"}</div>
              <div className="font-mono text-xs text-slate-700">conversation: {session?.conversationId ?? "n/a"}</div>
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
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Tokens</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div>prompt: {formatCount(selectedTrace.promptTokens)}</div>
                    <div>completion: {formatCount(selectedTrace.completionTokens)}</div>
                    <div>total: {formatCount(selectedTrace.totalTokens)}</div>
                    <div>thoughts: {formatCount(selectedTrace.thoughtsTokenCount)}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 xl:col-span-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Parsed Result</div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Text</div>
                      <div
                        className={cn(
                          "mt-2 font-mono text-xs leading-6 text-slate-800",
                          wrapText ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre"
                        )}
                      >
                        {selectedTrace.parsedText?.trim() || "(empty)"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Tool Calls
                      </div>
                      <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200">
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
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
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              {loading ? "Loading raw traces..." : emptyDescription}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

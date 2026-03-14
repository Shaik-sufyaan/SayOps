"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { fetchLlmTraceSession } from "@/lib/api-client"
import {
  isAgentTraceInspectorEnabled,
  readStoredAgentTraceEvent,
  subscribeAgentTraceEvents,
  type AgentTraceInspectorEvent,
} from "@/lib/agent-trace-debug"
import type { LlmTraceDebugSession } from "@/lib/types"
import { LlmTraceInspector } from "@/components/debug/LlmTraceInspector"

function updateSessionQuery(sessionId: string | null): void {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (sessionId) {
    url.searchParams.set("session", sessionId)
  } else {
    url.searchParams.delete("session")
  }
  window.history.replaceState({}, "", url.toString())
}

export default function AgentTraceDebugPage() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [session, setSession] = React.useState<LlmTraceDebugSession | null>(null)
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sourceLabel, setSourceLabel] = React.useState<string | null>(null)
  const lastEventRef = React.useRef<number>(0)

  const loadSession = React.useCallback(async (nextSessionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchLlmTraceSession(nextSessionId)
      setSessionId(data.sessionId)
      setSession(data)
      setSelectedTraceId(data.traces[data.traces.length - 1]?.id ?? null)
      updateSessionQuery(data.sessionId)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch raw LLM traces"
      setSessionId(nextSessionId)
      setSession(null)
      setSelectedTraceId(null)
      setError(message)
      updateSessionQuery(nextSessionId)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTraceEvent = React.useCallback(
    (event: AgentTraceInspectorEvent) => {
      if ((event.issuedAt ?? 0) <= lastEventRef.current) return
      lastEventRef.current = event.issuedAt ?? Date.now()

      if (event.type === "session") {
        setSourceLabel(event.label ?? null)
        void loadSession(event.sessionId)
        return
      }

      setError(event.message)
    },
    [loadSession]
  )

  React.useEffect(() => {
    setHasMounted(true)

    const initialSessionId = new URLSearchParams(window.location.search).get("session")
    if (initialSessionId) {
      void loadSession(initialSessionId)
      return
    }

    const storedEvent = readStoredAgentTraceEvent()
    if (storedEvent) {
      handleTraceEvent(storedEvent)
    }
  }, [handleTraceEvent, loadSession])

  React.useEffect(() => subscribeAgentTraceEvents(handleTraceEvent), [handleTraceEvent])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1900px] items-center justify-between gap-4 px-6 py-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Raw LLM Inspector
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-sm text-foreground/80">
                {sessionId ?? "Waiting for an agent session"}
              </h1>
              {sourceLabel ? <Badge variant="outline">{sourceLabel}</Badge> : null}
              <Badge variant={hasMounted && isAgentTraceInspectorEnabled() ? "secondary" : "outline"}>
                {hasMounted && isAgentTraceInspectorEnabled() ? "localhost enabled" : "waiting for client"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1900px] flex-1 px-6 py-6">
        <LlmTraceInspector
          session={session}
          selectedTraceId={selectedTraceId}
          onSelectTraceId={setSelectedTraceId}
          loading={loading}
          error={error}
          onRefresh={() => sessionId && void loadSession(sessionId)}
          refreshDisabled={!sessionId}
          className="flex-1"
          emptyTitle="Waiting for a session to inspect."
          emptyDescription="Send a message through SpeakOps on localhost. This tab will follow the latest agent session automatically."
        />
      </main>
    </div>
  )
}

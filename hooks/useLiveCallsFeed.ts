"use client"

import * as React from "react"

import {
  fetchBootstrapLiveSessions,
  streamLiveCalls,
} from "@/lib/live-call-client"
import type {
  LiveCallEvent,
  LiveCallsConnectionState,
  LiveCallSession,
} from "@/lib/live-call-types"
import {
  getLiveCallSessionKey,
  isTerminalLiveCallStatus,
  sortLiveCallSessions,
} from "@/lib/live-call-types"
import { useOrgStore } from "@/stores/orgStore"

const RECONNECT_DELAY_MS = 2_500

function upsertLiveSession(current: LiveCallSession[], session: LiveCallSession): LiveCallSession[] {
  const key = getLiveCallSessionKey(session)
  const next = new Map(current.map((entry) => [getLiveCallSessionKey(entry), entry]))

  if (isTerminalLiveCallStatus(session.status)) {
    next.delete(key)
    return sortLiveCallSessions([...next.values()])
  }

  next.set(key, session)
  return sortLiveCallSessions([...next.values()])
}

function mergeBootstrapSessions(current: LiveCallSession[], bootstrap: LiveCallSession[]): LiveCallSession[] {
  if (bootstrap.length === 0) return current

  const next = new Map(current.map((entry) => [getLiveCallSessionKey(entry), entry]))
  bootstrap.forEach((session) => {
    const key = getLiveCallSessionKey(session)
    if (!next.has(key)) {
      next.set(key, session)
    }
  })

  return sortLiveCallSessions([...next.values()])
}

function applyLiveCallEvent(current: LiveCallSession[], event: LiveCallEvent): LiveCallSession[] {
  switch (event.type) {
    case "snapshot": {
      if (event.sessions.length === 0) return current
      const next = new Map(current.map((entry) => [getLiveCallSessionKey(entry), entry]))
      event.sessions.forEach((session) => {
        next.set(getLiveCallSessionKey(session), session)
      })
      return sortLiveCallSessions(
        [...next.values()].filter((session) => !isTerminalLiveCallStatus(session.status))
      )
    }
    case "call-ended":
      return current.filter((session) => getLiveCallSessionKey(session) !== getLiveCallSessionKey(event.session))
    default:
      return upsertLiveSession(current, event.session)
  }
}

export function useLiveCallsFeed(): {
  sessions: LiveCallSession[]
  connectionState: LiveCallsConnectionState
  error: string | null
} {
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const [sessions, setSessions] = React.useState<LiveCallSession[]>([])
  const [connectionState, setConnectionState] = React.useState<LiveCallsConnectionState>("connecting")
  const [error, setError] = React.useState<string | null>(null)

  const applyEvent = React.useEffectEvent((event: LiveCallEvent) => {
    React.startTransition(() => {
      setSessions((current) => applyLiveCallEvent(current, event))
      setError(null)
    })
  })

  React.useEffect(() => {
    if (!currentOrgId) {
      setSessions([])
      setConnectionState("connecting")
      setError(null)
      return
    }

    let disposed = false
    let reconnectTimer: number | undefined
    let activeController: AbortController | null = null

    const bootstrap = async () => {
      try {
        const initialSessions = await fetchBootstrapLiveSessions()
        if (disposed) return

        React.startTransition(() => {
          setSessions((current) => mergeBootstrapSessions(current, initialSessions))
        })
      } catch (streamError) {
        if (disposed) return
        console.error("Failed to bootstrap live calls:", streamError)
      }
    }

    const connect = async (mode: LiveCallsConnectionState) => {
      if (disposed) return

      setConnectionState(mode)
      activeController = new AbortController()

      try {
        await streamLiveCalls({
          signal: activeController.signal,
          onOpen: () => {
            if (disposed) return
            setConnectionState("open")
            setError(null)
          },
          onEvent: applyEvent,
        })

        if (!disposed && !activeController.signal.aborted) {
          setConnectionState("reconnecting")
          reconnectTimer = window.setTimeout(() => {
            void connect("reconnecting")
          }, RECONNECT_DELAY_MS)
        }
      } catch (streamError) {
        if (disposed || activeController.signal.aborted) return

        const message = streamError instanceof Error ? streamError.message : "Live call stream disconnected."
        console.error("Live call stream error:", streamError)
        setConnectionState("error")
        setError(message)

        reconnectTimer = window.setTimeout(() => {
          void connect("reconnecting")
        }, RECONNECT_DELAY_MS)
      }
    }

    void bootstrap()
    void connect("connecting")

    return () => {
      disposed = true
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
      activeController?.abort()
    }
  }, [applyEvent, currentOrgId])

  return { sessions, connectionState, error }
}

export function useLiveCallSession(sessionId?: string): {
  session: LiveCallSession | null
  connectionState: LiveCallsConnectionState
  error: string | null
} {
  const { sessions, connectionState, error } = useLiveCallsFeed()

  const session = React.useMemo(() => {
    if (!sessionId) return null

    return sessions.find((entry) => (
      entry.id === sessionId ||
      entry.callId === sessionId ||
      entry.conversationId === sessionId
    )) ?? null
  }, [sessionId, sessions])

  return { session, connectionState, error }
}

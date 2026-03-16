export const AGENT_TRACE_DEBUG_PATH = "/debug/agent-traces"

export type AgentTraceInspectorEvent =
  | {
      type: "session"
      sessionId: string
      label?: string
      issuedAt: number
    }
  | {
      type: "error"
      message: string
      issuedAt: number
    }

export function isAgentTraceInspectorEnabled(): boolean {
  return false
}

export function ensureAgentTraceInspectorWindow(): Window | null {
  return null
}

export function publishAgentTraceSession(sessionId: string, label?: string): void {
  void sessionId
  void label
}

export function publishAgentTraceError(message: string): void {
  void message
}

export function subscribeAgentTraceEvents(
  handler: (event: AgentTraceInspectorEvent) => void
): () => void {
  void handler
  return () => {}
}

export function readStoredAgentTraceEvent(): AgentTraceInspectorEvent | null {
  return null
}

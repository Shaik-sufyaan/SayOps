"use client"

import { AgentSettingsForm } from "@/components/agent/AgentSettingsForm"
import type { Agent } from "@/lib/types"

export function AgentSettings({ agent }: { agent: Agent }) {
  return <AgentSettingsForm agent={agent} />
}

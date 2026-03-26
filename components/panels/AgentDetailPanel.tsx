"use client"

import * as React from "react"
import { fetchAgent } from "@/lib/api-client"
import { AssignExistingNumberDialog } from "@/components/agent/AssignExistingNumberDialog"
import { AgentSettingsForm } from "@/components/agent/AgentSettingsForm"
import { TestModeSimulator } from "@/components/agent/TestModeSimulator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconPhone } from "@tabler/icons-react"
import { useViewParams } from "@/hooks/useViewParams"
import { useAgentsStore } from "@/stores"
import { Agent } from "@/lib/types"
import { CallForwardingGuide } from "@/components/CallForwardingGuide"

interface AgentDetailPanelProps {
  agentId: string | null
}

export function AgentDetailPanel({ agentId }: AgentDetailPanelProps) {
  const { setView } = useViewParams()
  const { updateAgent: updateAgentInStore } = useAgentsStore()
  const [agent, setAgent] = React.useState<Agent | null>(null)
  const [loading, setLoading] = React.useState(true)

  const handleAssignedNumber = (updatedAgent: Agent) => {
    setAgent(updatedAgent)
    updateAgentInStore(updatedAgent.id, updatedAgent)
  }

  React.useEffect(() => {
    if (!agentId) return

    setLoading(true)
    fetchAgent(agentId)
      .then((data) => setAgent(data))
      .catch((err) => {
        console.error("Failed to fetch agent:", err)
        setView("calls")
      })
      .finally(() => setLoading(false))
  }, [agentId, setView])

  if (!agentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">No agent selected.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Agent not found.</p>
        <button onClick={() => setView("calls")}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{agent.name}</h2>
          <p className="text-muted-foreground">
            Manage agent settings and test interactions.
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 pt-1">
          <div className="flex items-center gap-2">
            {agent.phone_number ? (
              <Badge variant="outline" className="gap-1.5 text-sm px-3 py-1">
                <IconPhone className="size-3.5" />
                {agent.phone_number}
              </Badge>
            ) : agent.number_requested_at ? (
              <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
                <IconPhone className="size-3.5" />
                Number Pending
              </Badge>
            ) : null}

            <AssignExistingNumberDialog
              agentId={agent.id}
              agentName={agent.name}
              currentPhoneNumber={agent.phone_number}
              onAssigned={handleAssignedNumber}
              buttonLabel={agent.phone_number ? "Replace Legacy Number" : "Attach Legacy Number"}
              buttonSize="sm"
            />

            {!agent.phone_number ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("settings")}
              >
                <IconPhone className="mr-2 size-4" />
                Manage Messaging Line
              </Button>
            ) : null}
          </div>
          {agent.phone_number ? (
            <CallForwardingGuide phoneNumber={agent.phone_number} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Customer texting now routes through your organization messaging line in Settings.
            </p>
          )}
        </div>
      </div>
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="space-y-4">
          <AgentSettingsForm agent={agent} />
        </TabsContent>
        <TabsContent value="test" className="space-y-4">
          <TestModeSimulator agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

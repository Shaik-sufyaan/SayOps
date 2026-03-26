"use client"

import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { IconBrandGoogle, IconPlug, IconMail, IconCreditCard, IconLoader2 } from "@tabler/icons-react"
import type { AgentConnectorAvailability, AgentConnectorId } from "@/lib/types"

export const AVAILABLE_CONNECTORS = [
  {
    id: "google_calendar" as const,
    name: "Google Calendar",
    description: "Manage events and scheduling",
    icon: IconBrandGoogle,
    color: "text-blue-500",
  },
  {
    id: "gmail" as const,
    name: "Gmail",
    description: "Read and send emails",
    icon: IconMail,
    color: "text-red-500",
  },
  {
    id: "hubspot" as const,
    name: "HubSpot",
    description: "Sync contacts and deals",
    icon: IconPlug,
    color: "text-orange-500",
  },
  {
    id: "stripe_payments" as const,
    name: "Stripe Payments",
    description: "Accept payments from customers",
    icon: IconCreditCard,
    color: "text-violet-500",
  },
]

interface ConnectorSelectorProps {
  selected: string[]
  availability: AgentConnectorAvailability[]
  onChange: (connectors: string[]) => void
  onRequestActivation: (connectorId: AgentConnectorId) => Promise<void> | void
}

export function ConnectorSelector({
  selected,
  availability,
  onChange,
  onRequestActivation,
}: ConnectorSelectorProps) {
  const [activatingId, setActivatingId] = React.useState<AgentConnectorId | null>(null)
  const availabilityById = new Map(availability.map((entry) => [entry.id, entry]))

  const toggleConnector = (connectorId: string) => {
    if (selected.includes(connectorId)) {
      onChange(selected.filter((id) => id !== connectorId))
    } else {
      onChange([...selected, connectorId])
    }
  }

  const handleUnavailableClick = async (connectorId: AgentConnectorId) => {
    setActivatingId(connectorId)
    try {
      await onRequestActivation(connectorId)
    } finally {
      setActivatingId(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 mt-2">
      {AVAILABLE_CONNECTORS.map((connector) => {
        const Icon = connector.icon
        const connectorAvailability = availabilityById.get(connector.id)
        const isConnected = connectorAvailability?.connected ?? false
        const canActivate = connectorAvailability?.canActivate ?? false
        const isSelected = isConnected && selected.includes(connector.id)
        const isActivating = activatingId === connector.id

        if (!isConnected) {
          return (
            <button
              key={connector.id}
              type="button"
              onClick={() => handleUnavailableClick(connector.id)}
              className="flex items-start space-x-3 rounded-lg border border-dashed bg-muted/40 p-4 text-left opacity-70 transition hover:opacity-100"
            >
              <div className="mt-1 flex size-4 items-center justify-center">
                {isActivating ? (
                  <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="size-2 rounded-full bg-muted-foreground/60" />
                )}
              </div>
              <div className="grid gap-1.5 leading-none">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className={`size-4 ${connector.color}`} />
                  {connector.name}
                </div>
                <p className="text-xs text-muted-foreground">
                  {connector.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {canActivate ? "Connect first to enable this tool." : "You need extra permissions to activate this integration."}
                </p>
              </div>
            </button>
          )
        }

        return (
          <div
            key={connector.id}
            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
              isSelected ? "bg-primary/5 border-primary" : "bg-card"
            }`}
          >
            <Checkbox
              id={`connector-${connector.id}`}
              checked={isSelected}
              onCheckedChange={() => toggleConnector(connector.id)}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor={`connector-${connector.id}`}
                className="flex items-center gap-2 text-sm font-semibold cursor-pointer"
              >
                <Icon className={`size-4 ${connector.color}`} />
                {connector.name}
              </Label>
              <p className="text-xs text-muted-foreground">
                {connector.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

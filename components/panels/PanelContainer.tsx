"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useViewParams } from "@/hooks/useViewParams"
import { useAgentsStore } from "@/stores"
import { Spinner } from "@/components/ui/spinner"
import { TermsAndConditionsModal } from "@/components/TermsAndConditionsModal"
import { DocumentsPanel } from "./DocumentsPanel"
import { HistoryPanel } from "./HistoryPanel"
import { IntegrationsPanel } from "./IntegrationsPanel"
import { AccountPanel } from "./AccountPanel"
import { NotificationsPanel } from "./NotificationsPanel"
import { AgentDetailPanel } from "./AgentDetailPanel"
import { CreateAgentPanel } from "./CreateAgentPanel"
import { BillingPanel } from "./PaymentsPanel"
import { SubscriptionPanel } from "./SubscriptionPanel"
import { TokenUsagePanel } from "./TokenUsagePanel"
import { AdminOrgsPanel } from "./AdminOrgsPanel"
import { AdminOrgDetailPanel } from "./AdminOrgDetailPanel"
import { PlatformHealthPanel } from "./PlatformHealthPanel"
import { CustomerDetailPanel } from "./CustomerDetailPanel"
import { CustomersPanel } from "./CustomersPanel"

function PanelContainerInner() {
  const { view, agentId, orgId, customerId, setView } = useViewParams()
  const { user, loading: authLoading, termsAccepted, isPlatformAdmin, canManageOrganization } = useAuth()
  const { agents, fetchAgents, setAgents } = useAgentsStore()
  const router = useRouter()
  const [visited, setVisited] = useState<Set<string>>(new Set(["calls"]))
  const [agentsChecked, setAgentsChecked] = useState(false)
  const canViewTokenUsage = canManageOrganization || isPlatformAdmin
  const effectiveView = view === "token-usage" && !canViewTokenUsage ? "calls" : view

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) {
      setAgents([])
      setAgentsChecked(false)
      return
    }

    setAgentsChecked(false)
    fetchAgents(true).finally(() => setAgentsChecked(true))
  }, [fetchAgents, setAgents, user])

  useEffect(() => {
    if (!user || !agentsChecked) return
    if ((effectiveView === "calls" || effectiveView === "customers" || effectiveView === "customer-detail") && agents.length === 0) {
      setView("create-agent")
    }
  }, [user, agentsChecked, effectiveView, agents.length, setView])

  useEffect(() => {
    if (view === "token-usage" && !canViewTokenUsage) {
      setView("calls")
    }
  }, [canViewTokenUsage, setView, view])

  useEffect(() => {
    const normalizedView = view === "settings" ? "account" : view
    const key = normalizedView === "agent"
      ? "agent"
      : normalizedView === "admin-org-detail"
        ? "admin-org-detail"
        : normalizedView === "customer-detail"
          ? "customer-detail"
        : normalizedView
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }, [view])

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (termsAccepted === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (termsAccepted === false) {
    return <TermsAndConditionsModal />
  }

  return (
    <>
      <Panel active={effectiveView === "documents"} visited={visited.has("documents")}>
        <DocumentsPanel />
      </Panel>
      <Panel active={effectiveView === "calls"} visited={visited.has("calls")}>
        <HistoryPanel key="calls" />
      </Panel>
      <Panel active={effectiveView === "customers"} visited={visited.has("customers")}>
        <CustomersPanel />
      </Panel>
      <Panel active={effectiveView === "integrations"} visited={visited.has("integrations")}>
        <IntegrationsPanel />
      </Panel>
      <Panel active={effectiveView === "account" || effectiveView === "settings"} visited={visited.has("account")}>
        <AccountPanel />
      </Panel>
      <Panel active={effectiveView === "notifications"} visited={visited.has("notifications")}>
        <NotificationsPanel />
      </Panel>
      <Panel active={effectiveView === "agent"} visited={visited.has("agent")}>
        {/* key={agentId} forces remount on agent switch — resets form state, tabs, etc. */}
        <AgentDetailPanel key={agentId} agentId={agentId} />
      </Panel>
      <Panel active={effectiveView === "create-agent"} visited={visited.has("create-agent")}>
        <CreateAgentPanel />
      </Panel>
      <Panel active={effectiveView === "billing"} visited={visited.has("billing")}>
        <SubscriptionPanel />
      </Panel>
      <Panel active={effectiveView === "payments"} visited={visited.has("payments")}>
        <BillingPanel />
      </Panel>
      {canViewTokenUsage && (
        <Panel active={effectiveView === "token-usage"} visited={visited.has("token-usage")}>
          <TokenUsagePanel />
        </Panel>
      )}
      <Panel active={effectiveView === "admin-orgs"} visited={visited.has("admin-orgs")}>
        <AdminOrgsPanel />
      </Panel>
      <Panel active={effectiveView === "admin-org-detail"} visited={visited.has("admin-org-detail")}>
        <AdminOrgDetailPanel orgId={orgId} />
      </Panel>
      <Panel active={effectiveView === "platform-health"} visited={visited.has("platform-health")}>
        <PlatformHealthPanel />
      </Panel>
      <Panel active={effectiveView === "customer-detail"} visited={visited.has("customer-detail")}>
        <CustomerDetailPanel customerId={customerId} />
      </Panel>
    </>
  )
}

function Panel({
  children,
  active,
  visited,
}: {
  children: React.ReactNode
  active: boolean
  visited: boolean
}) {
  if (!visited) return null
  return (
    <div className={active ? "flex flex-1 flex-col" : "hidden"}>
      {children}
    </div>
  )
}

export function PanelContainer() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PanelContainerInner />
    </Suspense>
  )
}

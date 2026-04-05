"use client"

import * as React from "react"
import {
  IconArrowLeft,
  IconCheck,
  IconClipboardCheck,
  IconClock,
  IconPhoneCall,
  IconRefresh,
  IconRosetteDiscountCheck,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  fetchCustomerDetail,
  runCustomerAction,
  updateCustomerOwnerState,
} from "@/lib/api-client"
import { useViewParams } from "@/hooks/useViewParams"
import { useOrgStore } from "@/stores/orgStore"
import type {
  CustomerDashboardEntry,
  CustomerDetail,
  CustomerEscalationItem,
  CustomerPaymentHistoryItem,
  CustomerTaskItem,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100)
}

function displayCustomerName(customer: CustomerDashboardEntry): string {
  return customer.name || customer.phone || customer.email || customer.externalId
}

function CustomerStateBadges({ customer }: { customer: CustomerDashboardEntry }) {
  return (
    <div className="flex flex-wrap gap-2">
      {customer.needsAttention ? <Badge variant="outline">Needs Attention</Badge> : null}
      {customer.manualStage === "follow_up_needed" ? <Badge variant="secondary">Follow Up</Badge> : null}
      {customer.manualStage === "request_closed" ? <Badge variant="secondary">Request Closed</Badge> : null}
      {customer.manualStage === "appointment_done" ? <Badge variant="secondary">Appointment Done</Badge> : null}
      {customer.decisionStatus === "approved" ? <Badge>Approved</Badge> : null}
      {customer.decisionStatus === "denied" ? <Badge variant="destructive">Denied</Badge> : null}
    </div>
  )
}

function canCloseTask(task: CustomerTaskItem) {
  return ["scheduled", "active", "paused", "handoff"].includes(task.status)
}

function canCloseEscalation(escalation: CustomerEscalationItem) {
  return escalation.status === "open" || escalation.status === "reminded"
}

function canCompleteAppointment(payment: CustomerPaymentHistoryItem) {
  return payment.fulfillmentType === "appointment"
    && (payment.fulfillmentStatus === "not_started" || payment.fulfillmentStatus === "in_progress")
}

export function CustomerDetailPanel({ customerId }: { customerId: string | null }) {
  const { setView, view } = useViewParams()
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const currentRole = useOrgStore((state) => state.currentRole())
  const canManageCustomers = currentRole === "owner" || currentRole === "admin"

  const [detail, setDetail] = React.useState<CustomerDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState("")
  const [savingNotes, setSavingNotes] = React.useState(false)
  const [actingKey, setActingKey] = React.useState<string | null>(null)

  const loadDetail = React.useCallback(async () => {
    if (!customerId || !currentOrgId || !canManageCustomers) return
    setLoading(true)
    setError(null)
    try {
      const next = await fetchCustomerDetail(customerId)
      setDetail(next)
      setNotes(next.ownerState.notes || "")
    } catch (err: any) {
      setError(err?.message || "Failed to load customer detail")
    } finally {
      setLoading(false)
    }
  }, [canManageCustomers, currentOrgId, customerId])

  React.useEffect(() => {
    if (view !== "customer-detail") return
    void loadDetail()
  }, [loadDetail, view])

  const handleAction = async (
    key: string,
    label: string,
    action: Parameters<typeof runCustomerAction>[1],
  ) => {
    if (!detail) return
    const confirmed = window.confirm(`${label} for ${displayCustomerName(detail.customer)}?`)
    if (!confirmed) return

    setActingKey(key)
    try {
      await runCustomerAction(detail.customer.id, action)
      toast.success(`${label} updated`)
      await loadDetail()
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${label.toLowerCase()}`)
    } finally {
      setActingKey(null)
    }
  }

  const handleSaveNotes = async () => {
    if (!detail) return
    setSavingNotes(true)
    try {
      await updateCustomerOwnerState(detail.customer.id, { notes })
      toast.success("Notes saved")
      await loadDetail()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }

  if (!canManageCustomers) {
    return null
  }

  if (!customerId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>No customer selected</CardTitle>
            <CardDescription>Pick a customer from Customer Data to inspect their history and workflow state.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setView("customers")}>
              <IconArrowLeft className="mr-2 size-4" />
              Back to Customer Data
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 lg:p-8">
        <Button variant="ghost" className="w-fit" onClick={() => setView("customers")}>
          <IconArrowLeft className="mr-2 size-4" />
          Back to Customer Data
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Customer detail unavailable</CardTitle>
            <CardDescription>{error || "This customer could not be loaded."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void loadDetail()}>
              <IconRefresh className="mr-2 size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setView("customers")}>
          <IconArrowLeft className="mr-2 size-4" />
          Customer Data
        </Button>
        <Button variant="outline" size="sm" onClick={() => void loadDetail()}>
          <IconRefresh className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-2xl">{displayCustomerName(detail.customer)}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>{detail.customer.phone || "No phone on file"}</span>
                <span>{detail.customer.email || detail.customer.externalId}</span>
                <span>{detail.customer.totalCalls} total calls</span>
                <span>Last call {formatDateTime(detail.customer.lastCallAt)}</span>
              </CardDescription>
            </div>
            <CustomerStateBadges customer={detail.customer} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pending Status</p>
              <p className="mt-2 text-sm font-medium">{detail.customer.pendingStatusSummary}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next Step</p>
              <p className="mt-2 text-sm font-medium">{detail.customer.nextStepSummary || "No pending step"}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Latest Summary</p>
              <p className="mt-2 text-sm font-medium">{detail.customer.lastCallSummary || "No call summary yet"}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Owner Workflow</CardTitle>
            <CardDescription>Notes and owner decisions stay separate from live operational records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={actingKey === "follow_up"}
                onClick={() => void handleAction("follow_up", "Follow up", { action: "follow_up" })}
              >
                {actingKey === "follow_up" ? <Spinner className="mr-2 size-4" /> : <IconClock className="mr-2 size-4" />}
                Follow Up
              </Button>
              <Button
                variant="outline"
                disabled={actingKey === "approve"}
                onClick={() => void handleAction("approve", "Approve", { action: "approve" })}
              >
                {actingKey === "approve" ? <Spinner className="mr-2 size-4" /> : <IconRosetteDiscountCheck className="mr-2 size-4" />}
                Approve
              </Button>
              <Button
                variant="outline"
                disabled={actingKey === "deny"}
                onClick={() => void handleAction("deny", "Deny", { action: "deny" })}
              >
                {actingKey === "deny" ? <Spinner className="mr-2 size-4" /> : <IconX className="mr-2 size-4" />}
                Deny
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Owner notes</p>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add private notes for this customer..."
                className="min-h-[140px]"
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleSaveNotes()} disabled={savingNotes}>
                  {savingNotes ? <Spinner className="mr-2 size-4" /> : null}
                  Save Notes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment & Appointment Snapshot</CardTitle>
            <CardDescription>Upcoming or in-progress appointments can be completed here when appropriate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.payments.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No payment or fulfillment history for this customer yet.
              </div>
            ) : (
              detail.payments.slice(0, 4).map((payment) => (
                <div key={payment.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{payment.description || "Payment"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(payment.amount, payment.currency)} • {payment.status}
                      </p>
                      <p className="text-xs text-muted-foreground">Created {formatDateTime(payment.createdAt)}</p>
                      {payment.appointmentTime ? (
                        <p className="mt-1 text-sm">Appointment {payment.appointmentTime}</p>
                      ) : null}
                    </div>
                    {canCompleteAppointment(payment) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingKey === `payment:${payment.id}`}
                        onClick={() => void handleAction(`payment:${payment.id}`, "Appointment done", {
                          action: "appointment_done",
                          paymentId: payment.id,
                        })}
                      >
                        {actingKey === `payment:${payment.id}` ? <Spinner className="mr-2 size-4" /> : <IconCheck className="mr-2 size-4" />}
                        Appointment Done
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open Tasks</CardTitle>
            <CardDescription>Conversation tasks tied to this customer across the organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No tasks found for this customer.
              </div>
            ) : (
              detail.tasks.map((task) => (
                <div key={task.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{task.summary || "Follow up task"}</p>
                      <p className="text-sm text-muted-foreground">{task.status} • Agent {task.agentId}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDateTime(task.updatedAt)}{task.dueAt ? ` • Due ${formatDateTime(task.dueAt)}` : ""}
                      </p>
                    </div>
                    {canCloseTask(task) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingKey === `task:${task.id}`}
                        onClick={() => void handleAction(`task:${task.id}`, "Request closed", {
                          action: "request_closed",
                          taskId: task.id,
                        })}
                      >
                        {actingKey === `task:${task.id}` ? <Spinner className="mr-2 size-4" /> : <IconClipboardCheck className="mr-2 size-4" />}
                        Request Closed
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escalations</CardTitle>
            <CardDescription>Human follow-up requests created from customer conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.escalations.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No escalations found for this customer.
              </div>
            ) : (
              detail.escalations.map((escalation) => (
                <div key={escalation.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{escalation.reason}</p>
                      <p className="text-sm text-muted-foreground">{escalation.customerSummary}</p>
                      <p className="text-xs text-muted-foreground">
                        {escalation.status} • Created {formatDateTime(escalation.createdAt)}
                      </p>
                    </div>
                    {canCloseEscalation(escalation) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingKey === `escalation:${escalation.id}`}
                        onClick={() => void handleAction(`escalation:${escalation.id}`, "Request closed", {
                          action: "request_closed",
                          escalationId: escalation.id,
                        })}
                      >
                        {actingKey === `escalation:${escalation.id}` ? <Spinner className="mr-2 size-4" /> : <IconClipboardCheck className="mr-2 size-4" />}
                        Request Closed
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previous Calls</CardTitle>
          <CardDescription>Recent conversations and summaries for this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No previous calls or chats for this customer yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agent</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channel</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.conversations.map((conversation) => (
                    <tr key={conversation.id} className="border-t align-top">
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(conversation.startedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{conversation.agentName}</div>
                        <div className="text-xs text-muted-foreground">{conversation.status}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{conversation.channel}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {conversation.durationSeconds > 0 ? `${conversation.durationSeconds}s` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[480px] space-y-1">
                          <p>{conversation.summary || "No summary available."}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {conversation.hasTranscript ? (
                              <span className="inline-flex items-center gap-1">
                                <IconPhoneCall className="size-3.5" />
                                Transcript
                              </span>
                            ) : null}
                            {conversation.hasRecording ? (
                              <span className="inline-flex items-center gap-1">
                                <IconPhoneCall className="size-3.5" />
                                Recording
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Fulfillment History</CardTitle>
          <CardDescription>All recorded payments, appointment fulfillments, and delivery states for this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.payments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No payment history for this customer yet.
            </div>
          ) : (
            <div className="space-y-3">
              {detail.payments.map((payment) => (
                <div key={`history-${payment.id}`} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.description || "Payment"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(payment.amount, payment.currency)} • {payment.status}
                      </p>
                      <p className="text-xs text-muted-foreground">Created {formatDateTime(payment.createdAt)}</p>
                      {payment.fulfillmentType ? (
                        <p className="text-sm">
                          {payment.fulfillmentType} • {payment.fulfillmentStatus || "No fulfillment status"}
                          {payment.appointmentTime ? ` • ${payment.appointmentTime}` : ""}
                        </p>
                      ) : null}
                      {payment.fulfillmentNotes ? (
                        <p className="text-sm text-muted-foreground">{payment.fulfillmentNotes}</p>
                      ) : null}
                    </div>
                    {canCompleteAppointment(payment) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingKey === `history-payment:${payment.id}`}
                        onClick={() => void handleAction(`history-payment:${payment.id}`, "Appointment done", {
                          action: "appointment_done",
                          paymentId: payment.id,
                        })}
                      >
                        {actingKey === `history-payment:${payment.id}` ? <Spinner className="mr-2 size-4" /> : <IconCheck className="mr-2 size-4" />}
                        Appointment Done
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

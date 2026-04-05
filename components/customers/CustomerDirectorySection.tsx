"use client"

import * as React from "react"
import {
  IconArrowRight,
  IconChecklist,
  IconClockHour4,
  IconRefresh,
  IconSearch,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  fetchCustomerDashboard,
  runCustomerAction,
} from "@/lib/api-client"
import { useViewParams } from "@/hooks/useViewParams"
import { useOrgStore } from "@/stores/orgStore"
import type {
  CustomerDashboardEntry,
  CustomerDashboardFilter,
  CustomerDashboardSort,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

const PAGE_SIZE = 10

function formatDateTime(value: string | null): string {
  if (!value) return "No calls yet"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function displayCustomerName(customer: CustomerDashboardEntry): string {
  return customer.name || customer.phone || customer.email || customer.externalId
}

function getDecisionBadge(customer: CustomerDashboardEntry): { label: string; className: string } | null {
  if (customer.decisionStatus === "approved") {
    return { label: "Approved", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
  }
  if (customer.decisionStatus === "denied") {
    return { label: "Denied", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" }
  }
  return null
}

function getManualStageBadge(customer: CustomerDashboardEntry): { label: string; className: string } | null {
  if (customer.manualStage === "follow_up_needed") {
    return { label: "Follow Up", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" }
  }
  if (customer.manualStage === "request_closed") {
    return { label: "Request Closed", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" }
  }
  if (customer.manualStage === "appointment_done") {
    return { label: "Appointment Done", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" }
  }
  return null
}

function StateBadges({ customer }: { customer: CustomerDashboardEntry }) {
  const decisionBadge = getDecisionBadge(customer)
  const manualBadge = getManualStageBadge(customer)

  return (
    <div className="flex flex-wrap gap-1">
      {customer.needsAttention ? <Badge variant="outline">Needs Attention</Badge> : null}
      {manualBadge ? (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${manualBadge.className}`}>
          {manualBadge.label}
        </span>
      ) : null}
      {decisionBadge ? (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${decisionBadge.className}`}>
          {decisionBadge.label}
        </span>
      ) : null}
    </div>
  )
}

export function CustomerDirectorySection() {
  const { setView, view } = useViewParams()
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const currentRole = useOrgStore((state) => state.currentRole())
  const canManageCustomers = currentRole === "owner" || currentRole === "admin"

  const [search, setSearch] = React.useState("")
  const deferredSearch = React.useDeferredValue(search)
  const [filter, setFilter] = React.useState<CustomerDashboardFilter>("all")
  const [sort, setSort] = React.useState<CustomerDashboardSort>("last_call_desc")
  const [page, setPage] = React.useState(0)
  const [customers, setCustomers] = React.useState<CustomerDashboardEntry[]>([])
  const [attentionCustomers, setAttentionCustomers] = React.useState<CustomerDashboardEntry[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [actingId, setActingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setPage(0)
  }, [currentOrgId, deferredSearch, filter, sort])

  const loadCustomers = React.useCallback(async () => {
    if (!canManageCustomers || !currentOrgId) return

    setLoading(true)
    setError(null)
    try {
      const result = await fetchCustomerDashboard({
        search: deferredSearch,
        filter,
        sort,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setCustomers(result.customers)
      setAttentionCustomers(result.attentionCustomers)
      setTotal(result.total)
    } catch (err: any) {
      setError(err?.message || "Failed to load customer data")
    } finally {
      setLoading(false)
    }
  }, [canManageCustomers, currentOrgId, deferredSearch, filter, page, sort])

  React.useEffect(() => {
    if (view !== "dashboard") return
    void loadCustomers()
  }, [loadCustomers, view])

  const handleQuickAction = async (customer: CustomerDashboardEntry) => {
    if (!customer.quickAction) return

    const confirmed = window.confirm(`${customer.quickAction.label} for ${displayCustomerName(customer)}?`)
    if (!confirmed) return

    setActingId(customer.id)
    try {
      await runCustomerAction(customer.id, {
        action: customer.quickAction.type,
        taskId: customer.quickAction.taskId ?? undefined,
        escalationId: customer.quickAction.escalationId ?? undefined,
        paymentId: customer.quickAction.paymentId ?? undefined,
      })
      toast.success(`${customer.quickAction.label} updated`)
      await loadCustomers()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update customer")
    } finally {
      setActingId(null)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setFilter("all")
    setSort("last_call_desc")
  }

  const hasActiveFilters = search.trim().length > 0 || filter !== "all" || sort !== "last_call_desc"
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (!canManageCustomers) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Customer Data</h2>
          <p className="text-sm text-muted-foreground">
            Track customers, follow-up work, and booked appointments for this workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{total} customers</Badge>
          <Badge variant="outline">{attentionCustomers.length} need help</Badge>
          <Button variant="outline" size="sm" onClick={() => void loadCustomers()} disabled={loading}>
            {loading ? <Spinner className="mr-2 size-4" /> : <IconRefresh className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconClockHour4 className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Top Customers Needing Help</CardTitle>
              <CardDescription>
                Ranked by unresolved escalations, open follow-up work, and upcoming appointments.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && attentionCustomers.length === 0 ? (
            <div className="flex min-h-[140px] items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : attentionCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              No customers currently need attention.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {attentionCustomers.map((customer) => (
                <Card key={customer.id} className="border-border/70 bg-card/70">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{displayCustomerName(customer)}</CardTitle>
                        <CardDescription className="truncate text-xs">
                          {customer.phone || customer.email || customer.externalId}
                        </CardDescription>
                      </div>
                      <StateBadges customer={customer} />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{customer.pendingStatusSummary}</p>
                      {customer.nextStepSummary ? (
                        <p className="line-clamp-2 text-muted-foreground">{customer.nextStepSummary}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">Last call {formatDateTime(customer.lastCallAt)}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2 pt-0">
                    <Button variant="ghost" size="sm" onClick={() => setView("customer-detail", { customerId: customer.id })}>
                      View Details
                    </Button>
                    {customer.quickAction ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === customer.id}
                        onClick={() => void handleQuickAction(customer)}
                      >
                        {actingId === customer.id ? <Spinner className="mr-2 size-4" /> : null}
                        {customer.quickAction.label}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconUsers className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Customer Directory</CardTitle>
              <CardDescription>Search and manage customers connected to this organization.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, email..."
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Select value={filter} onValueChange={(value) => setFilter(value as CustomerDashboardFilter)}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All customers</SelectItem>
                <SelectItem value="attention">Needs attention</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as CustomerDashboardSort)}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_call_desc">Latest call</SelectItem>
                <SelectItem value="last_call_asc">Oldest call</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="name_desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={clearFilters}>
                <IconX className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Call</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pending Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Step</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Calls</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <Spinner className="mx-auto size-6" />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      {hasActiveFilters ? "No customers match your filters." : "No customers found for this organization yet."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cursor-pointer border-t transition-colors hover:bg-muted/30"
                      onClick={() => setView("customer-detail", { customerId: customer.id })}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <div className="font-medium">{displayCustomerName(customer)}</div>
                          <div className="text-xs text-muted-foreground">{customer.email || customer.externalId}</div>
                          <StateBadges customer={customer} />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{customer.phone || "—"}</td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{formatDateTime(customer.lastCallAt)}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="max-w-[220px]">
                          <div className="font-medium">{customer.pendingStatusSummary}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        <div className="max-w-[260px] truncate">{customer.nextStepSummary || "No pending step"}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{customer.totalCalls}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              setView("customer-detail", { customerId: customer.id })
                            }}
                          >
                            Details
                            <IconArrowRight className="ml-1 size-4" />
                          </Button>
                          {customer.quickAction ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actingId === customer.id}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleQuickAction(customer)
                              }}
                            >
                              {actingId === customer.id ? <Spinner className="mr-2 size-4" /> : <IconChecklist className="mr-2 size-4" />}
                              {customer.quickAction.label}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

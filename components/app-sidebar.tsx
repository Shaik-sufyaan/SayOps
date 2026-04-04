"use client"

import * as React from "react"
import { IconGripVertical, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconX, IconMenu2, IconCreditCard, IconCoin, IconBuilding, IconHeartbeat } from "@tabler/icons-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { fetchUsageSummary } from "@/lib/api-client"
import { useOrgStore } from "@/stores/orgStore"
import { NavAgents } from "@/components/sidebar/NavAgents"
import { NavIntegrations } from "@/components/sidebar/NavIntegrations"
import { NavDocuments } from "@/components/sidebar/NavDocuments"
import { NavCallHistory } from "@/components/sidebar/NavCallHistory"
import { useSidebarStore, useAgentsStore, DEFAULT_WIDTH } from "@/stores"
import { useViewParams } from "@/hooks/useViewParams"
import { cn } from "@/lib/utils"

function SpeakOpsWaveMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 56 18"
      className="h-4 w-14 text-current opacity-60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
        <line x1="4" y1="10" x2="4" y2="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="20" y1="5.5" x2="20" y2="14.5" />
        <line x1="28" y1="3.5" x2="28" y2="16.5" />
        <line x1="36" y1="6.5" x2="36" y2="13.5" />
        <line x1="44" y1="4.5" x2="44" y2="15.5" />
        <line x1="52" y1="8.5" x2="52" y2="11.5" />
      </g>
    </svg>
  )
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user, isPlatformAdmin } = useAuth()
  const { agents } = useAgentsStore()
  const { view, setView } = useViewParams()
  const { width, setWidth, isCollapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebarStore()
  const orgStore = useOrgStore()
  const currentRole = orgStore.currentRole()
  const resizeRef = React.useRef<{ startX: number; startWidth: number } | null>(null)
  const [usageStats, setUsageStats] = React.useState<{ totalCost: number; totalTokens: number } | null>(null)
  const [isSidebarReady, setIsSidebarReady] = React.useState(false)

  React.useEffect(() => {
    Promise.resolve(useSidebarStore.persist.rehydrate()).finally(() => {
      setIsSidebarReady(true)
    })
  }, [])

  React.useEffect(() => {
    if (!user) return

    const refresh = () => {
      fetchUsageSummary("month")
        .then(({ rows }) => {
          const totalCost = rows.reduce((sum, r) => sum + Number(r.total_cost_usd), 0)
          const totalTokens = rows.reduce((sum, r) => sum + Number(r.total_quantity), 0)
          setUsageStats({ totalCost, totalTokens })
        })
        .catch(() => {})
    }

    refresh()
    const interval = setInterval(refresh, 60_000)
    const onVisible = () => { if (document.visibilityState === "visible") refresh() }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [user])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = {
      startX: e.clientX,
      startWidth: width,
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!resizeRef.current) return
      const deltaX = e.clientX - resizeRef.current.startX
      setWidth(resizeRef.current.startWidth + deltaX)
    },
    [setWidth]
  )

  const handleMouseUp = React.useCallback(() => {
    resizeRef.current = null
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseMove])

  const userData = {
    name: user?.displayName || user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    avatar: user?.photoURL || "",
  }

  // First-time onboarding: keep the create-agent flow focused and full-width.
  if (view === "create-agent" && agents.length === 0) {
    return null
  }

  return (
    <>
      {/* Mobile hamburger — fixed top-left, only when sidebar is closed on mobile */}
      {!mobileOpen && (
        <button
          className="fixed top-3 left-3 z-30 p-1.5 rounded-md bg-background border shadow-sm lg:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <IconMenu2 className="size-5" />
        </button>
      )}

      {/* Mobile backdrop — tap to close */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop collapsed strip — hidden on mobile */}
      {isCollapsed && (
        <div className="sticky top-0 h-screen flex-shrink-0 border-r bg-gradient-to-b from-blue-200 via-slate-100 to-purple-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 z-30 hidden lg:block">
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center w-10 h-10 mt-2 mx-auto text-muted-foreground hover:text-foreground"
            title="Expand sidebar"
          >
            <IconLayoutSidebarLeftExpand className="size-5" />
          </button>
        </div>
      )}

      {/* Full sidebar — sticky on desktop, fixed overlay on mobile */}
      {!isCollapsed && (
        <div
          className={cn(
            "h-screen flex-shrink-0 bg-gradient-to-b from-blue-200 via-slate-100 to-purple-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900",
            mobileOpen
              ? "fixed inset-y-0 left-0 z-50 flex"
              : "relative sticky top-0 z-30 hidden lg:flex"
          )}
          style={{ width: mobileOpen ? DEFAULT_WIDTH : width }}
        >
          <Sidebar collapsible="none" className="h-full !w-full !bg-white/25 dark:!bg-black/30 backdrop-blur-2xl border-r border-white/40 dark:border-white/10 shadow-[inset_-1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.08)]" {...props}>
            <SidebarHeader className="px-3 py-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center gap-2">
                    <SidebarMenuButton
                      isActive={view === "calls"}
                      onClick={() => setView("calls")}
                      className="h-auto flex-1 !p-0 hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
                    >
                      <div className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white/18 px-3 py-2 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors hover:bg-white/24 dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:bg-white/8">
                        <span className="text-base font-bold leading-none">SpeakOps</span>
                        <SpeakOpsWaveMark />
                      </div>
                    </SidebarMenuButton>
                    {/* Collapse button: desktop only */}
                    <button
                      onClick={toggleCollapsed}
                      className="hidden shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/12 hover:text-foreground lg:block"
                      title="Collapse sidebar"
                    >
                      <IconLayoutSidebarLeftCollapse className="size-4" />
                    </button>
                    {/* Close button: mobile only */}
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/12 hover:text-foreground lg:hidden"
                      title="Close sidebar"
                    >
                      <IconX className="size-4" />
                    </button>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-y-auto">
              {isSidebarReady ? (
                <>
                  <NavCallHistory />
                  {/* Hide agent management for invited members (role === 'member') */}
                  {currentRole !== 'member' && (
                    <>
                      <NavAgents />
                      <NavDocuments />
                    </>
                  )}
                  <div className="mt-auto">
                    <SidebarMenu className="px-2 pb-1">
                      {/* Hide admin/billing features for invited members */}
                      {currentRole !== 'member' && (
                        <>
                          <SidebarMenuItem>
                            <SidebarMenuButton isActive={view === "token-usage"} onClick={() => setView("token-usage")} className="gap-2">
                              <IconCoin className="size-4 text-amber-500" />
                              <span>Token Usage</span>
                              {usageStats && (
                                <div className="ml-auto flex items-center gap-1.5 text-[10px] font-medium">
                                  <span className="text-emerald-500">+${usageStats.totalCost.toFixed(2)}</span>
                                  <span className="text-red-400">−{new Intl.NumberFormat().format(usageStats.totalTokens)} tok</span>
                                </div>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton isActive={view === "payments"} onClick={() => setView("payments")} className="gap-2">
                              <IconCreditCard className="size-4 text-violet-500" />
                              <span>Payments</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          {isPlatformAdmin && (
                            <>
                              <SidebarMenuItem>
                                <SidebarMenuButton isActive={view === "admin-orgs" || view === "admin-org-detail"} onClick={() => setView("admin-orgs")} className="gap-2">
                                  <IconBuilding className="size-4 text-sky-500" />
                                  <span>Organizations</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                              <SidebarMenuItem>
                                <SidebarMenuButton isActive={view === "platform-health"} onClick={() => setView("platform-health")} className="gap-2">
                                  <IconHeartbeat className="size-4 text-emerald-500" />
                                  <span>Platform Health</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </>
                          )}
                        </>
                      )}
                    </SidebarMenu>
                    {currentRole !== 'member' && <NavIntegrations />}
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col gap-3 px-2 py-3">
                  <div className="space-y-2">
                    <div className="h-9 rounded-md bg-white/30 dark:bg-white/6" />
                    <div className="h-9 rounded-md bg-white/22 dark:bg-white/5" />
                    <div className="h-9 rounded-md bg-white/18 dark:bg-white/4" />
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="h-9 rounded-md bg-white/22 dark:bg-white/5" />
                    <div className="h-9 rounded-md bg-white/18 dark:bg-white/4" />
                    <div className="h-9 rounded-md bg-white/14 dark:bg-white/3" />
                  </div>
                </div>
              )}
            </SidebarContent>

            <SidebarFooter className="gap-2 p-4">
              {isSidebarReady ? (
                <NavUser user={userData} />
              ) : (
                <div className="h-12 rounded-md bg-white/26 dark:bg-white/6" />
              )}
            </SidebarFooter>
          </Sidebar>

          {/* Resize handle: desktop only */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors group touch-none hidden lg:block"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <IconGripVertical className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect } from "react"

export type ViewId =
  | "dashboard"
  | "documents"
  | "calls"
  | "history"
  | "integrations"
  | "account"
  | "notifications"
  | "billing"
  | "settings"
  | "agent"
  | "create-agent"
  | "payments"
  | "token-usage"
  | "admin-orgs"
  | "admin-org-detail"
  | "platform-health"

export function useViewParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawView = searchParams.get("view") as ViewId | null
  const normalizeView = (candidate: ViewId | null): Exclude<ViewId, "dashboard" | "history"> | "calls" => {
    if (candidate === "dashboard" || candidate === "history" || candidate === null) {
      return "calls"
    }
    return candidate
  }

  const view = normalizeView(rawView)
  const agentId = searchParams.get("agentId")
  const orgId = searchParams.get("orgId")

  useEffect(() => {
    if (rawView !== "dashboard" && rawView !== "history") return

    const p = new URLSearchParams(searchParams.toString())
    p.delete("view")
    const next = p.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, rawView, router, searchParams])

  const setView = useCallback(
    (newView: ViewId, params?: Record<string, string>) => {
      const normalizedView = normalizeView(newView)
      const p = new URLSearchParams(searchParams.toString())
      if (normalizedView === "calls") {
        p.delete("view")
      } else {
        p.set("view", normalizedView)
      }
      // Clear agent-specific params when switching away from agent view
      if (normalizedView !== "agent") p.delete("agentId")
      // Clear org-specific params when switching away from admin-org-detail
      if (normalizedView !== "admin-org-detail") p.delete("orgId")
      // Set additional params (e.g., agentId for agent view, orgId for admin-org-detail)
      if (params) {
        Object.entries(params).forEach(([k, v]) => p.set(k, v))
      }
      const next = p.toString()
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  return { view, agentId, orgId, setView }
}

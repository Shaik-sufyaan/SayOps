"use client"

import { Separator } from "@/components/ui/separator"
import { IconMenu2 } from "@tabler/icons-react"
import { useViewParams } from "@/hooks/useViewParams"
import { useSidebarStore } from "@/stores"

function getViewLabel(view: string) {
  switch (view) {
    case "calls":
      return "Calls"
    case "customers":
      return "Customer Data"
    case "customer-detail":
      return "Customer Detail"
    case "documents":
      return "Documents"
    case "integrations":
      return "Integrations"
    case "account":
    case "settings":
      return "Account"
    case "notifications":
      return "Notifications"
    case "billing":
      return "Billing"
    case "payments":
      return "Payments"
    case "token-usage":
      return "Token Usage"
    case "admin-orgs":
      return "Organizations"
    case "admin-org-detail":
      return "Organization Detail"
    case "platform-health":
      return "Platform Health"
    case "create-agent":
      return "Create Agent"
    case "agent":
      return "Agent"
    default:
      return "Calls"
  }
}

export function SiteHeader() {
  const { setMobileOpen, toggleCollapsed } = useSidebarStore()
  const { view } = useViewParams()

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[--header-height]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <button
          className="-ml-1 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (window.innerWidth < 1024) setMobileOpen(true)
            else toggleCollapsed()
          }}
          aria-label="Toggle sidebar"
        >
          <IconMenu2 className="size-5" />
        </button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getViewLabel(view)}</h1>
      </div>
    </header>
  )
}

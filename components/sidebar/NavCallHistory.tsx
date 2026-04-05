"use client"

import { IconLayoutGrid, IconPhone, IconUsers } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useViewParams } from "@/hooks/useViewParams"

export function NavCallHistory() {
  const { view, setView } = useViewParams()

  return (
    <SidebarGroup className="px-4 pt-1">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={view === "dashboard"}
            onClick={() => setView("dashboard")}
            className="pl-4"
          >
            <IconLayoutGrid className="size-4" />
            <span>Overview</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={view === "calls"}
            onClick={() => setView("calls")}
            className="pl-4"
          >
            <IconPhone className="size-4" />
            <span>Calls</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={view === "customers" || view === "customer-detail"}
            onClick={() => setView("customers")}
            className="pl-4"
          >
            <IconUsers className="size-4" />
            <span>Customer Data</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

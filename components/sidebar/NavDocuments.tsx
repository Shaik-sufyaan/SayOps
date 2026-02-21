"use client"

import * as React from "react"
import { IconFileUpload, IconPlus, IconFiles } from "@tabler/icons-react"
import Link from "next/link"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavSection } from "./NavSection"

export function NavDocuments() {
  return (
    <NavSection
      id="documents"
      title="Business Documents"
      icon={<IconFileUpload className="size-4" />}
      showSearch
      searchPlaceholder="Search documents..."
      headerAction={
        <Link
          href="/documents"
          className="text-muted-foreground hover:text-foreground"
          title="View Documents"
        >
          <IconPlus className="size-4" />
        </Link>
      }
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="text-muted-foreground">
            <Link href="/documents">
              <IconFiles className="size-4" />
              <span>All Documents</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </NavSection>
  )
}

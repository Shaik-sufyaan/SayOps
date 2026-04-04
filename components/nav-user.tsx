"use client"

import * as React from "react"
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconBuilding,
  IconCheck,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from "@/lib/auth-context"
import { useViewParams } from "@/hooks/useViewParams"
import { useTheme } from "next-themes"
import { IconSun, IconMoon } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { useOrgStore } from "@/stores/orgStore"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { signOut, isPlatformAdmin } = useAuth()
  const { setView } = useViewParams()
  const { resolvedTheme, setTheme } = useTheme()
  const orgStore = useOrgStore()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  const handleLogout = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium flex items-center gap-1.5">
                  {user.name}
                  {isPlatformAdmin && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                  )}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              {mounted && (
                <span
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setTheme(resolvedTheme === "dark" ? "light" : "dark") }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark"
                    ? <IconMoon className="size-4" />
                    : <IconSun className="size-4" />}
                </span>
              )}
              <IconDotsVertical className="size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {orgStore.allMemberships.length > 1 && (
              <>
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  Switch Organization
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {orgStore.allMemberships.map(({ member, organization }) => (
                    <DropdownMenuItem
                      key={organization?.id}
                      onClick={() => {
                        if (organization?.id) {
                          orgStore.setCurrentOrg(organization.id)
                        }
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <IconBuilding className="size-4" />
                        <span>{organization?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {organization?.id === orgStore.currentOrgId && (
                          <IconCheck className="size-3.5 text-green-600" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setView("account")}>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("billing")}>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("notifications")}>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

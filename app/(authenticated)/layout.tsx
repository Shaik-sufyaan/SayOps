import { AuthenticatedAppShell } from "@/components/auth/AuthenticatedAppShell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
  )
}

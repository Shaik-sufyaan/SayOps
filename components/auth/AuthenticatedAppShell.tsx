"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { PersistentEva } from "@/components/eva/PersistentEva"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { acceptCurrentTerms } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const { loading, termsAccepted, termsVersion, refreshUser, signOut, user } = useAuth()
  const [acceptingTerms, setAcceptingTerms] = useState(false)

  const handleAcceptTerms = async () => {
    setAcceptingTerms(true)

    try {
      await acceptCurrentTerms()
      await refreshUser()
      toast.success("Terms accepted")
    } catch (error) {
      toast.error((error as Error).message || "Failed to accept terms")
    } finally {
      setAcceptingTerms(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (user && !termsAccepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Accept the current terms to continue</CardTitle>
            <CardDescription>
              SpeakOps now requires acceptance of the active Terms &amp; Conditions before protected workspace features load.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Active version: <span className="font-medium text-foreground">{termsVersion ?? "current"}</span>
            </p>
            <p>
              Review the full agreement before continuing. Once accepted, your dashboard and authenticated API access will unlock immediately.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" asChild>
              <Link href="/terms" target="_blank" rel="noreferrer">
                Review terms
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void signOut()}>
              Sign out
            </Button>
            <Button onClick={() => void handleAcceptTerms()} disabled={acceptingTerms}>
              {acceptingTerms ? "Accepting..." : "Accept and continue"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-14 lg:pt-4">
            {children}
            <Suspense fallback={null}>
              <PersistentEva />
            </Suspense>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

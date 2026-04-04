"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { acceptInvite, getInvite, fetchCurrentUser } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useOrgStore } from "@/stores/orgStore"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/use-toast"
import { IconMail } from "@tabler/icons-react"

export default function InvitePage() {
  const { token } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const orgStore = useOrgStore()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  // Fetch invite details (public, no auth needed)
  useEffect(() => {
    if (token) {
      getInvite(token as string)
        .then(setInvite)
        .catch((err) => {
          console.error("Failed to fetch invite:", err)
          setError("Invalid or expired invitation.")
        })
        .finally(() => setLoading(false))
    }
  }, [token])

  // Handle auth check: if not logged in, redirect to login with pending invite token
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      // Save token to sessionStorage for auto-accept after login
      sessionStorage.setItem('pendingInviteToken', token as string)
      router.push("/login")
    }
  }, [user, authLoading, token, router])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const org = await acceptInvite(token as string)

      // Refresh user memberships from the backend
      const currentUserData = await fetchCurrentUser()
      if (currentUserData.allMemberships) {
        orgStore.setAllMemberships(currentUserData.allMemberships)
        // Set current org to the newly joined organization
        if (org?.id) {
          orgStore.setCurrentOrg(org.id)
        }
      }

      toast({
        title: "Welcome!",
        description: "You have successfully joined the organization.",
      })
      router.push("/dashboard")
    } catch (err) {
      console.error("Failed to accept invite:", err)
      toast({
        title: "Error",
        description: "Failed to accept invitation.",
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Spinner className="size-8" />
      </div>
    )
  }

  // If not authenticated, redirect in useEffect above
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <IconMail className="size-6 text-primary" />
          </div>
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            {error || (invite ? `Join ${invite.org_name} on SpeakOps` : "Checking invitation...")}
          </CardDescription>
        </CardHeader>

        {!error && invite && (
          <CardContent className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Invited by: <span className="font-medium text-foreground">{invite.inviter_email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground capitalize">{invite.role}</span>
            </p>
          </CardContent>
        )}

        <CardFooter className="flex justify-center">
          {error ? (
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          ) : (
            <Button onClick={handleAccept} disabled={accepting} className="w-full">
              {accepting ? <Spinner className="mr-2 size-4" /> : null}
              Accept Invitation
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

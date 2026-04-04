"use client"

import * as React from "react"
import {
  IconMail,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconTrash,
  IconCamera,
  IconX,
  IconBuilding,
} from "@tabler/icons-react"
import { sendPasswordResetEmail, updateEmail, updateProfile } from "firebase/auth"
import { toast } from "sonner"

import { auth } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import {
  createOrgInvite,
  deleteOrgInvite,
  deleteOrgMember,
  fetchOrgInvites,
  fetchOrgMembers,
  fetchUserSettings,
  updateUserSettings,
} from "@/lib/api-client"
import type { OrgInvite, OrgMember } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrgStore } from "@/stores/orgStore"

export function AccountPanel() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const currentOrgId = useOrgStore((state) => state.currentOrgId)
  const allMemberships = useOrgStore((state) => state.allMemberships)
  const setCurrentOrg = useOrgStore((state) => state.setCurrentOrg)
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [photoURL, setPhotoURL] = React.useState("")
  const [savingProfile, setSavingProfile] = React.useState(false)
  const [sendingPasswordEmail, setSendingPasswordEmail] = React.useState(false)

  const [invites, setInvites] = React.useState<OrgInvite[]>([])
  const [members, setMembers] = React.useState<OrgMember[]>([])
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [loadingTeam, setLoadingTeam] = React.useState(true)
  const [isInviting, setIsInviting] = React.useState(false)

  // Profile picture upload
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = React.useState("")

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [deletingItemId, setDeletingItemId] = React.useState<string | null>(null)
  const [deletingItemType, setDeletingItemType] = React.useState<'invite' | 'member' | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!user) return
    setDisplayName(user.displayName || "")
    setEmail(user.email || "")
    setPhotoURL(user.photoURL || "")
  }, [user])

  React.useEffect(() => {
    if (authLoading || !user) return
    ;(async () => {
      const settings = await fetchUserSettings()
      if (!settings) return
      if (settings.display_name !== null) setDisplayName(settings.display_name)
      if (settings.profile_image_url !== null) setPhotoURL(settings.profile_image_url)
    })()
  }, [authLoading, currentOrgId, user])

  React.useEffect(() => {
    if (authLoading || !user) return
    loadTeamData()
  }, [authLoading, currentOrgId, user])

  const currentMembership = React.useMemo(
    () => allMemberships.find((membership) => membership.organization?.id === currentOrgId) ?? null,
    [allMemberships, currentOrgId]
  )

  const loadTeamData = async () => {
    try {
      setLoadingTeam(true)
      const [inviteData, memberData] = await Promise.all([
        fetchOrgInvites(),
        fetchOrgMembers(),
      ])
      setInvites(inviteData)
      setMembers(memberData)
    } catch {
      toast.error("Failed to load workspace settings")
    } finally {
      setLoadingTeam(false)
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const nextEmail = email.trim()
    const nextDisplayName = displayName.trim()
    const nextPhotoURL = photoURL.trim()

    setSavingProfile(true)
    try {
      await updateProfile(user, {
        displayName: nextDisplayName || null,
        photoURL: nextPhotoURL || null,
      })

      if (nextEmail && nextEmail !== user.email) {
        await updateEmail(user, nextEmail)
      }

      await updateUserSettings({
        display_name: nextDisplayName,
        profile_image_url: nextPhotoURL,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      })

      await refreshUser()
      toast.success("Account updated")
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        toast.error("Please log out and log in again before changing your email.")
      } else {
        toast.error(err?.message || "Failed to update account")
      }
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setSendingPasswordEmail(true)
    try {
      await sendPasswordResetEmail(auth, user.email)
      toast.success("Password reset email sent")
    } catch (err: any) {
      toast.error(err?.message || "Failed to send password reset email")
    } finally {
      setSendingPasswordEmail(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setPhotoURL(result)
      setPhotoPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const clearProfilePicture = () => {
    setPhotoURL("")
    setPhotoPreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setIsInviting(true)
    try {
      await createOrgInvite(inviteEmail, "member")
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      await loadTeamData()
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  const openDeleteDialog = (itemId: string, itemType: 'invite' | 'member') => {
    setDeletingItemId(itemId)
    setDeletingItemType(itemType)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItemId || !deletingItemType) return
    setIsDeleting(true)
    try {
      if (deletingItemType === 'invite') {
        await deleteOrgInvite(deletingItemId)
        toast.success("Invitation deleted")
      } else {
        await deleteOrgMember(deletingItemId)
        toast.success("Member removed")
      }
      setDeleteDialogOpen(false)
      await loadTeamData()
    } catch (err: any) {
      toast.error(err?.message || `Failed to delete ${deletingItemType}`)
    } finally {
      setIsDeleting(false)
      setDeletingItemId(null)
      setDeletingItemType(null)
    }
  }

  const initials = (displayName || email || "U")
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-4 lg:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and workspace settings.
        </p>
      </div>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconBuilding className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Organization</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Workspace</CardTitle>
            <CardDescription>
              Switch between organizations to manage a different workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-organization">Organization</Label>
              <Select
                value={currentOrgId ?? undefined}
                onValueChange={setCurrentOrg}
                disabled={allMemberships.length <= 1}
              >
                <SelectTrigger id="account-organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {allMemberships
                    .filter((membership) => membership.organization?.id)
                    .map((membership) => (
                      <SelectItem
                        key={membership.organization!.id}
                        value={membership.organization!.id}
                      >
                        {membership.organization!.name} ({membership.member.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentMembership?.organization
                ? `Currently managing ${currentMembership.organization.name} as ${currentMembership.member.role}.`
                : "You only have access to one organization right now."}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Two-column layout: Profile on left, Workspace on right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconUser className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
          <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>
              Update your name, email, and optional profile image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-5" onSubmit={handleProfileSave}>
              {/* Profile Picture Upload */}
              <div className="space-y-3">
                <Label>Profile Picture</Label>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 rounded-lg flex-shrink-0">
                    {photoURL ? <AvatarImage src={photoURL} alt={displayName || email} /> : null}
                    <AvatarFallback className="rounded-lg text-lg font-semibold">{initials || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">Shown in your workspace menu. Max 5MB.</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto"
                      >
                        <IconCamera className="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                      {photoURL && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearProfilePicture}
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="account-name">Name</Label>
                <Input
                  id="account-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto">
                  {savingProfile ? "Saving..." : "Save Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={sendingPasswordEmail || !user?.email}
                  className="w-full sm:w-auto"
                >
                  {sendingPasswordEmail ? "Sending..." : "Change Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </section>

        {/* Workspace Settings Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <IconUsers className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Workspace</h2>
          </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
            <CardDescription>Invite and manage organization members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendInvite} className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 space-y-1">
                <Label htmlFor="account-invite-email" className="sr-only">
                  Invite Email
                </Label>
                <Input
                  id="account-invite-email"
                  type="email"
                  placeholder="colleague@business.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isInviting}>
                <IconUserPlus className="mr-2 h-4 w-4" />
                {isInviting ? "Sending..." : "Invite"}
              </Button>
            </form>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Invitations
              </h3>
              {invites.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No pending invites.</p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex flex-wrap items-center justify-between gap-2 bg-muted/10 p-4">
                      <div className="flex min-w-0 items-center gap-3 flex-1">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                          <IconMail className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
                          <p className="text-xs capitalize text-muted-foreground">{invite.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Expires {new Date(invite.expires_at).toLocaleDateString()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(invite.id, 'invite')}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {members.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Members
                  </h3>
                  <div className="divide-y rounded-lg border">
                    {members.map((member) => (
                      <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                        <div className="flex min-w-0 items-center gap-3 flex-1">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                            <IconUsers className="size-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.email}</p>
                            <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            Joined {new Date(member.created_at).toLocaleDateString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(member.id, 'member')}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {loadingTeam && (
              <p className="text-sm text-muted-foreground">Loading workspace members...</p>
            )}
          </CardContent>
        </Card>
        </section>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {deletingItemType === 'invite' ? 'Delete Invitation' : 'Remove Member'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deletingItemType === 'invite'
              ? 'This invitation will be deleted and the recipient will no longer be able to accept it.'
              : 'This member will be removed from the organization. They can be re-invited later.'}
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

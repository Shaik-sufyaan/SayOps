"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { fetchCurrentUser, fetchTermsStatus, acceptCurrentTerms } from "@/lib/api-client"
import { useOrgStore } from "@/stores/orgStore"
import type { OrgMember } from "@/lib/types"

const googleProvider = new GoogleAuthProvider()

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  isPlatformAdmin: boolean
  organizationRole: OrgMember["role"] | null
  canManageOrganization: boolean
  termsAccepted: boolean | null
  termsVersion: string | null
  signInWithGoogle: () => Promise<FirebaseUser>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
  refreshUser: () => Promise<void>
  acceptTermsAndConditions: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [organizationRole, setOrganizationRole] = useState<OrgMember["role"] | null>(null)
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)
  const [termsVersion, setTermsVersion] = useState<string | null>(null)

  const syncCurrentUser = async (currentUser: FirebaseUser | null) => {
    const orgStore = useOrgStore.getState()

    if (!currentUser) {
      setIsPlatformAdmin(false)
      setOrganizationRole(null)
      setTermsAccepted(null)
      setTermsVersion(null)
      orgStore.clear()
      return
    }

    try {
      const hasPendingInviteToken = typeof window !== "undefined"
        && Boolean(sessionStorage.getItem("pendingInviteToken"))

      if (hasPendingInviteToken) {
        orgStore.clear()
        const termsStatus = await fetchTermsStatus()
        setIsPlatformAdmin(false)
        setOrganizationRole(null)
        setTermsAccepted(termsStatus.accepted)
        setTermsVersion(termsStatus.terms_version ?? null)
        return
      }

      const { user: member, terms, allMemberships } = await fetchCurrentUser()
      setIsPlatformAdmin(member?.is_platform_admin === true)
      setOrganizationRole(member?.role ?? null)
      setTermsAccepted(terms?.accepted !== false)
      setTermsVersion(terms?.terms_version ?? null)
      orgStore.setAllMemberships(allMemberships ?? [])
    } catch {
      setIsPlatformAdmin(false)
      setOrganizationRole(null)
      setTermsAccepted(false)
      setTermsVersion(null)
    }
  }

  useEffect(() => {
    // Dev auth bypass must be explicitly enabled; public routes should stay public by default.
    if (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true') {
      setUser({
        uid: 'dev-user',
        email: 'dev@evently.local',
        displayName: 'Dev User',
        photoURL: null,
        getIdToken: async () => 'dev-token',
        reload: async () => {},
      } as any)
      setOrganizationRole("owner")
      setTermsAccepted(true)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      await syncCurrentUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    return cred.user
  }

  const signOutFn = async () => {
    await firebaseSignOut(auth)
  }

  const getToken = async () => {
    if (!user) return null
    return user.getIdToken()
  }

  const refreshUser = async () => {
    if (user) {
      if (process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === 'true') return
      await user.getIdToken(true)
      await user.reload()
      // Create shallow copy to trigger re-render if needed, though user object is mutable
      setUser({ ...user } as FirebaseUser)
      await syncCurrentUser(user)
      return
    }

    await syncCurrentUser(null)
  }

  const acceptTermsAndConditions = async () => {
    const terms = await acceptCurrentTerms()
    setTermsAccepted(true)
    setTermsVersion(terms.terms_version ?? null)
  }
  const canManageOrganization = organizationRole === "owner" || organizationRole === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPlatformAdmin,
        organizationRole,
        canManageOrganization,
        termsAccepted,
        termsVersion,
        signInWithGoogle,
        signOut: signOutFn,
        getToken,
        refreshUser,
        acceptTermsAndConditions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

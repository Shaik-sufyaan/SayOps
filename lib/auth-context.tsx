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
import { fetchCurrentUser, fetchTermsStatus, acceptTerms } from "@/lib/api-client"
import { useOrgStore } from "@/stores/orgStore"

const googleProvider = new GoogleAuthProvider()

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
  isPlatformAdmin: boolean
  termsAccepted: boolean | null  // null = still loading
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
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)

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
      setTermsAccepted(true)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      const orgStore = useOrgStore.getState()
      if (u) {
        try {
          const hasPendingInviteToken = typeof window !== "undefined"
            && Boolean(sessionStorage.getItem("pendingInviteToken"))

          if (hasPendingInviteToken) {
            orgStore.clear()
            const termsStatus = await fetchTermsStatus()
            setIsPlatformAdmin(false)
            setTermsAccepted(termsStatus.accepted)
          } else {
            const [currentUserData, termsStatus] = await Promise.all([
              fetchCurrentUser(),
              fetchTermsStatus(),
            ])
            setIsPlatformAdmin(currentUserData.user?.is_platform_admin === true)
            setTermsAccepted(termsStatus.accepted)
            orgStore.setAllMemberships(currentUserData.allMemberships ?? [])
          }
        } catch {
          setIsPlatformAdmin(false)
          setTermsAccepted(false)
        }
      } else {
        setIsPlatformAdmin(false)
        setTermsAccepted(null)
        orgStore.clear()
      }
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
    }
  }

  const acceptTermsAndConditions = async () => {
    await acceptTerms()
    setTermsAccepted(true)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPlatformAdmin,
        termsAccepted,
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

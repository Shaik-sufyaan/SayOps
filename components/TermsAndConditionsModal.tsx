"use client"

import React, { useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"
import { TermsContent } from "@/components/TermsContent"

export function TermsAndConditionsModal() {
  const { signOut, acceptTermsAndConditions } = useAuth()
  const router = useRouter()

  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checked, setChecked] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [declined, setDeclined] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleAccept = async () => {
    if (!checked || !scrolledToBottom) return
    setAccepting(true)
    try {
      await acceptTermsAndConditions()
    } catch {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    setDeclined(true)
    await signOut()
    router.push("/login")
  }

  if (declined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-sm">
            You must accept the Terms &amp; Conditions to use SpeakOps. You have been signed out.
          </p>
          <Button variant="outline" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <h1 className="text-xl font-semibold">Terms &amp; Conditions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Please read and accept our Terms &amp; Conditions before continuing.
          </p>
        </div>

        {/* Scrollable body */}
        <TermsContent scrollRef={scrollRef} onScrolledToBottom={() => setScrolledToBottom(true)} />

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 space-y-3 bg-background rounded-b-xl">
          {!scrolledToBottom && (
            <p className="text-xs text-muted-foreground text-center">
              Please scroll to the bottom to read all terms before accepting.
            </p>
          )}

          <label
            className={`flex items-start gap-3 cursor-pointer select-none ${
              !scrolledToBottom ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-snug">
              I have read and understood the Terms &amp; Conditions, including that SpeakOps
              platform admins may access raw conversation data for debugging and operational purposes.
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleDecline} disabled={accepting}>
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!checked || !scrolledToBottom || accepting}
            >
              {accepting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" /> Saving…
                </span>
              ) : (
                "I Accept"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

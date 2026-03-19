"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Spinner } from "@/components/ui/spinner"

export function TermsAndConditionsModal() {
  const { signOut, acceptTermsAndConditions } = useAuth()
  const router = useRouter()

  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checked, setChecked] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [declined, setDeclined] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Allow a 20px threshold so the user doesn't need pixel-perfect scroll
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", handleScroll)
    // Also check on mount (content may be shorter on some screens)
    handleScroll()
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

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
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-foreground space-y-4 min-h-0"
        >
          <p className="text-muted-foreground italic">Last updated: March 2026 — Version 1.0</p>

          <section className="space-y-2">
            <h2 className="font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the SpeakOps platform ("Service"), you agree to be bound by these
              Terms &amp; Conditions ("Terms"). If you do not agree to all of these Terms, you may not
              access or use the Service. These Terms apply to all users, including organization owners,
              members, and any other individuals who access the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">2. Description of Service</h2>
            <p>
              SpeakOps provides an AI-powered customer representative platform that enables businesses
              to create, deploy, and manage AI agents for customer communications across multiple
              channels including voice, SMS, web chat, and social messaging platforms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">3. Conversation Access &amp; Data Privacy</h2>
            <p>
              <strong>
                You expressly acknowledge and agree that SpeakOps platform administrators may access
                raw conversation data — including the full text of conversations between your AI agents
                and end users — for the purposes of debugging, quality assurance, security
                investigation, compliance monitoring, and service improvement.
              </strong>
            </p>
            <p>
              This includes, but is not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Full message transcripts from all supported channels</li>
              <li>Agent configuration and system prompt data</li>
              <li>Call recordings and voice transcriptions</li>
              <li>Metadata such as timestamps, channel identifiers, and session IDs</li>
              <li>Tool execution logs and LLM trace data</li>
            </ul>
            <p>
              You are responsible for ensuring that your end users are informed of this data access
              practice in accordance with applicable privacy laws (including but not limited to GDPR,
              CCPA, and applicable telecommunications regulations). You must obtain any necessary
              consents from your end users before deploying the Service in your communications channels.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">4. Data Retention &amp; Security</h2>
            <p>
              SpeakOps stores conversation data, including raw message content and recordings, in
              encrypted cloud storage (Google Cloud Storage and Supabase PostgreSQL). Access to this
              data is restricted to authorized SpeakOps personnel and is governed by our internal
              security policies. We implement industry-standard security measures to protect your data
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Violate any applicable law or regulation</li>
              <li>Engage in fraudulent, deceptive, or misleading communications</li>
              <li>Harass, threaten, or harm any individual</li>
              <li>Infringe on any intellectual property rights</li>
              <li>Transmit spam, phishing attempts, or unsolicited commercial communications</li>
              <li>Circumvent any security or access controls</li>
            </ul>
            <p>
              SpeakOps reserves the right to suspend or terminate accounts found to be in violation
              of these acceptable use requirements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">6. Telephone Communications &amp; Compliance</h2>
            <p>
              If you use the Service for voice or SMS communications, you are solely responsible for
              compliance with all applicable telecommunications laws, including the Telephone Consumer
              Protection Act (TCPA), the CAN-SPAM Act, and applicable state and international
              equivalents. You must obtain proper written consent from recipients before initiating
              automated calls or text messages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">7. Subscription, Billing &amp; Payment</h2>
            <p>
              Access to the Service is provided on a subscription basis. Subscription fees are billed
              in advance on a recurring basis. You authorize SpeakOps to charge your designated payment
              method for all applicable fees. All fees are non-refundable except as expressly stated
              in our refund policy. SpeakOps reserves the right to modify subscription pricing with
              30 days' prior notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">8. Intellectual Property</h2>
            <p>
              The Service, including all software, content, trademarks, and technology, is the
              exclusive property of SpeakOps and its licensors. You are granted a limited,
              non-exclusive, non-transferable license to use the Service solely in accordance with
              these Terms. You retain ownership of the content and data you submit to the Service,
              but grant SpeakOps a license to process and store such data as necessary to provide
              the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, or non-infringement. SpeakOps does
              not warrant that the Service will be uninterrupted, error-free, or completely secure.
              AI-generated responses may contain inaccuracies and should be reviewed appropriately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, SpeakOps shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, including but
              not limited to loss of profits, loss of data, business interruption, or reputational
              harm, arising out of or related to your use of the Service, even if SpeakOps has been
              advised of the possibility of such damages. SpeakOps's total aggregate liability shall
              not exceed the fees paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless SpeakOps, its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, costs,
              or expenses (including reasonable attorneys' fees) arising out of or related to your
              use of the Service, your violation of these Terms, or your violation of any third-party
              rights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">12. Modifications to Terms</h2>
            <p>
              SpeakOps reserves the right to modify these Terms at any time. We will notify you of
              material changes by posting an updated version on the platform. Continued use of the
              Service after any such changes constitutes your acceptance of the new Terms. If you do
              not agree to the modified Terms, you must discontinue use of the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">13. Termination</h2>
            <p>
              Either party may terminate these Terms at any time. SpeakOps may suspend or terminate
              your access immediately for violations of these Terms. Upon termination, your right to
              use the Service ceases immediately. Provisions that by their nature should survive
              termination (including data privacy obligations, limitation of liability, and
              indemnification) shall survive.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">14. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the applicable
              jurisdiction without regard to conflict of law provisions. Any disputes arising under
              these Terms shall be subject to the exclusive jurisdiction of the courts in the
              applicable jurisdiction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">15. Contact</h2>
            <p>
              If you have any questions about these Terms &amp; Conditions, please contact us at{" "}
              <span className="font-medium">support@speakops.ai</span>.
            </p>
          </section>

          {/* Bottom anchor so users know they've reached the end */}
          <div className="pt-4 pb-2 text-center text-xs text-muted-foreground border-t">
            — End of Terms &amp; Conditions —
          </div>
        </div>

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
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={accepting}
            >
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

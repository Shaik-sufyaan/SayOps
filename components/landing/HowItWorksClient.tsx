"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { IconBrandGoogle } from "@tabler/icons-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { landingContent } from "@/lib/landing-content"
import EvaOnboardingDemo from "@/components/landing/EvaOnboardingDemo"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export default function HowItWorksClient() {
  const { signInWithGoogle, loading } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const topSectionBackground = "linear-gradient(180deg, #ece6f4 0%, #e4ddef 52%, #ddd5e8 100%)"
  const stepsSectionBackground = "linear-gradient(180deg, #f8f4ec 0%, #f3eee5 48%, #ede6da 100%)"

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
      window.location.href = "/dashboard"
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        console.error(err?.message)
      }
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111827]">
      {/* Nav */}
      <header className="relative z-20" style={{ background: topSectionBackground }}>
        <div className="flex items-center justify-between px-6 py-4 md:px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2 text-[15px] text-[#5f6670] transition-colors hover:text-[#111827]">
            <ArrowLeft className="size-4" />
            Back to SpeakOps
          </Link>
          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="rounded-full bg-[#7c6ff7] px-5 text-sm text-white hover:bg-[#6b5fd6]"
          >
            <IconBrandGoogle className="size-4" />
            <span className="hidden sm:inline">{signingIn ? "Signing in..." : "Get started free"}</span>
          </Button>
        </div>
      </header>

      <main>
        {/* EVA Onboarding Demo — dark section */}
        <section className="relative w-full overflow-hidden px-6 py-16 md:px-10 md:py-20 lg:px-16" style={{ background: topSectionBackground }}>
          {/* Subtle purple glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(124,111,247,0.18) 0%, transparent 70%)' }} />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8190]">Live demo</p>
              <h2 className="mt-3 font-playfair text-3xl font-semibold text-[#0f172a] md:text-[2.4rem]">
                Watch EVA onboard a business in real time
              </h2>
            </div>
            <EvaOnboardingDemo onJumpToSignup={handleGoogleSignIn} />
          </div>
        </section>

        {/* Step track — purple-tinted gradient */}
        <section className="relative overflow-hidden px-6 pb-16 pt-16 md:px-10 lg:px-16" style={{ background: stepsSectionBackground }}>
          {/* Radial glow */}
          <div className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.10) 0%, transparent 65%)' }} />

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9aa0a8]">Setup guide</p>
              <h2 className="mt-3 font-playfair text-4xl font-bold leading-tight text-[#0f172a] md:text-[3.2rem]">
                One call.{" "}
                <em className="italic text-[#7c6ff7]">Your agent is live.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5f6670]">
                EVA walks you through everything over the phone — workspace claim, agent setup, and number provisioning. No dashboard required to get started.
              </p>
            </div>
            <div>
              {landingContent.steps.map((item, index) => (
                <div
                  key={item.step}
                  className="group grid border-t border-[#0f172a]/8 py-8 transition-colors duration-200 hover:bg-white/40 md:grid-cols-[100px_1fr] md:gap-10 md:py-10 md:rounded-2xl md:px-4 md:-mx-4"
                >
                  <div className="mb-3 md:mb-0">
                    <span className="font-playfair text-[4rem] font-bold leading-none tracking-tight text-[#7c6ff7]/10 transition-colors duration-300 group-hover:text-[#7c6ff7]/25 md:text-[5rem]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-semibold text-[#0f172a] transition-colors duration-200 group-hover:text-[#7c6ff7]">{item.title}</h3>
                    <p className="mt-2 max-w-lg text-base leading-7 text-[#5f6670]">{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-[#0f172a]/8" />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

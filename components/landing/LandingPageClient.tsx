"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Phone } from "lucide-react"
import { IconBrandGoogle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { landingContent } from "@/lib/landing-content"
import PhoneDemoShowcase from "@/components/landing/PhoneDemoShowcase"
import TwoPhoneCapabilitiesDemo from "@/components/landing/TwoPhoneCapabilitiesDemo"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import Grainient from "@/components/Grainient"

type SectionCardProps = {
  title: string
  description: string
  badge?: string
  accent?: string
}

function SectionCard({ title, description, badge, accent }: SectionCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-[22px] border border-white/70 bg-white/[0.05] px-6 py-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.18),0_18px_44px_-22px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/90 hover:bg-white/[0.08] hover:shadow-[0_10px_36px_-8px_rgba(124,111,247,0.16),0_24px_56px_-24px_rgba(15,23,42,0.34)]"
    >
      {accent && (
        <div
          className="absolute left-0 top-0 h-full w-[3px] rounded-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundColor: accent }}
        />
      )}
      {badge ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">{badge}</p>
      ) : null}
      <h3 className="text-base font-semibold tracking-tight text-white md:text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/[0.78]">{description}</p>
    </article>
  )
}

const capabilityAccents = ["#7c6ff7", "#d97706", "#059669", "#dc2626", "#0891b2", "#be185d"]

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null)
  return (
    <div className="border-b border-[#0f172a]/8">
      <button
        type="button"
        onClick={onToggle}
        className="group/faq flex w-full items-center justify-between gap-6 py-6 text-left transition-colors"
      >
        <span className="text-[15px] font-medium text-[#0f172a] transition-colors duration-200 group-hover/faq:text-[#7c6ff7] md:text-base">{question}</span>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#0f172a]/10 text-[#0f172a] transition-all duration-200 group-hover/faq:border-[#7c6ff7]/30 group-hover/faq:bg-[#7c6ff7]/5 group-hover/faq:text-[#7c6ff7]">
          {isOpen ? (
            <svg width="12" height="2" viewBox="0 0 12 2" fill="none"><rect width="12" height="2" rx="1" fill="currentColor"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="5" width="2" height="12" rx="1" fill="currentColor"/><rect y="5" width="12" height="2" rx="1" fill="currentColor"/></svg>
          )}
        </span>
      </button>
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 400) : 0 }}
      >
        <p className="pb-6 text-sm leading-7 text-[#5f6670] md:text-[15px]">{answer}</p>
      </div>
    </div>
  )
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <section className="relative w-full overflow-hidden px-6 pb-24 pt-16 md:px-10 md:pb-28 md:pt-20 lg:px-16" style={{ background: 'linear-gradient(180deg, #ece6f4 0%, #e4ddef 50%, #ddd5e8 100%)' }}>
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%)' }} />
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 font-playfair text-[2rem] font-semibold tracking-tight text-[#0f172a] md:text-[2.4rem]">
          FAQs
        </h2>
        {landingContent.faqs.map((item, i) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  )
}

export default function LandingPageClient() {
  const { user, loading, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState("")
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistName, setWaitlistName] = useState("")
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistConsent, setWaitlistConsent] = useState(false)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistError, setWaitlistError] = useState("")

  useEffect(() => {
    if (!loading && user) {
      const search = window.location.search
      window.location.href = `/dashboard${search}`
    }
  }, [loading, user])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError("")

    try {
      await signInWithGoogle()
      const search = window.location.search
      window.location.href = `/dashboard${search}`
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Sign in failed")
      }
    } finally {
      setSigningIn(false)
    }
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWaitlistSubmitting(true)
    setWaitlistError("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail }),
      })
      if (!res.ok) throw new Error("Something went wrong")
      setWaitlistSuccess(true)
    } catch (err: any) {
      setWaitlistError(err.message || "Failed to join waitlist")
    } finally {
      setWaitlistSubmitting(false)
    }
  }

  const scrollToDemo = () => {
    document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111827]">
      <main>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative flex min-h-screen w-full items-center overflow-hidden px-6 pb-10 pt-24 md:px-10 md:pb-14 md:pt-28 lg:px-16 lg:pb-20 lg:pt-32">
          {/* Grainient background */}
          <div className="absolute inset-0">
            <Grainient
              color1="#F8D9FF"
              color2="#6B4CFF"
              color3="#C9BCF3"
              timeSpeed={0.25}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.06}
              grainScale={2}
              grainAnimated={false}
              contrast={1.3}
              gamma={1}
              saturation={0.92}
              centerX={0}
              centerY={0}
              zoom={1}
            />
          </div>

          {/* Softer overlay so the gradient breathes */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(220,213,234,0.62)_0%,rgba(210,203,226,0.70)_100%)]" />

          {/* Nav */}
          <header className="absolute inset-x-0 top-0 z-20">
            <div className="relative flex w-full items-center justify-between px-6 py-5 md:px-10 lg:px-16">
              <Link href="/" className="text-xl font-semibold tracking-tight text-[#111827]">
                SpeakOps
              </Link>

              <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[15px] text-[#1f2937] md:flex">
                <button type="button" onClick={scrollToDemo} className="transition-colors hover:text-[#111827]">
                  Demo
                </button>
                <Link href="/how-it-works" className="transition-colors hover:text-[#111827]">
                  How it works
                </Link>
                <Link href="/book" className="transition-colors hover:text-[#111827]">
                  Book a Call
                </Link>
              </nav>

              <Button
                onClick={handleGoogleSignIn}
                disabled={signingIn || loading}
                className="rounded-full bg-[#111827] px-4 text-sm text-white hover:bg-[#1f2937] sm:px-5"
              >
                <IconBrandGoogle className="size-4" />
                <span className="hidden sm:inline">{signingIn ? "Signing in..." : landingContent.hero.primaryCta}</span>
                <span className="sm:hidden">{signingIn ? "..." : "Sign in"}</span>
              </Button>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-1.5 text-xs font-medium text-[#6b7280] shadow-[0_4px_16px_-8px_rgba(15,23,42,0.16)] backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7c6ff7]" />
              {landingContent.eyebrow}
            </div>

            <h1
              style={{
                fontSize: "clamp(2.1rem, 5.6vw, 76px)",
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
              }}
              className="mt-6 mx-auto max-w-[22ch] text-balance font-playfair text-[#0f172a]"
            >
              {landingContent.hero.headline}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[#6b7280] md:text-xl md:leading-9">
              {landingContent.hero.subhead}
            </p>

            <div className="mt-8 flex w-full flex-col items-center gap-3">
              {/* Row 1: Google + Waitlist */}
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <div className="relative w-full sm:w-48">
                  <div className="hero-glow-clip">
                    <div className="hero-glow-bar" />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn || loading}
                    className="relative z-10 h-12 w-full rounded-full bg-[#0f172a] px-7 text-sm font-semibold text-white hover:bg-[#1e293b]"
                  >
                    <IconBrandGoogle className="size-4" />
                    {signingIn ? "Signing in..." : landingContent.hero.primaryCta}
                  </Button>
                </div>
                <div className="relative w-full sm:w-48">
                  <div className="hero-glow-clip">
                    <div className="hero-glow-bar" />
                  </div>
                  <Button
                    size="lg"
                    onClick={() => { setWaitlistOpen(true); setWaitlistSuccess(false) }}
                    className="relative z-10 h-12 w-full rounded-full bg-[#0f172a] px-7 text-sm font-semibold text-white hover:bg-[#1e293b]"
                  >
                    Join Waitlist
                  </Button>
                </div>
              </div>
              {/* Row 2: Book a Call centered */}
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-black/12 bg-white/80 px-7 text-sm font-medium text-[#111827] backdrop-blur-sm hover:bg-white hover:text-[#111827]"
              >
                <Link href="/book">
                  Book a Call
                  <Phone className="size-4" />
                </Link>
              </Button>
            </div>

            {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}

            {/* Proof metrics */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {landingContent.proof.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <span className="font-playfair text-2xl font-semibold text-[#0f172a]">{item.value}</span>
                  <span className="text-xs text-[#8a9098]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Demo ─────────────────────────────────────────────────── */}
        <section id="live-demo" className="w-full px-6 pb-14 pt-16 md:px-10 md:pt-20 lg:px-16" style={{ background: 'linear-gradient(180deg, #ece6f4 0%, #e4ddef 52%, #ddd5e8 100%)' }}>
          <PhoneDemoShowcase onJumpToSignup={handleGoogleSignIn} />
        </section>

        {/* ── Capabilities ─────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden px-6 py-14 md:px-10 md:py-20 lg:px-16" style={{ background: 'linear-gradient(180deg, #221b46 0%, #191336 48%, #140f2b 100%)' }}>
          {/* Radial glow behind cards */}
          <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[900px] rounded-full opacity-50" style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.18) 0%, transparent 65%)' }} />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Core capabilities
            </p>
            <h2 className="mt-3 font-playfair text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-tight">
              What happens during the call
            </h2>
            <p className="mt-4 text-base leading-7 text-white/[0.62]">
              Every interaction is handled end-to-end — from context retrieval to action to summary.
            </p>
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {landingContent.capabilities.map((item, i) => (
              <SectionCard
                key={item.title}
                title={item.title}
                description={item.description}
                accent={capabilityAccents[i % capabilityAccents.length]}
              />
            ))}
          </div>
        </section>

        {/* ── Two-Phone Capabilities Demo ────────────────────────── */}
        <section className="relative w-full overflow-hidden px-6 py-16 md:px-10 md:py-24 lg:px-16" style={{ background: 'linear-gradient(180deg, #ece6f4 0%, #e4ddef 50%, #ddd5e8 100%)' }}>
          <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(124,111,247,0.15) 0%, transparent 65%)' }} />
          <div className="relative mx-auto max-w-6xl">
            <TwoPhoneCapabilitiesDemo />
          </div>
        </section>

        {/* ── Security ─────────────────────── CARD GRID */}
        <section id="security" className="relative w-full overflow-hidden px-6 py-16 md:px-10 md:py-24 lg:px-16" style={{ background: 'linear-gradient(180deg, #1a1535 0%, #110e24 50%, #0d0a1a 100%)' }}>
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(124,111,247,0.20) 0%, transparent 65%)' }} />
          <div className="pointer-events-none absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)' }} />

          <div className="relative mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/30">
                Security and control
              </p>
              <h2 className="mt-3 font-playfair text-3xl font-semibold tracking-tight text-white md:text-[2.6rem] md:leading-tight">
                Your agent does exactly<br className="hidden md:block" /> what you{" "}
                <em className="italic text-[#a78bfa]">allow.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/50">
                Permissions, escalation, and transparent execution are built into every call — not hidden behind settings.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {landingContent.security.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-[22px] border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/16 hover:bg-white/[0.06]"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-7 text-white/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <FaqSection />

      </main>

      <MarketingFooter />

      {/* Waitlist Modal */}
      <Dialog
        open={waitlistOpen}
        onOpenChange={(open) => {
          setWaitlistOpen(open)
          if (!open) {
            setWaitlistSuccess(false)
            setWaitlistName("")
            setWaitlistEmail("")
            setWaitlistConsent(false)
            setWaitlistError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Waitlist</DialogTitle>
            <DialogDescription>Be the first to know when SpeakOps is ready for you.</DialogDescription>
          </DialogHeader>
          {waitlistSuccess ? (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-[#0f172a]">You're on the list!</p>
              <p className="mt-2 text-sm text-[#6b7280]">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-2">
              <input
                type="text"
                placeholder="Your name"
                required
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none focus:border-[#7c6ff7] focus:ring-2 focus:ring-[#7c6ff7]/20"
              />
              <input
                type="email"
                placeholder="Email address"
                required
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                className="w-full rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm outline-none focus:border-[#7c6ff7] focus:ring-2 focus:ring-[#7c6ff7]/20"
              />
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  required
                  checked={waitlistConsent}
                  onChange={(e) => setWaitlistConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#7c6ff7]"
                />
                <span className="text-xs leading-relaxed text-[#6b7280]">
                  I agree to receive product updates and news from SpeakOps by email. You can unsubscribe anytime.
                </span>
              </label>
              {waitlistError && <p className="text-sm text-[#dc2626]">{waitlistError}</p>}
              <Button
                type="submit"
                disabled={waitlistSubmitting}
                className="w-full rounded-full bg-[#0f172a] text-white hover:bg-[#1e293b]"
              >
                {waitlistSubmitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

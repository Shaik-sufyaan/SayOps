"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { IconBrandGoogle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { landingContent } from "@/lib/landing-content"
import PhoneDemoShowcase from "@/components/landing/PhoneDemoShowcase"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import Grainient from "@/components/Grainient"

type SectionCardProps = {
  title: string
  description: string
  badge?: string
}

function SectionCard({ title, description, badge }: SectionCardProps) {
  return (
    <article className="rounded-[26px] bg-white px-5 py-5 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.28)]">
      {badge ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9aa0a8]">
          {badge}
        </p>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-[#111827]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5f6670]">{description}</p>
    </article>
  )
}

export default function LandingPageClient() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && user) {
      const search = typeof window !== "undefined" ? window.location.search : ""
      router.push(`/dashboard${search}`)
    }
  }, [loading, router, user])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError("")

    try {
      await signInWithGoogle()
      const search = typeof window !== "undefined" ? window.location.search : ""
      router.push(`/dashboard${search}`)
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Sign in failed")
      }
    } finally {
      setSigningIn(false)
    }
  }

  const scrollToDemo = () => {
    document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#111827]">
      <main>
        <section className="relative flex min-h-screen w-full items-center overflow-hidden px-6 pb-10 pt-24 md:px-10 md:pb-14 md:pt-28 lg:px-16 lg:pb-16 lg:pt-32">
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(228,224,236,0.74)_0%,rgba(220,214,232,0.82)_100%)]" />
          <header className="absolute inset-x-0 top-0 z-20">
            <div className="relative flex w-full items-center justify-between pl-6 pr-4 py-4 md:pl-10 md:pr-6 lg:pl-16 lg:pr-8">
              <Link href="/" className="text-xl font-semibold tracking-tight text-[#111827]">
                SpeakOps
              </Link>

              <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-base text-[#1f2937] md:flex">
                <button type="button" onClick={scrollToDemo} className="transition hover:text-[#111827]">
                  Demo
                </button>
                <a href="#how-it-works" className="transition hover:text-[#111827]">
                  How it works
                </a>
                <a href="#security" className="transition hover:text-[#111827]">
                  Security
                </a>
              </div>

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
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-black/8 bg-white px-3.5 py-1 text-xs font-medium text-[#6b7280] shadow-sm">
              {landingContent.eyebrow}
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5.4vw, 72px)",
                fontWeight: 600,
                fontStyle: "normal",
                lineHeight: 1.15,
              }}
              className="mt-5 mx-auto max-w-[20ch] text-balance font-playfair"
            >
              {landingContent.hero.headline}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6b7280] md:text-xl md:leading-9">
              {landingContent.hero.subhead}
            </p>

            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={signingIn || loading}
                className="h-11 w-full rounded-full bg-[#111827] px-6 text-sm text-white hover:bg-[#1f2937] sm:w-auto"
              >
                <IconBrandGoogle className="size-4" />
                {signingIn ? "Signing in..." : landingContent.hero.primaryCta}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToDemo}
                className="h-11 w-full rounded-full border-black/10 bg-white px-6 text-sm text-[#111827] hover:bg-[#f3f4f6] sm:w-auto"
              >
                {landingContent.hero.secondaryCta}
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {error ? <p className="mt-3 text-sm text-[#dc2626]">{error}</p> : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[#6b7280]">
              {landingContent.proof.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#111827]">{item.value}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        <section className="w-full bg-[#efe7db] px-6 pb-10 pt-16 md:px-10 md:pt-20 lg:px-16">
          <PhoneDemoShowcase onJumpToSignup={handleGoogleSignIn} />
        </section>

        <section className="w-full bg-[#fbfaf7] px-6 py-10 md:px-10 md:py-14 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a9098]">
              Core capabilities
            </p>
            <h2 className="mt-3 font-playfair text-2xl font-semibold tracking-tight text-[#111827] md:text-4xl">
              What is happening during the call
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5f6670]">
              The landing page should not rely on promises alone. The product behavior should already feel visible from the demo.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {landingContent.capabilities.map((item) => (
              <SectionCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </section>

        <section id="how-it-works" className="w-full bg-[#efe7db] px-6 py-10 md:px-10 md:py-14 lg:px-16">
          <div className="grid w-full gap-8 lg:grid-cols-[1fr_1fr] lg:gap-10">
            <div className="flex flex-col items-start text-left">
              <h2 className="font-playfair text-3xl font-semibold leading-tight tracking-tight text-[#111827] md:text-5xl lg:whitespace-nowrap">
                Short setup, visible result
              </h2>
              <p className="mt-6 max-w-[34rem] text-base leading-8 text-[#5f6670] md:text-[1.45rem] md:leading-[1.5]">
                The flow from sign-in to live support stays deliberately short, so the demo feels like the product itself rather than a concept.
              </p>
            </div>

            <div className="border-y border-black/10">
              {landingContent.steps.map((item, index) => (
                <div
                  key={item.step}
                  className="grid grid-cols-[48px_1fr] gap-4 border-b border-black/10 py-4 last:border-b-0 md:grid-cols-[58px_1fr] md:gap-5 md:py-5"
                >
                  <span className="font-playfair text-4xl leading-none text-black/15 md:text-5xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="pt-1 text-base leading-7 text-[#1f2937] md:text-[1.15rem] md:leading-[1.45]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="w-full bg-[#fbfaf7] px-6 py-10 md:px-10 md:py-14 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a9098]">
                Security and control
              </p>
              <h2 className="mt-3 font-playfair text-2xl font-semibold tracking-tight text-[#111827] md:text-4xl">
                Trust comes from visible constraints
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5f6670]">
                A believable operator is still a bounded one. Permissions, escalation, and clear execution are part of the product, not hidden details.
              </p>
            </div>

            <div className="grid gap-4">
              {landingContent.security.map((item) => (
                <SectionCard key={item.title} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </section>

        <section className="w-full bg-[#efe7db] px-6 pb-24 pt-10 md:px-10 lg:px-16">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a9098]">
                FAQ
              </p>
              <h2 className="mt-3 font-playfair text-2xl font-semibold tracking-tight text-[#111827] md:text-4xl">
                Practical questions before going live
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5f6670]">
                The demo should do most of the explaining. These are the short answers that remain.
              </p>
            </div>

            <div className="space-y-4">
              {landingContent.faqs.map((item) => (
                <SectionCard key={item.question} title={item.question} description={item.answer} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

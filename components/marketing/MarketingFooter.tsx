"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

export default function MarketingFooter() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const handleWaitlist = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong")
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer className="border-t border-white/6 bg-[#0a0908] text-[#8a9098]">
      <div className="grid w-full grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4 md:gap-10 md:px-10 md:py-14 lg:px-16">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-lg font-semibold tracking-tight text-white">SpeakOps</h3>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/40">
            By <strong className="font-semibold text-white/60">0 Lumen Labs</strong>. AI customer support for SMBs and solopreneurs. Setup in five minutes, under ten clicks.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Company</h4>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/about" className="transition hover:text-white">About</Link>
            <Link href="/careers" className="transition hover:text-white">Careers</Link>
            <Link href="/press" className="transition hover:text-white">Press</Link>
            <Link href="/book" className="transition hover:text-white">Book a Call</Link>
          </nav>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Legal</h4>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/security" className="transition hover:text-white">Security</Link>
          </nav>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Get in touch</h4>

          {done ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-white">You&apos;re on the list.</p>
              <p className="mt-1 text-xs text-white/40">We&apos;ll reach out when we&apos;re ready for you.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="mt-4 space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7c6ff7]/40 focus:bg-white/8 transition-colors"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#7c6ff7]/40 focus:bg-white/8 transition-colors"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="h-9 w-full rounded-lg bg-[#7c6ff7] px-3 text-sm font-medium text-white transition hover:bg-[#6b5fd6] disabled:opacity-60"
              >
                {submitting ? "Joining..." : "Join Waitlist"}
              </button>
            </form>
          )}

        </div>
      </div>

      <div className="border-t border-white/6 px-6 py-5 md:px-10 lg:px-16">
        <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} SpeakOps. All rights reserved.</p>
      </div>
    </footer>
  )
}

"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"

export default function MarketingFooter() {
  const [email, setEmail] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const recipient = "eva@0lumens.com"
    const subject = encodeURIComponent("SpeakOps updates")
    const body = encodeURIComponent(email ? `Subscribe this email: ${email}` : "Subscribe me to SpeakOps updates.")
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`
  }

  return (
    <footer className="border-t border-black/10 bg-[linear-gradient(180deg,#d9d3e5_0%,#cbc0dc_100%)] text-[#3f4752]">
      <div className="grid w-full grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4 md:gap-10 md:px-10 md:py-14 lg:px-16">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-lg font-semibold tracking-tight text-[#111827]">SpeakOps</h3>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#4b5563]">
            By <strong className="font-semibold text-[#111827]">0 Lumen Labs</strong>. AI customer support for SMBs and solopreneurs. Setup in five minutes, under ten clicks. Focus on work; we recover lost customers and revenue.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111827]">Company</h4>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/about" className="transition hover:text-[#111827]">
              About
            </Link>
            <Link href="/careers" className="transition hover:text-[#111827]">
              Careers
            </Link>
            <Link href="/press" className="transition hover:text-[#111827]">
              Press
            </Link>
          </nav>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111827]">Legal</h4>
          <nav className="mt-4 flex flex-col gap-3 text-sm">
            <Link href="/privacy" className="transition hover:text-[#111827]">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-[#111827]">
              Terms
            </Link>
            <Link href="/security" className="transition hover:text-[#111827]">
              Security
            </Link>
          </nav>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111827]">Contact</h4>
          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder=""
              aria-label="Email address"
              className="h-10 min-w-0 flex-1 rounded-md border border-black/10 bg-[#f4f0fa] px-3 text-sm text-[#111827] outline-none placeholder:text-[#8b93a1] focus:border-black/20"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-[#111827] px-3 text-sm font-medium text-white transition hover:bg-[#1f2937]"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-sm text-[#8f96a3]">or</p>
          <p className="mt-3 text-sm">
            <a href="mailto:eva@0lumens.com" className="font-medium text-[#111827] transition hover:text-[#374151]">
              eva@0lumens.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

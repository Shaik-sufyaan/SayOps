"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { format, startOfToday } from "date-fns"
import { DayPicker } from "react-day-picker"

const TIME_SLOTS = [
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
]

const BULLETS = [
  "How your AI agent answers every call, 24/7",
  "Live walkthrough of booking, FAQs, and escalations",
  "How to go live in under 5 minutes",
  "Pricing and what's right for your business",
]

const STATS = [
  { value: "24/7",  label: "call coverage" },
  { value: "5 min", label: "to go live" },
  { value: "30+",   label: "languages" },
]

const calendarStyles = `
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .bk-cal { width: 100%; }
  .bk-cal .rdp-months { display: flex; }
  .bk-cal .rdp-month { width: 100%; }
  .bk-cal .rdp-month_caption {
    display: flex; align-items: center; justify-content: center;
    position: relative; height: 2rem; margin-bottom: 0.25rem;
  }
  .bk-cal .rdp-caption_label {
    font-size: 0.875rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;
  }
  .bk-cal .rdp-nav {
    position: absolute; inset: 0; display: flex; justify-content: space-between; align-items: center;
  }
  .bk-cal .rdp-button_previous,
  .bk-cal .rdp-button_next {
    display: flex; align-items: center; justify-content: center;
    width: 1.75rem; height: 1.75rem; border-radius: 50%;
    color: #374151 !important; background: transparent; border: none; cursor: pointer;
    transition: background 0.15s;
  }
  .bk-cal .rdp-button_previous:hover,
  .bk-cal .rdp-button_next:hover { background: rgba(124,111,247,0.08); }
  .bk-cal .rdp-weekdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 0.2rem; }
  .bk-cal .rdp-weekday {
    text-align: center; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; color: #9aa0a8; padding: 0.2rem 0;
  }
  .bk-cal .rdp-month_grid { width: 100%; }
  .bk-cal .rdp-week { display: grid; grid-template-columns: repeat(7,1fr); gap: 1px 0; }
  .bk-cal .rdp-day { display: flex; align-items: center; justify-content: center; }
  .bk-cal .rdp-day_button {
    width: 2rem; height: 2rem; border-radius: 50%; border: none;
    font-size: 0.8125rem; font-weight: 500; color: #1f2937 !important;
    background: transparent; cursor: pointer; transition: all 0.12s;
    display: flex; align-items: center; justify-content: center;
  }
  .bk-cal .rdp-day_button:hover:not(:disabled) { background: rgba(124,111,247,0.08); }
  .bk-cal .rdp-selected .rdp-day_button {
    background: #7c6ff7 !important; color: #fff !important; font-weight: 700;
  }
  .bk-cal .rdp-today .rdp-day_button { font-weight: 800; color: #7c6ff7 !important; }
  .bk-cal .rdp-selected.rdp-today .rdp-day_button { color: #fff !important; }
  .bk-cal .rdp-outside { opacity: 0; pointer-events: none; }
  .bk-cal .rdp-disabled { opacity: 0.22; pointer-events: none; }
`

export default function BookingPageClient() {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const step1Valid = name.trim() && email.trim()
  const canSubmit = step1Valid && date && time && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          date: format(date!, "EEEE, MMMM d, yyyy"),
          time,
        }),
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

  /* ── Confirmation ─────────────────────────────────────────────── */
  if (done) {
    return (
      <div className="relative flex h-dvh items-center justify-center overflow-hidden px-6" style={{ background: 'linear-gradient(180deg, #f6f4ef 0%, #ece6f4 100%)' }}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.15) 0%, transparent 70%)' }} />
        <div className="relative w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#7c6ff7] shadow-[0_8px_24px_-6px_rgba(124,111,247,0.4)]">
            <Check className="size-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-[#0f172a]">You&apos;re booked.</h2>
          <p className="mt-4 text-sm leading-7 text-[#5f6670]">
            <span className="font-semibold text-[#0f172a]">{format(date!, "EEEE, MMMM d")}</span> at{" "}
            <span className="font-semibold text-[#0f172a]">{time}</span>.<br />
            Confirmation sent to <span className="font-semibold text-[#0f172a]">{email}</span>.
          </p>
          <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-[#9aa0a8] transition-colors hover:text-[#7c6ff7]">
            <ArrowLeft className="size-3.5" /> Back to SpeakOps
          </Link>
        </div>
      </div>
    )
  }

  /* ── Main layout ──────────────────────────────────────────────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />

      <div className="flex h-dvh flex-col overflow-hidden">

        {/* Nav */}
        <header className="shrink-0 border-b border-black/6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center px-6 py-3">
            <Link href="/" className="flex items-center gap-2 text-sm text-[#6b7280] transition-colors hover:text-[#0f172a]">
              <ArrowLeft className="size-4" />
              <span className="font-medium">SpeakOps</span>
            </Link>
          </div>
        </header>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">

          {/* ── LEFT: form panel ── */}
          <div className="relative flex w-full flex-1 flex-col justify-center overflow-y-auto hide-scrollbar bg-white px-8 py-10 md:w-1/2 lg:px-14 xl:px-20">
            {/* Subtle corner glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full opacity-25 md:opacity-35" style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.15) 0%, transparent 70%)' }} />

            {/* Step dots */}
            <div className="relative mb-5 flex items-center gap-2">
              <button type="button" onClick={() => step === 2 && setStep(1)} aria-label="Step 1">
                <span className={`block h-1.5 w-1.5 rounded-full transition-colors ${step === 1 ? "bg-[#7c6ff7]" : "bg-[#d1d5db]"}`} />
              </button>
              <span className="h-px w-6 bg-[#e5e7eb]" />
              <span className={`block h-1.5 w-1.5 rounded-full transition-colors ${step === 2 ? "bg-[#7c6ff7]" : "bg-[#d1d5db]"}`} />
            </div>

            <div className="relative w-full">

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-[#0f172a]">SpeakOps Intro Call</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                    Book a demo to see how SpeakOps answers every call, takes actions, and keeps you updated.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a8]">
                        Full name <span className="text-[#dc2626]">*</span>
                      </label>
                      <input
                        type="text" required value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 text-sm text-[#0f172a] outline-none placeholder:text-[#d1d5db] focus:border-[#7c6ff7]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,111,247,0.08)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a8]">
                        Email address <span className="text-[#dc2626]">*</span>
                      </label>
                      <input
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 text-sm text-[#0f172a] outline-none placeholder:text-[#d1d5db] focus:border-[#7c6ff7]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,111,247,0.08)] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!step1Valid}
                    onClick={() => step1Valid && setStep(2)}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(15,23,42,0.3)] transition-all hover:bg-[#1e293b] hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                  >
                    Continue <ArrowRight className="size-4" />
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <div className="bk-cal">
                    <DayPicker
                      mode="single" selected={date} onSelect={setDate}
                      disabled={{ before: startOfToday() }}
                      showOutsideDays={false}
                    />
                  </div>

                  {date && (
                    <p className="mb-2 text-[11px] font-medium text-[#7c6ff7]">
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}

                  <div className="border-t border-[#f1f1f1] pt-3">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a8]">
                      Select a time · EST
                    </p>
                    <div className="relative z-10 grid grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const sel = time === slot
                        return (
                          <button
                            key={slot} type="button" onClick={() => setTime(slot)}
                            className={`rounded-lg border py-2 text-[11px] font-semibold transition-all ${
                              sel
                                ? "border-[#7c6ff7] bg-[#7c6ff7] text-white shadow-[0_4px_12px_-3px_rgba(124,111,247,0.35)]"
                                : "border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:border-[#7c6ff7]/30 hover:bg-[#7c6ff7]/[0.04]"
                            }`}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {error && <p className="mt-3 text-sm text-[#dc2626]">{error}</p>}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(15,23,42,0.3)] transition-all hover:bg-[#1e293b] hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.4)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                  >
                    {submitting ? "Confirming..." : "Confirm booking"}
                    {!submitting && <Check className="size-4" />}
                  </button>

                  {canSubmit && (
                    <p className="mt-2 text-center text-[10px] text-[#9aa0a8]">
                      {format(date!, "MMM d")} · {time} · 30 min
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* ── RIGHT: copy panel ── purple-tinted gradient */}
          <div className="relative flex w-full flex-1 flex-col justify-center overflow-y-auto hide-scrollbar px-8 py-10 md:w-1/2 lg:px-14 xl:px-20" style={{ background: 'linear-gradient(135deg, #f6f4ef 0%, #f0ecf7 40%, #ece6f4 100%)' }}>
            {/* Radial glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.12) 0%, transparent 70%)' }} />

            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9aa0a8]">SpeakOps Demo</p>
              <h1 className="mt-3 font-playfair text-4xl font-bold leading-[1.15] text-[#0f172a] lg:text-5xl">
                See SpeakOps<br />in action.
              </h1>
              <p className="mt-4 text-sm leading-6 text-[#5f6670]">
                Schedule a one-on-one demo and see exactly how your AI call agent handles real customer conversations.
              </p>

              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#0f172a]">
                On your demo you will learn:
              </p>
              <ul className="mt-3 space-y-3">
                {BULLETS.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-[#374151]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#7c6ff7] shadow-[0_2px_8px_-2px_rgba(124,111,247,0.4)]">
                      <Check className="size-2.5 text-white" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/60 bg-white/50 px-5 py-3.5 text-center shadow-[0_2px_16px_-6px_rgba(124,111,247,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_-6px_rgba(124,111,247,0.16)]">
                    <p className="font-playfair text-2xl font-bold text-[#0f172a]">{s.value}</p>
                    <p className="mt-0.5 text-[10px] text-[#5f6670]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}

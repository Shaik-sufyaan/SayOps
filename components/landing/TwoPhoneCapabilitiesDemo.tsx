"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ArrowRight,
  Brain,
  Calendar,
  Check,
  CreditCard,
  Pause,
  Phone,
  PhoneForwarded,
  Play,
  RotateCcw,
} from "lucide-react"
import { demoSpeedOptions, landingContent, twoPhoneDemo } from "@/lib/landing-content"

const speakerTone = {
  agent: {
    label: "AI agent",
    textClassName: "text-[#0f766e]",
    bubbleClassName: "bg-[#e6faf7] text-[#0f766e]",
    waveColor: "#15b8a6",
  },
  customer: {
    label: "Customer",
    textClassName: "text-[#1d4ed8]",
    bubbleClassName: "bg-[#edf4ff] text-[#1d4ed8]",
    waveColor: "#4f8cff",
  },
} as const

function estimateDuration(text: string, wps: number): number {
  const words = text.trim().split(/\s+/).length
  const base = (words / wps) * 1000
  const short = (text.match(/[,;:]/g) ?? []).length
  const long = (text.match(/[.!?]/g) ?? []).length
  return base + short * 120 + long * 180
}

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

function BatteryIcon({ level, light = false }: { level: number; light?: boolean }) {
  const charge = Math.max(0, Math.min(level, 100))
  const fillWidth = Math.max(2.2, Math.round((charge / 100) * 17))
  const fillColor = charge < 30 ? "#c98a3d" : light ? "#ffffff" : "#000000"

  return (
    <svg
      aria-hidden="true"
      className="h-[13px] w-[26px]"
      viewBox="0 0 26 13"
      fill="none"
    >
      <rect x="0.9" y="1" width="21.8" height="11" rx="3.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="24" y="4.05" width="1.6" height="4.9" rx="0.8" fill="currentColor" opacity="0.45" />
      <rect x="3" y="3.1" width={fillWidth} height="6.8" rx="2" fill={fillColor} />
    </svg>
  )
}

function StatusCluster({
  light = false,
  batteryLevel = 100,
}: {
  light?: boolean
  batteryLevel?: number
}) {
  return (
    <div className={`flex items-center gap-[4px] ${light ? "text-white" : "text-[#111827]"}`}>
      <svg aria-hidden="true" className="h-[13px] w-[21px]" viewBox="0 0 21 13" fill="none">
        <rect x="0.6" y="7.2" width="3.2" height="5.2" rx="1.1" fill="currentColor" />
        <rect x="5.8" y="5.4" width="3.2" height="7" rx="1.1" fill="currentColor" />
        <rect x="11" y="3.1" width="3.2" height="9.3" rx="1.1" fill="currentColor" />
        <rect x="16.2" y="0.8" width="3.2" height="11.6" rx="1.1" fill="currentColor" />
      </svg>
      <svg
        aria-hidden="true"
        className="h-[13px] w-[17px]"
        viewBox="0 0 17 13"
        fill="currentColor"
      >
        <path d="M8.5 1.2c2.6 0 5.08.92 7.08 2.6l-1.55 1.64C12.48 4.13 10.58 3.4 8.5 3.4S4.52 4.13 2.97 5.44L1.42 3.8A10.47 10.47 0 0 1 8.5 1.2Z" />
        <path d="M8.5 5.55c1.67 0 3.2.58 4.45 1.6l-1.6 1.7A4.21 4.21 0 0 0 8.5 7.8c-1.08 0-2.07.39-2.85 1.05l-1.6-1.7a6.89 6.89 0 0 1 4.45-1.6Z" />
        <path d="M8.5 9.2c.82 0 1.55.27 2.12.74L8.5 12.2 6.38 9.94c.57-.47 1.3-.74 2.12-.74Z" />
      </svg>
      <BatteryIcon level={batteryLevel} light={light} />
    </div>
  )
}

function WaveformBars({
  active,
  barColor = "#7c6ff7",
  idleColor = "rgba(15,23,42,0.08)",
}: {
  active: boolean
  barColor?: string
  idleColor?: string
}) {
  const [heights, setHeights] = useState<number[]>(Array(28).fill(3))

  useEffect(() => {
    if (!active) {
      setHeights(Array(28).fill(3))
      return
    }

    const id = window.setInterval(() => {
      setHeights(Array.from({ length: 28 }, () => 3 + Math.random() * 16))
    }, 130)

    return () => window.clearInterval(id)
  }, [active])

  return (
    <div className="flex h-7 items-end justify-center gap-[2px] px-6">
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-[2px] rounded-full transition-all duration-[120ms]"
          style={{
            height,
            backgroundColor: active ? barColor : idleColor,
            opacity: active ? 0.85 : 1,
          }}
        />
      ))}
    </div>
  )
}

function PhoneShell({
  children,
  label,
  indicatorClassName = "bg-black/88",
}: {
  children: ReactNode
  label: string
  indicatorClassName?: string
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#5b6170]">
        {label}
      </p>
      <div className="rounded-[54px] bg-[linear-gradient(135deg,#d7dbe3_0%,#8d95a1_34%,#eef1f5_100%)] p-[2px] shadow-[0_44px_120px_-30px_rgba(15,23,42,0.56)]">
        <div className="rounded-[51px] bg-[linear-gradient(135deg,#020202_0%,#1d222a_42%,#090c10_100%)] p-[5.5px]">
          <div className="relative h-[644px] w-[322px] overflow-hidden rounded-[46px] bg-white">
            <div className="absolute left-1/2 top-2 z-30 h-7 w-[120px] -translate-x-1/2 rounded-full bg-black" />
            {children}
            <div
              className={`absolute bottom-1.5 left-1/2 z-30 h-[4px] w-[116px] -translate-x-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${indicatorClassName}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function MemoryCard() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in px-4 pt-4 duration-500">
      <div className="rounded-[28px] border border-[#dde2ea] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ede9fe]">
            <Brain className="size-[18px] text-[#7c3aed]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#111827]">Memory Found</p>
            <p className="text-[10px] text-[#6b7280]">Customer profile recalled</p>
          </div>
        </div>

        {([
          ["Customer", "Sarah"],
          ["Preference", "Afternoon appts"],
          ["Last visit", "Cleaning, 3 wks ago"],
        ] as const).map(([label, value], index) => (
          <div key={label}>
            {index > 0 && <div className="h-px bg-[#eef2f6]" />}
            <div className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-[#6b7280]">{label}</span>
              <span className="font-medium text-[#111827]">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalendarCard() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in px-4 pt-4 duration-500">
      <div className="overflow-hidden rounded-[28px] border border-[#dde2ea] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]">
        <div className="flex items-center gap-3 bg-[#f7f9ff] px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbeafe]">
            <Calendar className="size-4 text-[#2563eb]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#111827]">Appointment Updated</p>
            <p className="text-[10px] text-[#6b7280]">BrightPath Dental</p>
          </div>
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[10px] font-semibold text-[#15803d]">
            Updated
          </span>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-[#fef2f2] p-3 text-center">
              <p className="text-[9px] font-medium uppercase tracking-wider text-[#b91c1c]/55">Previous</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#dc2626] line-through">Wed 10:00 AM</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-[#9ca3af]" />
            <div className="flex-1 rounded-xl bg-[#ecfdf5] p-3 text-center">
              <p className="text-[9px] font-medium uppercase tracking-wider text-[#15803d]/60">New</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#15803d]">Thu 2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PaymentCard() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in px-4 pt-4 duration-500">
      <div className="overflow-hidden rounded-[28px] border border-[#dde2ea] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]">
        <div className="flex items-center gap-3 bg-[#f7f5ff] px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ede9fe]">
            <CreditCard className="size-4 text-[#7c3aed]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#111827]">Payment Link Sent</p>
            <p className="text-[10px] text-[#6b7280]">Secure payment via SMS</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[11px] text-[#6b7280]">Outstanding balance</span>
            <span className="text-2xl font-bold text-[#111827]">
              $85<span className="text-sm text-[#9ca3af]">.00</span>
            </span>
          </div>

          <div className="mb-4 space-y-2">
            {["Payment link created", "Sent via text message"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[11px]">
                <Check className="size-3 text-[#16a34a]" />
                <span className="text-[#667085]">{item}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#7c6ff7] py-2.5 text-center text-[13px] font-semibold text-white shadow-[0_8px_24px_-10px_rgba(124,111,247,0.55)]">
            Pay Now - $85.00
          </div>
        </div>
      </div>
    </div>
  )
}

function ForwardingCard({ forwarded }: { forwarded: boolean }) {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in px-4 pt-4 duration-500">
      <div className="overflow-hidden rounded-[28px] border border-[#fed7aa] bg-[linear-gradient(180deg,#fff7ed_0%,#fff1f2_100%)] shadow-[0_18px_40px_-28px_rgba(15,23,42,0.25)]">
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffedd5]">
            <PhoneForwarded className="size-4 text-[#d97706]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#111827]">
              {forwarded ? "Call Forwarded Successfully" : "Forwarding Call"}
            </p>
            <p className="text-[10px] text-[#b45309]">
              {forwarded ? "Office Manager is now on the line" : "Transferring to Office Manager"}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="rounded-xl border border-[#fed7aa] bg-white/85 p-4">
            <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9a3412]">
              Briefing Summary
            </p>
            <div className="space-y-1.5 text-[11px] text-[#7c2d12]">
              {[
                "Customer: Sarah",
                "Appointment -> Thu 2:00 PM",
                "Payment link sent: $85",
                "Requesting split payment",
              ].map((item) => (
                <div key={item} className="flex gap-2">
                  <span className="text-[#fb923c]">-</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {forwarded ? (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                <Check className="size-3" />
              </span>
              <span className="text-[11px] font-semibold text-[#15803d]">Call forwarded successfully</span>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" />
              <span className="text-[11px] font-medium text-[#b45309]">Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TwoPhoneCapabilitiesDemo() {
  const script = twoPhoneDemo.script

  const [phase, setPhase] = useState<"idle" | "ringing" | "active" | "ended">("idle")
  const [lineIndex, setLineIndex] = useState(-1)
  const [typedChars, setTypedChars] = useState(0)
  const [phone2State, setPhone2State] = useState(0)
  const [forwardingComplete, setForwardingComplete] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [speaker, setSpeaker] = useState<"agent" | "customer" | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [speedIdx, setSpeedIdx] = useState(1)

  const pauseRef = useRef(false)
  const abortRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef<number>(demoSpeedOptions[1].value)
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    pauseRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    speedRef.current = demoSpeedOptions[speedIdx].value
  }, [speedIdx])

  const waitMs = useCallback(async (ms: number) => {
    const end = Date.now() + ms

    while (Date.now() < end) {
      if (abortRef.current) return

      while (pauseRef.current && !abortRef.current) {
        await new Promise((resolve) => window.setTimeout(resolve, 80))
      }

      if (abortRef.current) return
      await new Promise((resolve) => window.setTimeout(resolve, Math.min(40, end - Date.now())))
    }
  }, [])

  useEffect(() => {
    if (phase !== "active") return

    const id = window.setInterval(() => {
      if (!pauseRef.current) setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    const marker = scrollRef.current
    if (!marker) return

    const container = marker.parentElement
    if (container) container.scrollTop = container.scrollHeight
  }, [lineIndex, typedChars])

  useEffect(() => {
    let cancelled = false

    if (phone2State !== 4) {
      setForwardingComplete(false)
      return
    }

    setForwardingComplete(false)

    const markForwarded = async () => {
      await waitMs(2000)
      if (!cancelled && !abortRef.current && phone2State === 4) {
        setForwardingComplete(true)
      }
    }

    void markForwarded()

    return () => {
      cancelled = true
    }
  }, [phone2State, waitMs])

  const run = useCallback(async () => {
    abortRef.current = false
    setPhase("idle")
    setLineIndex(-1)
    setTypedChars(0)
    setPhone2State(0)
    setForwardingComplete(false)
    setSeconds(0)
    setSpeaker(null)
    setIsPaused(false)
    hasPlayedRef.current = true

    setPhase("ringing")
    await waitMs(1800)
    if (abortRef.current) return

    setPhase("active")

    for (let index = 0; index < script.length; index += 1) {
      if (abortRef.current) return

      const line = script[index]
      setLineIndex(index)
      setTypedChars(0)
      setSpeaker(line.speaker)

      if (line.phone2State) setPhone2State(line.phone2State)

      const totalMs = estimateDuration(line.text, speedRef.current)
      const charDelay = totalMs / Math.max(line.text.length, 1)

      for (let charIndex = 1; charIndex <= line.text.length; charIndex += 1) {
        if (abortRef.current) return

        while (pauseRef.current && !abortRef.current) {
          await new Promise((resolve) => window.setTimeout(resolve, 80))
        }

        if (abortRef.current) return
        setTypedChars(charIndex)
        await new Promise((resolve) => window.setTimeout(resolve, Math.max(8, charDelay)))
      }

      setSpeaker(null)
      await waitMs(Math.max(200, 500 / (speedRef.current / 2.9)))
      if (abortRef.current) return
    }

    setPhase("ended")
    setSpeaker(null)
  }, [script, waitMs])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedRef.current) run()
      },
      { threshold: 0.25 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [run])

  const replay = () => {
    abortRef.current = true
    window.setTimeout(() => {
      void run()
    }, 60)
  }

  const visibleLines = script.slice(0, lineIndex + 1)
  const transcriptPreview = visibleLines.slice(-4)
  const activeTone = speaker ? speakerTone[speaker] : null
  const callStatus =
    phase === "idle"
      ? "Waiting..."
      : phase === "ringing"
        ? "Calling..."
        : phase === "active"
          ? formatTimer(seconds)
          : `Ended - ${formatTimer(seconds)}`

  return (
    <div ref={containerRef}>
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9aa0a8]">
          Live capabilities
        </p>
        <h2 className="mt-3 font-playfair text-3xl font-semibold text-[#0f172a] md:text-[2.4rem]">
          {twoPhoneDemo.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#5f6670]">
          {twoPhoneDemo.subtitle}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-12">
        <PhoneShell label="Customer call" indicatorClassName="bg-white/95">
          <div className="flex h-full flex-col bg-[linear-gradient(180deg,#6c8ea0_0%,#4c90a1_46%,#006c9a_100%)] px-6 pb-7 pt-4 text-white">
            <div className="flex items-center justify-between text-[12px] font-semibold">
              <span>9:41</span>
              <StatusCluster light batteryLevel={82} />
            </div>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2">
                {phase === "active" && (
                  <span className="flex items-center gap-1 rounded-full bg-[#ff3b30]/20 px-2 py-0.5 text-[11px] font-semibold text-[#ff6b6b]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff3b30]" />
                    REC
                  </span>
                )}
                <p className="text-[15px] font-semibold text-white/70">{callStatus}</p>
              </div>
              <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-white">
                {twoPhoneDemo.business}
              </h3>
              <p className="mt-1 text-[13px] text-white/50">
                {landingContent.demo.supportPhoneNumber}
              </p>
            </div>

            <div className="mt-6 flex flex-1 flex-col rounded-[30px] border border-white/30 bg-white/92 px-4 py-4 text-[#111827] shadow-[0_24px_50px_-28px_rgba(15,23,42,0.55)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#475467]">
                  <span>Voice signal</span>
                  <span className={activeTone ? activeTone.textClassName : "text-[#344054]"}>
                    {activeTone ? activeTone.label : phase === "ringing" ? "Dialing" : "Idle"}
                  </span>
                </div>
                <span className="rounded-full bg-[#e9edf5] px-2 py-0.5 text-[10px] font-semibold text-[#475467]">
                  Live call
                </span>
              </div>

              <div className="mt-3 rounded-[22px] bg-[#fcfbf8] px-2 py-3">
                <WaveformBars
                  active={speaker !== null}
                  barColor={activeTone?.waveColor ?? "#cbd5e1"}
                  idleColor="rgba(15,23,42,0.08)"
                />
              </div>

              <div
                className="mt-4 flex-1 overflow-y-auto pr-1"
                style={{ scrollbarWidth: "none" }}
              >
                {phase === "idle" && (
                  <div className="flex h-[112px] items-center justify-center text-center">
                    <div className="rounded-[22px] border border-[#e5e7eb] bg-white px-5 py-5 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.28)]">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#eff2f8] text-[#64748b]">
                        <Phone className="size-5" />
                      </div>
                      <p className="text-[12px] font-semibold text-[#334155]">Waiting to start call</p>
                    </div>
                  </div>
                )}

                {phase === "ringing" && (
                  <div className="flex h-[112px] items-center justify-center text-center">
                    <div className="rounded-[22px] border border-[#dbe5f0] bg-white px-5 py-5 shadow-[0_16px_34px_-24px_rgba(15,23,42,0.28)]">
                      <div className="mx-auto mb-3 flex h-11 w-11 animate-pulse items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7]">
                        <Phone className="size-5" />
                      </div>
                      <p className="text-[12px] font-semibold text-[#0f172a]">Customer call is connecting...</p>
                    </div>
                  </div>
                )}

                {(phase === "active" || phase === "ended") &&
                  transcriptPreview.map((line, index) => {
                    const isAgent = line.speaker === "agent"
                    const isCurrentLine = lineIndex === visibleLines.length - transcriptPreview.length + index
                    const text = isCurrentLine ? line.text.slice(0, typedChars) : line.text

                    return (
                      <div
                        key={`${line.speaker}-${index}-${line.text}`}
                        className={`mb-2 flex ${isAgent ? "" : "justify-end"}`}
                      >
                        <div
                        className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11px] leading-[1.55] shadow-[0_10px_24px_-18px_rgba(15,23,42,0.32)] ${
                          isAgent
                            ? "bg-[#eff2f8] text-[#334155]"
                            : speakerTone.customer.bubbleClassName
                        }`}
                        >
                          {text}
                          {isCurrentLine && phase === "active" && (
                            <span className="ml-px inline-block h-3 w-[2px] animate-pulse bg-[#475467]/35 align-middle" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                <div ref={scrollRef} />
              </div>
            </div>
          </div>
        </PhoneShell>

        <div className="flex w-full max-w-[560px] flex-col">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#5b6170] md:text-left">
            Agent actions
          </p>

          <div className="overflow-hidden rounded-[36px] border border-white/65 bg-white/[0.82] shadow-[0_36px_90px_-42px_rgba(15,23,42,0.38)] backdrop-blur-xl">
            <div className="border-b border-[#e7eaf0] bg-[linear-gradient(180deg,#fbfbfe_0%,#f7f7fb_100%)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecebff] text-base font-bold text-[#7c6ff7]">
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-[18px] font-semibold leading-none text-[#111827]">Agent Actions</p>
                  <p className="mt-1.5 text-[12px] text-[#6b7280]">Live memory, tools, and escalation</p>
                </div>
                {phone2State > 0 && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-[#e9f9ef] px-2.5 py-1 text-[10px] font-semibold text-[#15803d]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e]" />
                    Active
                  </span>
                )}
              </div>
            </div>

            <div
              className="min-h-[560px] overflow-y-auto bg-[linear-gradient(180deg,#fbfbfe_0%,#f2f2f7_100%)]"
              style={{ scrollbarWidth: "none" }}
            >
              {phone2State === 0 && (
                <div className="flex min-h-[560px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecebff] text-base font-bold text-[#7c6ff7]">
                      A
                    </div>
                    <p className="text-[11px] text-[#98a2b3]">
                      {phase === "idle" ? "Waiting to start..." : "Listening for actions..."}
                    </p>
                  </div>
                </div>
              )}

              {phone2State > 0 && (
                <div key={phone2State} className="pb-4">
                  {phone2State === 1 && <MemoryCard />}
                  {phone2State === 2 && <CalendarCard />}
                  {phone2State === 3 && <PaymentCard />}
                  {phone2State === 4 && <ForwardingCard forwarded={forwardingComplete} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-[#0f172a]/[0.06] px-1 py-1">
          {demoSpeedOptions.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setSpeedIdx(index)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                speedIdx === index
                  ? "bg-[#0f172a]/10 text-[#0f172a]"
                  : "text-[#5f6670] hover:text-[#0f172a]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsPaused((value) => !value)}
          disabled={phase === "idle" || phase === "ended"}
          className="flex items-center gap-1.5 rounded-full bg-[#0f172a]/[0.06] px-4 py-1.5 text-[11px] font-medium text-[#5f6670] transition-colors hover:text-[#0f172a] disabled:opacity-30"
        >
          {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {isPaused ? "Resume" : "Pause"}
        </button>

        <button
          type="button"
          onClick={replay}
          className="flex items-center gap-1.5 rounded-full bg-[#0f172a]/[0.06] px-4 py-1.5 text-[11px] font-medium text-[#5f6670] transition-colors hover:text-[#0f172a]"
        >
          <RotateCcw className="size-3.5" />
          Replay
        </button>
      </div>
    </div>
  )
}

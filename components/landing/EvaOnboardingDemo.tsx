"use client"

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Ellipsis,
  Grid2x2,
  Loader2,
  Mail,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  RotateCcw,
  Video,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  demoSpeedOptions,
  evaOnboardingDemo,
  type DemoOwnerMessage,
} from "@/lib/landing-content"

type CaptionItem = {
  id: string
  speaker: "agent" | "customer"
  text: string
}

type EmailStage = "hidden" | "inbox" | "opened" | "claimed"

type EvaOnboardingDemoProps = {
  onJumpToSignup?: () => void
}

const callControls = [
  { label: "Speaker", icon: Volume2 },
  { label: "FaceTime", icon: Video },
  { label: "Mute", icon: MicOff },
  { label: "More", icon: Ellipsis },
  { label: "End", icon: PhoneOff },
  { label: "Keypad", icon: Grid2x2 },
] as const

const NORMAL_WORDS_PER_SECOND = 2.9
const MIN_SPEECH_DURATION_MS = 900
const MIN_CHARACTER_DELAY_MS = 18
const MAX_CHARACTER_DELAY_MS = 78
const waveformPattern = [16, 28, 18, 36, 14, 32, 20, 38, 17, 29, 15, 33]
const speakerTone = {
  agent: {
    text: "text-[#0f766e]",
    wave: "#15b8a6",
    label: "EVA",
  },
  customer: {
    text: "text-[#2563eb]",
    wave: "#4f8cff",
    label: "Owner",
  },
} as const

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function formatTimer(seconds: number) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")
  return `${mins}:${secs}`
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getPlaybackScale(wordsPerSecond: number) {
  const safeWordsPerSecond = Math.max(wordsPerSecond, 0.1)
  return NORMAL_WORDS_PER_SECOND / safeWordsPerSecond
}

function estimateSpeechDuration(text: string, wordsPerSecond: number) {
  const wordCount = Math.max(countWords(text), 1)
  const shortPauseCount = (text.match(/[,;:]/g) ?? []).length
  const longPauseCount = (text.match(/[.!?]/g) ?? []).length
  const baseDurationMs = (wordCount / Math.max(wordsPerSecond, 0.1)) * 1000
  return Math.max(
    MIN_SPEECH_DURATION_MS,
    baseDurationMs + shortPauseCount * 120 + longPauseCount * 180
  )
}

function PhoneShell({
  children,
  indicatorClassName = "bg-black/88",
}: {
  children: ReactNode
  indicatorClassName?: string
}) {
  return (
    <div className="rounded-[54px] bg-[linear-gradient(135deg,#d7dbe3_0%,#8d95a1_34%,#eef1f5_100%)] p-[2px] shadow-[0_44px_120px_-30px_rgba(15,23,42,0.56)]">
      <div className="rounded-[51px] bg-[linear-gradient(135deg,#020202_0%,#1d222a_42%,#090c10_100%)] p-[5.5px]">
        <div className="relative h-[644px] w-[322px] overflow-hidden rounded-[46px] bg-white">
          <div className="absolute left-1/2 top-2 z-30 h-7 w-[120px] -translate-x-1/2 rounded-full bg-black" />
          {children}
          <div
            className={cn(
              "absolute bottom-1.5 left-1/2 z-30 h-[4px] w-[116px] -translate-x-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.18)]",
              indicatorClassName
            )}
          />
        </div>
      </div>
    </div>
  )
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
    <div className={cn("flex items-center gap-[4px]", light ? "text-white" : "text-[#111827]")}>
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

function ControlButton({
  label,
  icon: Icon,
  danger,
}: {
  label: string
  icon: ComponentType<{ className?: string }>
  danger?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-[72px] w-[72px] items-center justify-center rounded-full border text-white shadow-sm",
          danger
            ? "border-[#ff453a] bg-[#ff3b30]"
            : "border-white/28 bg-white/10 backdrop-blur-sm"
        )}
      >
        <Icon className={cn("size-7", danger ? "-rotate-135" : "")} />
      </div>
      <span className="text-[13px] font-medium text-white/92">{label}</span>
    </div>
  )
}

// ── Gmail Push Notification ────────────────────────────────────────────────────

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
      <path fill="#4caf50" d="M45 16.2l-5 2.75-5 4.75V40h7c1.657 0 3-1.343 3-3V16.2z" />
      <path fill="#1e88e5" d="M3 16.2l3.615 2.85L13 23.7V40H6c-1.657 0-3-1.343-3-3V16.2z" />
      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
      <path fill="#c62828" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859C9.131 8.301 8.228 8 7.298 8c-2.366 0-4.298 1.932-4.298 4.298z" />
      <path fill="#fbc02d" d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341C38.869 8.301 39.772 8 40.702 8c2.366 0 4.298 1.932 4.298 4.298z" />
    </svg>
  )
}

function GmailNotification({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="animate-[landing-sms_0.28s_ease] flex items-center gap-3 rounded-[20px] border border-white/50 bg-white/85 px-4 py-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.20)] backdrop-blur-xl">
      {/* Gmail icon badge */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.14)]">
        <GmailIcon />
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#111827]">You have a new message</p>
        <p className="mt-0.5 truncate text-[11px] text-[#6b7280]">eva@0lumens.com · Claim Your Workspace</p>
      </div>
      {/* Timestamp */}
      <span className="flex-shrink-0 text-[11px] text-[#9aa0a8]">1m ago</span>
    </div>
  )
}

// ── Gmail-inspired Email Panel ────────────────────────────────────────────────

function EmailPanel({ stage }: { stage: EmailStage }) {
  if (stage === "hidden") return null

  return (
    <div className="animate-[landing-sms_0.28s_ease] overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.22)]">
      {stage === "inbox" && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2.5 border-b border-black/8 px-5 py-3.5">
            <Mail className="size-4 text-[#6b7280]" />
            <span className="text-sm font-semibold text-[#111827]">Inbox</span>
          </div>
          {/* Single email row */}
          <div className="animate-[landing-sms_0.28s_ease] px-5 py-4">
            <div className="flex items-start gap-3">
              {/* Unread dot */}
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#7c6ff7]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-[#111827]">
                    eva@0lumens.com
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-[#9aa0a8]">Just now</span>
                </div>
                <p className="mt-0.5 text-[13px] font-medium text-[#374151]">
                  Claim Your Workspace
                </p>
                <p className="mt-0.5 truncate text-[12px] text-[#9aa0a8]">
                  SpeakOps · Your workspace is ready to claim.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {stage === "opened" && (
        <>
          {/* Back bar */}
          <div className="flex items-center gap-2 border-b border-black/8 px-5 py-3">
            <ChevronLeft className="size-4 text-[#7c6ff7]" />
            <span className="text-[13px] font-medium text-[#7c6ff7]">Inbox</span>
          </div>
          {/* Email body */}
          <div className="px-5 py-5">
            <h3 className="text-base font-semibold text-[#0f172a]">
              Claim Your SpeakOps Workspace
            </h3>
            <p className="mt-0.5 text-[12px] text-[#9aa0a8]">From: eva@0lumens.com</p>
            <div className="mt-4 space-y-2 text-[13px] leading-6 text-[#374151]">
              <p>Hi there,</p>
              <p>Your SpeakOps workspace is ready.</p>
              <p>Click below to claim your owner account.</p>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-[12px] bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-6px_rgba(15,23,42,0.42)] transition hover:bg-[#1e293b]"
            >
              Claim Workspace
            </button>
          </div>
        </>
      )}

      {stage === "claimed" && (
        <>
          {/* Success header */}
          <div className="flex items-center gap-2.5 border-b border-black/8 px-5 py-3.5">
            <CheckCircle2 className="size-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#059669]">Workspace Claimed</span>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] leading-6 text-[#374151]">
              Your workspace is active. EVA will continue the setup on the call.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Provisioning Card ─────────────────────────────────────────────────────────

function ProvisioningCard() {
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setApproved(true), 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="animate-[landing-sms_0.28s_ease] overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_16px_48px_-20px_rgba(15,23,42,0.22)]">
      <div className="flex items-center gap-2.5 border-b border-black/8 px-5 py-3.5">
        {approved ? (
          <CheckCircle2 className="size-4 text-[#059669]" />
        ) : (
          <Loader2 className="size-4 animate-spin text-[#7c6ff7]" />
        )}
        <span className={cn("text-sm font-semibold transition-colors duration-300", approved ? "text-[#059669]" : "text-[#7c6ff7]")}>
          {approved ? "Business agent approved" : "Configuring your business agent..."}
        </span>
      </div>
      <div className="px-5 py-5 space-y-1">
        {approved ? (
          <p className="text-[13px] leading-6 text-[#374151]">Your agent is live and ready to take calls.</p>
        ) : (
          <>
            <p className="text-[13px] leading-6 text-[#374151]">Business agent number being set up.</p>
            <p className="text-[13px] leading-6 text-[#374151]">You'll receive a confirmation shortly.</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── Status Chips ──────────────────────────────────────────────────────────────

function StatusChip({
  label,
  dot,
  visible,
}: {
  label: string
  dot: string
  visible: boolean
}) {
  if (!visible) return null
  return (
    <span className="animate-[landing-sms_0.28s_ease] inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[#374151] shadow-[0_4px_12px_-8px_rgba(15,23,42,0.18)]">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EvaOnboardingDemo({ onJumpToSignup }: EvaOnboardingDemoProps) {
  const [wordsPerSecond, setWordsPerSecond] = useState<number>(NORMAL_WORDS_PER_SECOND)
  const [captions, setCaptions] = useState<CaptionItem[]>([])
  const [callLabel, setCallLabel] = useState("Calling...")
  const [callTimer, setCallTimer] = useState("00:00")
  const [isConnected, setIsConnected] = useState(false)
  const [currentAction, setCurrentAction] = useState("")
  const [activeSpeaker, setActiveSpeaker] = useState<"agent" | "customer" | null>(null)
  const [replayToken, setReplayToken] = useState(0)
  const [emailStage, setEmailStage] = useState<EmailStage>("hidden")
  const [provisioningVisible, setProvisioningVisible] = useState(false)
  const [showGmailNotif, setShowGmailNotif] = useState(false)

  // Status chip visibility
  const [chipEmailSent, setChipEmailSent] = useState(false)
  const [chipWorkspaceClaimed, setChipWorkspaceClaimed] = useState(false)
  const [chipProvisioning, setChipProvisioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const runIdRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const idleReplayTimerRef = useRef<number | null>(null)
  const wordsPerSecondRef = useRef(wordsPerSecond)
  const captionsScrollRef = useRef<HTMLDivElement | null>(null)
  const phonesRef = useRef<HTMLDivElement | null>(null)
  const isDemoVisibleRef = useRef(false)
  const hasEnteredViewportRef = useRef(false)
  const playbackStateRef = useRef<"idle" | "running" | "complete">("idle")
  const isPausedRef = useRef(false)

  const scenario = evaOnboardingDemo.scenario

  const clearIdleReplayTimer = () => {
    if (idleReplayTimerRef.current !== null) {
      window.clearTimeout(idleReplayTimerRef.current)
      idleReplayTimerRef.current = null
    }
  }

  useEffect(() => {
    wordsPerSecondRef.current = wordsPerSecond
  }, [wordsPerSecond])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    const container = captionsScrollRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    })
  }, [captions])

  useEffect(() => {
    const node = phonesRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const isIntersecting = Boolean(entry?.isIntersecting)
        isDemoVisibleRef.current = isIntersecting

        if (!isIntersecting) return

        clearIdleReplayTimer()

        if (!hasEnteredViewportRef.current) {
          hasEnteredViewportRef.current = true
          setReplayToken((value) => value + 1)
          return
        }

        if (playbackStateRef.current === "complete") {
          setReplayToken((value) => value + 1)
        }
      },
      { threshold: 0.6 }
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      clearIdleReplayTimer()
    }
  }, [])

  useEffect(() => {
    if (replayToken === 0) {
      return
    }

    let cancelled = false
    const runId = runIdRef.current + 1
    runIdRef.current = runId

    const stopTimer = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    const resetDemo = () => {
      clearIdleReplayTimer()
      stopTimer()
      setCaptions([])
      setCallLabel("Calling...")
      setCallTimer("00:00")
      setIsConnected(false)
      setCurrentAction("")
      setActiveSpeaker(null)
      setEmailStage("hidden")
      setProvisioningVisible(false)
      setShowGmailNotif(false)
      setChipEmailSent(false)
      setChipWorkspaceClaimed(false)
      setChipProvisioning(false)
      setIsPaused(false)
      playbackStateRef.current = "idle"
    }

    const startTimer = () => {
      let seconds = 0
      stopTimer()
      timerRef.current = window.setInterval(() => {
        if (runIdRef.current !== runId) {
          stopTimer()
          return
        }
        if (!isDemoVisibleRef.current || isPausedRef.current) {
          return
        }
        seconds += 1
        setCallTimer(formatTimer(seconds))
      }, Math.max(120, 1000 * getPlaybackScale(wordsPerSecondRef.current)))
    }

    const waitScaled = async (ms: number) => {
      let remainingMs = ms * getPlaybackScale(wordsPerSecondRef.current)

      while (remainingMs > 0) {
        if (cancelled || runIdRef.current !== runId) {
          throw new Error("demo-aborted")
        }

        if (!isDemoVisibleRef.current || isPausedRef.current) {
          await wait(140)
          continue
        }

        const chunkMs = Math.min(remainingMs, 80)
        await wait(chunkMs)
        remainingMs -= chunkMs
      }
    }

    const scheduleIdleReplay = () => {
      clearIdleReplayTimer()
      idleReplayTimerRef.current = window.setTimeout(() => {
        if (cancelled || runIdRef.current !== runId) return
        if (!isDemoVisibleRef.current) return
        if (playbackStateRef.current !== "complete") return
        setReplayToken((value) => value + 1)
      }, 30000)
    }

    // ownerMessages not used in onboarding scenario but kept for type safety
    const appendDueOwnerMessages = async (
      eventIndex: number,
      sentIndexes: Set<number>,
      ownerMessages: DemoOwnerMessage[]
    ) => {
      for (let index = 0; index < ownerMessages.length; index += 1) {
        if (sentIndexes.has(index)) continue
        if (ownerMessages[index].triggerAfterEvent > eventIndex) continue
        sentIndexes.add(index)
        await waitScaled(260)
      }
    }

    const runDemo = async () => {
      resetDemo()
      playbackStateRef.current = "running"
      const sentOwnerMessages = new Set<number>()

      try {
        for (let index = 0; index < scenario.events.length; index += 1) {
          const event = scenario.events[index]

          if (event.type === "ringing") {
            setCallLabel("Calling...")
            setActiveSpeaker(null)
            await waitScaled(event.durationMs)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "connected") {
            setCallLabel("Connected")
            setIsConnected(true)
            setCurrentAction("")
            startTimer()
            await waitScaled(800)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "speech") {
            setCurrentAction("")
            setActiveSpeaker(event.speaker)
            const captionId = `${runId}-${index}`
            setCaptions((current) => [
              ...current,
              {
                id: captionId,
                speaker: event.speaker,
                text: "",
              },
            ])

            const speechDurationMs = estimateSpeechDuration(event.text, wordsPerSecondRef.current)
            const characterDelay = Math.max(
              MIN_CHARACTER_DELAY_MS,
              Math.min(MAX_CHARACTER_DELAY_MS, speechDurationMs / Math.max(event.text.length, 1))
            )

            for (let characterIndex = 1; characterIndex <= event.text.length; characterIndex += 1) {
              setCaptions((current) =>
                current.map((item) =>
                  item.id === captionId
                    ? {
                        ...item,
                        text: event.text.slice(0, characterIndex),
                      }
                    : item
                )
              )
              await waitScaled(characterDelay)
            }

            await waitScaled(280)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "action") {
            setActiveSpeaker(null)
            setCurrentAction(event.text)
            await waitScaled(1350)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "email_appear") {
            setEmailStage("inbox")
            setChipEmailSent(true)
            setShowGmailNotif(true)
            window.setTimeout(() => setShowGmailNotif(false), 3800)
            await waitScaled(2200)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "email_open") {
            setEmailStage("opened")
            await waitScaled(1800)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "claim_complete") {
            setEmailStage("claimed")
            setChipWorkspaceClaimed(true)
            await waitScaled(1400)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "provisioning") {
            setProvisioningVisible(true)
            setChipProvisioning(true)
            await waitScaled(1200)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            continue
          }

          if (event.type === "call_end") {
            stopTimer()
            setCallLabel("Call ended")
            setIsConnected(false)
            setActiveSpeaker(null)
            setCurrentAction(`Call ended — ${event.durationLabel}`)
            await appendDueOwnerMessages(index, sentOwnerMessages, scenario.ownerMessages)
            playbackStateRef.current = "complete"
            scheduleIdleReplay()
            break
          }
        }
      } catch (error) {
        if ((error as Error).message !== "demo-aborted") {
          throw error
        }
      }
    }

    void runDemo()

    return () => {
      cancelled = true
      clearIdleReplayTimer()
      stopTimer()
    }
  }, [replayToken, scenario])

  return (
    <section className="mt-12">
      <div className="flex flex-col items-center">
        {/* Header */}
        {scenario.business || scenario.summary ? (
          <div className="mb-6 flex max-w-3xl flex-col items-center text-center">
            {scenario.business ? (
              <h2 className="text-2xl font-semibold tracking-tight text-[#111827] md:text-3xl">
                {scenario.business}
              </h2>
            ) : null}
            {scenario.summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6b7280] md:text-base">
                {scenario.summary}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Main demo grid */}
        <div
          ref={phonesRef}
          className="mt-8 grid w-full max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12"
        >
          {/* ── Left: Call phone ── */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f8f8f]">
              EVA Call
            </span>

            {/* Phone wrapper — relative so notification can overlay */}
            <div className="relative">
            <PhoneShell indicatorClassName="bg-white/95">
              <div className="flex h-full flex-col bg-[linear-gradient(180deg,#766fe0_0%,#9b93f0_46%,#6e66db_100%)] px-6 pb-7 pt-4 text-white">
                <div className="flex items-center justify-between text-[12px] font-semibold">
                  <span>9:41</span>
                  <StatusCluster light batteryLevel={82} />
                </div>

                <div className="mt-10 flex-1">
                  <div className="text-center">
                    {/* Call status + REC indicator */}
                    <div className="flex items-center justify-center gap-2">
                      {isConnected && (
                        <span className="flex items-center gap-1 rounded-full bg-[#ff3b30]/20 px-2 py-0.5 text-[11px] font-semibold text-[#ff6b6b]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b30] animate-pulse" />
                          REC
                        </span>
                      )}
                      <p className="text-[15px] font-semibold text-white/70">
                        {callLabel === "Connected" ? callTimer : callLabel}
                      </p>
                    </div>
                    <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-white">
                      EVA — SpeakOps
                    </h3>
                    <p className="mt-1 text-[13px] text-white/50">eva@0lumens.com</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-y-5">
                  {callControls.map((control) => (
                    <ControlButton
                      key={control.label}
                      label={control.label}
                      icon={control.icon}
                      danger={control.label === "End"}
                    />
                  ))}
                </div>
              </div>
            </PhoneShell>

            {/* Gmail notification — absolute overlay on phone */}
            {showGmailNotif && (
              <div className="absolute inset-x-3 top-14 z-40 animate-[landing-sms_0.28s_ease]">
                <div className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-white px-3.5 py-2.5 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.32)]">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.16)]">
                    <GmailIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#111827]">You have a new message</p>
                    <p className="mt-0.5 truncate text-[10px] text-[#6b7280]">eva@0lumens.com</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-[#9aa0a8]">1m ago</span>
                </div>
              </div>
            )}
            </div>{/* end phone wrapper */}

            {/* Status chips below the phone */}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <StatusChip
                label="Email sent"
                dot="bg-[#7c6ff7]"
                visible={chipEmailSent}
              />
              <StatusChip
                label="Workspace claimed"
                dot="bg-[#059669]"
                visible={chipWorkspaceClaimed}
              />
              <StatusChip
                label="Provisioning number"
                dot="bg-[#f59e0b]"
                visible={chipProvisioning}
              />
            </div>
          </div>

          {/* ── Right: Transcript + Email Panel ── */}
          <div className="w-full space-y-5 lg:pt-10">
            {/* Transcript card */}
            <div className="rounded-[28px] border border-black/10 bg-white/70 px-5 py-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-sm md:px-6">
              {/* Action chip */}
              <div className="flex min-h-[24px] items-center justify-center">
                {currentAction ? (
                  <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-[#6b7280] shadow-[0_8px_24px_-20px_rgba(15,23,42,0.2)]">
                    {currentAction}
                  </span>
                ) : null}
              </div>

              {/* Waveform */}
              <div className="mt-4 flex flex-col items-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f8f8f]">
                  <span>Voice signal</span>
                  <span
                    className={cn(
                      "transition-colors",
                      activeSpeaker ? speakerTone[activeSpeaker].text : "text-[#9ca3af]"
                    )}
                  >
                    {activeSpeaker ? speakerTone[activeSpeaker].label : "Idle"}
                  </span>
                </div>

                <div className="mt-3 flex h-12 items-end justify-center gap-[5px]">
                  {waveformPattern.map((height, index) => (
                    <span
                      key={`${index}-${activeSpeaker ?? "idle"}`}
                      className={cn(
                        "block w-[4px] rounded-full transition-colors duration-300",
                        activeSpeaker
                          ? "animate-[landing-waveform_0.7s_ease-in-out_infinite_alternate]"
                          : "opacity-45"
                      )}
                      style={{
                        height: activeSpeaker ? `${height}px` : "10px",
                        backgroundColor: activeSpeaker ? speakerTone[activeSpeaker].wave : "#c9ced6",
                        animationDelay: `${index * 0.06}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Captions */}
              <div
                ref={captionsScrollRef}
                className="mt-5 max-h-[340px] overflow-y-auto rounded-[22px] bg-[#fcfbf8] px-4 py-4 md:px-5"
              >
                {captions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#b4b4b8]">
                    Waiting for EVA to call...
                  </div>
                ) : null}

                <div className="flex flex-col gap-4">
                  {captions.map((caption, index) => {
                    const tone = speakerTone[caption.speaker]
                    const isLatest = index === captions.length - 1

                    return (
                      <div
                        key={caption.id}
                        className={cn(
                          "animate-[landing-caption_0.35s_ease]",
                          caption.speaker === "agent" ? "self-start text-left" : "self-end text-right"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[82%] text-[1.3rem] font-medium leading-tight tracking-tight transition-opacity md:text-[1.45rem]",
                            tone.text,
                            isLatest ? "opacity-100" : "opacity-50"
                          )}
                        >
                          {caption.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Email Panel — animates in when emailStage !== "hidden" */}
            <EmailPanel stage={emailStage} />

            {/* Provisioning Card */}
            {provisioningVisible && <ProvisioningCard />}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <select
            aria-label="Demo speed"
            className="rounded-full bg-white px-4 py-2 text-sm text-[#4b5563] shadow-[0_8px_24px_-20px_rgba(15,23,42,0.22)] outline-none"
            value={String(wordsPerSecond)}
            onChange={(event) => {
              clearIdleReplayTimer()
              setWordsPerSecond(Number(event.target.value))
            }}
          >
            {demoSpeedOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4b5563] shadow-[0_8px_24px_-20px_rgba(15,23,42,0.22)] transition hover:text-[#111827]"
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            type="button"
            onClick={() => {
              clearIdleReplayTimer()
              setReplayToken((value) => value + 1)
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4b5563] shadow-[0_8px_24px_-20px_rgba(15,23,42,0.22)] transition hover:text-[#111827]"
          >
            <RotateCcw className="size-4" />
            Replay
          </button>

          <button
            type="button"
            onClick={onJumpToSignup}
            className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1f2937]"
          >
            Continue to setup
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

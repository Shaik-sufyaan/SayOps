"use client"

import * as React from "react"

import type { LiveCallSpeaker, LiveCallWaveform } from "@/lib/live-call-types"
import { isTerminalLiveCallStatus } from "@/lib/live-call-types"
import { cn } from "@/lib/utils"

const BAR_COUNT = 24
const FALLBACK_PATTERN = [
  0.12, 0.28, 0.16, 0.36, 0.22, 0.18, 0.44, 0.2,
  0.34, 0.14, 0.4, 0.24, 0.18, 0.3, 0.12, 0.26,
] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildAnimatedBars(input: {
  values: number[]
  tick: number
  active: boolean
  fallbackBias: number
}): number[] {
  const tail = input.values.slice(-BAR_COUNT)
  if (tail.length === BAR_COUNT) {
    return tail.map((value) => clamp(value, 0.05, 0.95))
  }

  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const pattern = FALLBACK_PATTERN[(index + input.tick) % FALLBACK_PATTERN.length] ?? 0.16
    const scale = input.active ? 1.15 : 0.72
    const wobble = (((index + 3) * (input.tick + 5)) % 7) / 100
    return clamp(pattern * scale + input.fallbackBias + wobble, 0.06, 0.82)
  })
}

function WaveformLane({
  values,
  active,
  colorClassName,
}: {
  values: number[]
  active: boolean
  colorClassName: string
}) {
  return (
    <div className="flex h-8 items-center gap-[3px]">
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
          active ? "bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.45)]" : "bg-white/25"
        )}
      />
      {values.map((value, index) => (
        <span
          key={`${index}-${value}`}
          className={cn(
            "min-w-0 flex-1 rounded-full transition-[height,opacity,transform] duration-150 ease-out",
            colorClassName,
            active ? "opacity-100" : "opacity-60"
          )}
          style={{
            height: `${Math.max(3, Math.round(value * 26))}px`,
            transform: active ? "translateY(0px)" : "translateY(1px)",
          }}
        />
      ))}
    </div>
  )
}

export function AudioWaveformRail({
  waveform,
  activeSpeaker,
  status,
  className,
}: {
  waveform: LiveCallWaveform
  activeSpeaker: LiveCallSpeaker
  status: string
  className?: string
}) {
  const shouldAnimate = !isTerminalLiveCallStatus(status)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    if (!shouldAnimate) return

    const intervalId = window.setInterval(() => {
      setTick((current) => current + 1)
    }, 160)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [shouldAnimate])

  const assistantSource = waveform.assistant.length > 0
    ? waveform.assistant
    : waveform.mixed.map((value) => activeSpeaker === "assistant" ? value : value * 0.35)
  const userSource = waveform.user.length > 0
    ? waveform.user
    : waveform.mixed.map((value) => activeSpeaker === "user" ? value : value * 0.35)

  const assistantBars = React.useMemo(() => buildAnimatedBars({
    values: assistantSource,
    tick,
    active: activeSpeaker === "assistant",
    fallbackBias: 0.04,
  }), [activeSpeaker, assistantSource, tick])

  const userBars = React.useMemo(() => buildAnimatedBars({
    values: userSource,
    tick: tick + 4,
    active: activeSpeaker === "user",
    fallbackBias: 0.03,
  }), [activeSpeaker, tick, userSource])

  return (
    <div
      className={cn(
        "rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <div className="space-y-1.5">
        <WaveformLane
          values={assistantBars}
          active={activeSpeaker === "assistant"}
          colorClassName="bg-[#91c9ff]"
        />
        <WaveformLane
          values={userBars}
          active={activeSpeaker === "user"}
          colorClassName="bg-[#d9f0ff]"
        />
      </div>
    </div>
  )
}

"use client"

import { cn } from "@/lib/utils"
import { isTerminalLiveCallStatus } from "@/lib/live-call-types"

function formatElapsed(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    return [hours, minutes, remainingSeconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":")
  }

  return [minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
}

export function RecordingTimerChip({
  elapsedSeconds,
  status,
  className,
}: {
  elapsedSeconds: number
  status: string
  className?: string
}) {
  const isActive = !isTerminalLiveCallStatus(status)

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.1)_100%)] px-3 py-1.5 text-[14px] font-medium tracking-[-0.03em] text-white shadow-[0_16px_36px_-20px_rgba(0,0,0,0.58)] backdrop-blur-2xl",
        isActive && "animate-[live-call-chip-pulse_2.2s_ease-out_infinite]",
        className
      )}
    >
      <span className="tabular-nums">{formatElapsed(elapsedSeconds)}</span>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          isActive ? "bg-[#ff3b30] shadow-[0_0_18px_rgba(255,59,48,0.85)]" : "bg-white/35"
        )}
      />
    </div>
  )
}

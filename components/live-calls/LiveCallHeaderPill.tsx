"use client"

import { cn } from "@/lib/utils"

export function LiveCallHeaderPill({
  toLabel,
  fromLabel,
  className,
}: {
  toLabel: string
  fromLabel: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.12)_100%)] px-4 py-3 text-white shadow-[0_16px_38px_-18px_rgba(0,0,0,0.58)] backdrop-blur-2xl",
        className
      )}
    >
      <div className="grid gap-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[13px] font-semibold text-white/80">To:</span>
          <span className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.02em] text-white">
            {toLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[13px] font-semibold text-white/80">From:</span>
          <span className="min-w-0 truncate font-mono text-[14px] text-white/92">
            {fromLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

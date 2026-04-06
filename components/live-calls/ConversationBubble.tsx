"use client"

import { cn } from "@/lib/utils"

export function ConversationBubble({
  role,
  text,
  final = true,
  className,
}: {
  role: "assistant" | "user"
  text: string
  final?: boolean
  className?: string
}) {
  const isUser = role === "user"

  return (
    <div className={cn("flex animate-[landing-bubble_0.28s_ease]", isUser ? "justify-end" : "justify-start", className)}>
      <div
        className={cn(
          "max-w-[88%] rounded-[22px] px-4 py-3 text-[15px] leading-[1.35] shadow-[0_16px_34px_-26px_rgba(0,0,0,0.72)] transition-colors",
          isUser
            ? "bg-[#f7f2ee] text-[#111111]"
            : "bg-[#2e2a2c] text-[#f7f6f2]",
          !final && "ring-1 ring-white/10"
        )}
      >
        <span>{text}</span>
        {!final && (
          <span className="ml-2 inline-flex items-center align-middle text-[11px] uppercase tracking-[0.18em] opacity-60">
            <span
              className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current"
              style={{ opacity: 0.7 }}
            />
            live
          </span>
        )}
      </div>
    </div>
  )
}

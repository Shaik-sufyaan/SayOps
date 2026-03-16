"use client"

import * as React from "react"
import { IconRobot, IconUser } from "@tabler/icons-react"

import type { Message } from "@/lib/types"
import { buildRenderableTranscriptTurns } from "@/lib/transcript-display"
import { cn } from "@/lib/utils"

export function CallTranscript({
  messages,
  loading,
  emptyText = "No transcript available.",
  className,
}: {
  messages: Message[]
  loading?: boolean
  emptyText?: string
  className?: string
}) {
  const transcriptTurns = React.useMemo(
    () => buildRenderableTranscriptTurns(messages),
    [messages]
  )

  return (
    <div className={cn("flex max-h-[400px] flex-col gap-3 overflow-y-auto pr-2", className)}>
      {loading ? (
        <p className="animate-pulse text-sm text-muted-foreground">Loading transcript...</p>
      ) : transcriptTurns.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        transcriptTurns.map((turn) => (
          <div
            key={turn.id}
            className={`flex gap-3 ${turn.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                turn.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground"
              }`}
            >
              {turn.role === "user" ? <IconUser className="size-4" /> : <IconRobot className="size-4" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                turn.role === "user" ? "bg-muted" : "bg-primary/10"
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

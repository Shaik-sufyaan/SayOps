import type { Message } from "@/lib/types"

export interface TranscriptTurn {
  id: string
  role: "user" | "assistant"
  text: string
}

const TRANSCRIPT_SPEAKER_PATTERN = /(^|\s)(AI|Assistant|Bot|Agent|User|Customer|Caller|Human)\s*:\s*/gi

function normalizeTranscriptRole(label: string): "user" | "assistant" {
  const value = label.trim().toLowerCase()
  if (value === "ai" || value === "assistant" || value === "bot" || value === "agent") {
    return "assistant"
  }
  return "user"
}

function parseTranscriptSpeakerTurns(text: string): Array<{ role: "user" | "assistant"; text: string }> {
  const normalized = text.replace(/\r\n/g, "\n").trim()
  if (!normalized) return []

  const matches = Array.from(normalized.matchAll(TRANSCRIPT_SPEAKER_PATTERN))
  if (matches.length === 0) {
    return [{ role: "assistant", text: normalized }]
  }

  const turns: Array<{ role: "user" | "assistant"; text: string }> = []
  const leadingText = normalized.slice(0, matches[0]?.index ?? 0).trim()
  if (leadingText.length > 0) {
    turns.push({ role: "assistant", text: leadingText })
  }

  for (let index = 0; index < matches.length; index++) {
    const current = matches[index]
    const next = matches[index + 1]
    const content = normalized
      .slice((current.index ?? 0) + current[0].length, next?.index ?? normalized.length)
      .trim()

    if (!content) continue

    turns.push({
      role: normalizeTranscriptRole(current[2]),
      text: content,
    })
  }

  return turns.length > 0 ? turns : [{ role: "assistant", text: normalized }]
}

export function messageContentToText(content: Message["content"]): string {
  if (typeof content === "string") return content
  if (!content || !Array.isArray(content)) return ""
  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
}

export function buildRenderableTranscriptTurns(messages: Message[]): TranscriptTurn[] {
  return messages.flatMap((message, messageIndex) => {
    if (message.role !== "user" && message.role !== "assistant") return []

    const text = messageContentToText(message.content).trim()
    if (!text) return []

    const parsedTurns = parseTranscriptSpeakerTurns(text)
    if (parsedTurns.length <= 1) {
      return [{
        id: `${message.id ?? messageIndex}:0`,
        role: message.role,
        text,
      }]
    }

    return parsedTurns.map((turn, turnIndex) => ({
      id: `${message.id ?? messageIndex}:${turnIndex}`,
      role: turn.role,
      text: turn.text,
    }))
  })
}

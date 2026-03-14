import type { AdminConversationMessage } from "@/lib/types"

export function pickDefaultTraceMessage(messages: AdminConversationMessage[]): AdminConversationMessage | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (
      message.role === "assistant" &&
      message.hasLlmTrace &&
      typeof message.traceExecutionId === "string" &&
      message.traceExecutionId.length > 0
    ) {
      return message
    }
  }

  return null
}

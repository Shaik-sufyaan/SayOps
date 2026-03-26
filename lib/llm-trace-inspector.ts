import type { LlmTraceSegment } from "@/lib/types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function extractContentText(content: unknown): string {
  if (!isRecord(content) || !Array.isArray(content.parts)) return ""
  return content.parts
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim()
}

function openGeminiContentPath(paths: Set<string>, index: number) {
  paths.add(`root.contents.${index}`)
  paths.add(`root.contents.${index}.parts`)
  paths.add(`root.contents.${index}.parts.0`)
}

export function getInputJsonDefaultPaths(value: unknown): Set<string> {
  const paths = new Set<string>(["root"])
  if (!isRecord(value)) return paths

  if (isRecord(value.config)) {
    paths.add("root.config")
    if (typeof value.config.systemInstruction === "string") {
      paths.add("root.config.systemInstruction")
    }
  }

  if (!Array.isArray(value.contents)) return paths

  paths.add("root.contents")

  let runtimeIndex: number | null = null
  let contextIndex: number | null = null
  let historyIndex: number | null = null

  value.contents.forEach((content, index) => {
    const text = extractContentText(content)
    if (!text) return
    if (runtimeIndex == null && text.startsWith("[Runtime Context]")) {
      runtimeIndex = index
      return
    }
    if (
      contextIndex == null &&
      (text.startsWith("[Conversation Context]") || text.startsWith("[Conversation Context Update]"))
    ) {
      contextIndex = index
      return
    }
    if (historyIndex == null) {
      historyIndex = index
    }
  })

  if (runtimeIndex != null) openGeminiContentPath(paths, runtimeIndex)
  if (contextIndex != null) openGeminiContentPath(paths, contextIndex)
  if (historyIndex != null) openGeminiContentPath(paths, historyIndex)

  return paths
}

export function getOutputJsonDefaultPaths(value: unknown): Set<string> {
  const paths = new Set<string>(["root"])
  if (Array.isArray(value) && value.length > 0) {
    paths.add("root.0")
    const first = value[0]
    if (isRecord(first) && Array.isArray(first.candidates) && first.candidates.length > 0) {
      paths.add("root.0.candidates")
      paths.add("root.0.candidates.0")
      paths.add("root.0.candidates.0.content")
      paths.add("root.0.candidates.0.content.parts")
    }
    return paths
  }

  if (!isRecord(value)) return paths
  if (Array.isArray(value.candidates) && value.candidates.length > 0) {
    paths.add("root.candidates")
    paths.add("root.candidates.0")
    paths.add("root.candidates.0.content")
    paths.add("root.candidates.0.content.parts")
  }
  return paths
}

export function getTraceSegmentClassName(segment: LlmTraceSegment): string {
  if (segment.kind === "stable_prefix") {
    return "border-emerald-500/20 bg-emerald-500/10"
  }

  if (segment.kind === "runtime_context") {
    return "border-rose-500/20 bg-rose-500/10"
  }

  if (segment.kind === "conversation_context") {
    return "border-border/70 bg-muted/25"
  }

  if (segment.kind === "tool_call" || segment.kind === "tool_result") {
    return "border-border/70 bg-muted/15"
  }

  return "border-border/70 bg-background"
}

export function getTraceSegmentMetaLabel(segment: LlmTraceSegment): string {
  if (segment.cached === true) return "cached"
  if (segment.cached === false) return "uncached"
  return segment.source.replaceAll("_", " ")
}

import { describe, expect, test } from "bun:test"
import {
  getInputJsonDefaultPaths,
  getOutputJsonDefaultPaths,
  getTraceSegmentClassName,
  getTraceSegmentMetaLabel,
} from "../lib/llm-trace-inspector"

describe("llm trace inspector helpers", () => {
  test("marks stable and runtime segments with distinct tones", () => {
    expect(
      getTraceSegmentClassName({
        id: "stable",
        kind: "stable_prefix",
        label: "Cached Stable Prefix",
        text: "Base system prompt",
        cached: true,
        source: "system_instruction",
        role: "system",
        path: "root.config.systemInstruction",
      }),
    ).toContain("emerald")

    expect(
      getTraceSegmentClassName({
        id: "runtime",
        kind: "runtime_context",
        label: "Runtime Context",
        text: "[Runtime Context]",
        cached: false,
        source: "runtime_context",
        role: "user",
        path: "root.contents.0.parts.0",
      }),
    ).toContain("rose")

    expect(
      getTraceSegmentMetaLabel({
        id: "runtime",
        kind: "runtime_context",
        label: "Runtime Context",
        text: "[Runtime Context]",
        cached: false,
        source: "runtime_context",
        role: "user",
        path: "root.contents.0.parts.0",
      }),
    ).toBe("uncached")
  })

  test("opens the high-signal prompt and response JSON nodes by default", () => {
    const inputPaths = getInputJsonDefaultPaths({
      config: {
        systemInstruction: "Base prompt",
      },
      contents: [
        {
          role: "user",
          parts: [{ text: "[Runtime Context]\nfoo" }],
        },
        {
          role: "user",
          parts: [{ text: "[Conversation Context]\nbar" }],
        },
        {
          role: "model",
          parts: [{ text: "hello there" }],
        },
      ],
    })

    expect(inputPaths.has("root.config.systemInstruction")).toBe(true)
    expect(inputPaths.has("root.contents.0.parts.0")).toBe(true)
    expect(inputPaths.has("root.contents.1.parts.0")).toBe(true)
    expect(inputPaths.has("root.contents.2.parts.0")).toBe(true)

    const outputPaths = getOutputJsonDefaultPaths({
      candidates: [
        {
          content: {
            parts: [{ text: "done" }],
          },
        },
      ],
    })

    expect(outputPaths.has("root.candidates.0.content.parts")).toBe(true)
  })
})

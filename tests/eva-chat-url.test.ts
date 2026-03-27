import { describe, expect, test } from "bun:test"
import {
  buildEvaChatHref,
  getDesiredEvaChatParam,
  shouldPushEvaChatHistory,
} from "../lib/eva-chat-url"

describe("eva chat url helpers", () => {
  test("removes the chat param when Eva closes", () => {
    expect(buildEvaChatHref("/dashboard", "view=integrations&chat=abc123", null))
      .toBe("/dashboard?view=integrations")
  })

  test("preserves other params when Eva opens", () => {
    expect(buildEvaChatHref("/dashboard", "view=integrations", "new"))
      .toBe("/dashboard?view=integrations&chat=new")
  })

  test("maps open state to a shareable chat param", () => {
    expect(getDesiredEvaChatParam(false, "abc123")).toBeNull()
    expect(getDesiredEvaChatParam(true, null)).toBe("new")
    expect(getDesiredEvaChatParam(true, "abc123")).toBe("abc123")
  })

  test("pushes history only for a fresh open", () => {
    expect(shouldPushEvaChatHistory(false, true, null)).toBe(true)
    expect(shouldPushEvaChatHistory(true, true, "abc123")).toBe(false)
    expect(shouldPushEvaChatHistory(true, false, "abc123")).toBe(false)
  })
})

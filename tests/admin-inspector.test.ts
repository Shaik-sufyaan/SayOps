import { describe, expect, test } from "bun:test"
import { pickDefaultTraceMessage } from "../lib/admin-inspector"

describe("pickDefaultTraceMessage", () => {
  test("selects the newest traceable assistant message", () => {
    const message = pickDefaultTraceMessage([
      {
        id: "msg_1",
        role: "assistant",
        hasLlmTrace: true,
        traceExecutionId: "exec_old",
      },
      {
        id: "msg_2",
        role: "user",
        hasLlmTrace: false,
        traceExecutionId: null,
      },
      {
        id: "msg_3",
        role: "assistant",
        hasLlmTrace: true,
        traceExecutionId: "exec_new",
      },
    ] as any)

    expect(message?.id).toBe("msg_3")
    expect(message?.traceExecutionId).toBe("exec_new")
  })

  test("returns null when no assistant message has trace metadata", () => {
    const message = pickDefaultTraceMessage([
      {
        id: "msg_1",
        role: "assistant",
        hasLlmTrace: false,
        traceExecutionId: null,
      },
      {
        id: "msg_2",
        role: "user",
        hasLlmTrace: false,
        traceExecutionId: null,
      },
    ] as any)

    expect(message).toBeNull()
  })
})

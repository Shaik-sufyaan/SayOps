"use client"

import * as React from "react"
import {
  IconMessageChatbot,
  IconX,
  IconMaximize,
  IconMinimize,
  IconPlus,
  IconLoader2,
  IconSparkles,
  IconSearch,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, getChatSummary } from "@/lib/utils"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { EvaLauncherOrb } from "@/components/eva/EvaLauncherOrb"
import { useEvaChatStore } from "@/stores"
import { useViewParams } from "@/hooks/useViewParams"
import { fetchEvaConversationsPage } from "@/lib/api-client"
import type { Conversation } from "@/lib/types"

export interface UniversalChatProps {
  title?: string
  subtitle?: string
  showAttachments?: boolean
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function UniversalChat({
  title = "Eva",
  subtitle = "Your Everything Assistant",
  showAttachments = false,
}: UniversalChatProps) {
  const {
    isOpen,
    isFullscreen,
    conversationId,
    messages,
    isLoading,
    pendingNavigation,
    toggleOpen,
    setOpen,
    toggleFullscreen,
    setSize,
    sendMessage,
    startNewChat,
    clearPendingNavigation,
    pendingInputSeed,
    clearPendingInputSeed,
    loadConversationFromDB,
    size,
  } = useEvaChatStore()

  const { setView } = useViewParams()
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyQuery, setHistoryQuery] = React.useState("")
  const [historyResults, setHistoryResults] = React.useState<Conversation[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const hasStreamingAssistant = messages.some((message) => message.role === "assistant" && message.isStreaming)

  // Tracks whether viewport is below lg (1024px) — used only for conditional inline style
  const [isNarrow, setIsNarrow] = React.useState(false)
  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    setIsNarrow(mql.matches)

    const onChange = (e: MediaQueryListEvent) => {
      setIsNarrow(e.matches)
    }

    mql.addEventListener('change', onChange)

    return () => {
      mql.removeEventListener('change', onChange)
    }
  }, [])

  // Prevent background scroll when Eva is open fullscreen on mobile/tablet
  React.useEffect(() => {
    if (isOpen && isNarrow) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen, isNarrow])

  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  React.useLayoutEffect(() => {
    scrollToBottom("auto")
  }, [conversationId, isFullscreen, isOpen, scrollToBottom])

  React.useEffect(() => {
    scrollToBottom("auto")
  }, [messages.length, scrollToBottom])

  React.useEffect(() => {
    if (!historyOpen) return

    let cancelled = false
    setHistoryLoading(true)

    const timeoutId = window.setTimeout(async () => {
      try {
        const { conversations } = await fetchEvaConversationsPage({
          limit: 12,
          search: historyQuery.trim() || undefined,
        })
        if (!cancelled) {
          setHistoryResults(conversations)
        }
      } catch {
        if (!cancelled) {
          setHistoryResults([])
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }, 120)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [historyOpen, historyQuery])

  // Handle navigate_to_page tool calls — use setView instead of router.push
  React.useEffect(() => {
    if (!pendingNavigation) return
    const { view, agentId } = pendingNavigation
    
    // view is now exactly the view string ('dashboard', 'agent', etc.)
    const targetView = view as any
    const params = agentId ? { agentId } : undefined
    
    setView(targetView, params)
    clearPendingNavigation()
  }, [pendingNavigation, setView, clearPendingNavigation])

  const handleSendMessage = React.useCallback(
    async (content: string, files: File[]) => {
      await sendMessage(content, files)
    },
    [sendMessage]
  )

  const chatContent = (
    <>
      {isNarrow && !isFullscreen ? (
        <div className="flex justify-center border-b border-black/5 px-4 py-2.5 dark:border-white/10">
          <span className="h-1.5 w-12 rounded-full bg-foreground/15" />
        </div>
      ) : null}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-200 via-slate-100 to-purple-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 text-foreground dark:text-white shrink-0">
        <div className="flex items-center gap-2 pl-2">
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="text-[10px] opacity-80">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-foreground dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
            onClick={startNewChat}
            title="New Chat"
          >
            <IconPlus className="size-4" />
          </Button>
          <Popover
            open={historyOpen}
            onOpenChange={(open) => {
              setHistoryOpen(open)
              if (!open) {
                setHistoryQuery("")
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-foreground dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
                title="Search Chats"
              >
                <IconSearch className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="z-[60] w-72 p-2" align="end">
              <div className="px-2 pb-2 pt-1">
                <div className="text-xs font-medium text-muted-foreground">Search Chats</div>
              </div>
              <div className="px-2 pb-2">
                <Input
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="Search previous chats..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto px-1 pb-1">
                {historyLoading ? (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">Searching chats...</div>
                ) : historyResults.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    {historyQuery ? "No chats found" : "No previous chats"}
                  </div>
                ) : (
                  historyResults.map((conversation) => (
                    <button
                      key={conversation.id}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/80",
                        conversationId === conversation.id && "bg-muted"
                      )}
                      onClick={() => {
                        loadConversationFromDB(conversation.id)
                        setHistoryOpen(false)
                        setHistoryQuery("")
                      }}
                    >
                      <div className="truncate text-sm font-medium">
                        {getChatSummary(conversation.metadata, "Eva Chat")}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelativeDate(conversation.started_at)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-foreground dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Minimize" : "Open in full page"}
          >
            {isFullscreen ? (
              <IconMinimize className="size-4" />
            ) : (
              <IconMaximize className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-foreground dark:text-white hover:bg-black/10 dark:hover:bg-white/20"
            onClick={() => {
              if (isFullscreen) {
                toggleFullscreen()
              }
              setOpen(false)
            }}
          >
            <IconX className="size-4" />
          </Button>
        </div>
      </div>

      <div className="eva-chat-surface relative isolate flex min-h-0 flex-1 flex-col overflow-hidden bg-white/92 dark:bg-zinc-950/88">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.0)_48%)] dark:bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.0)_52%)]" />
          <span className="eva-chat-surface__orb eva-chat-surface__orb--halo absolute right-[-12%] top-[-10%] h-[132%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(224,242,254,0.18)_0%,rgba(186,230,253,0.22)_14%,rgba(103,232,249,0.30)_28%,rgba(96,165,250,0.18)_44%,rgba(167,139,250,0.08)_60%,transparent_78%)] dark:bg-[radial-gradient(circle,rgba(191,219,254,0.08)_0%,rgba(125,211,252,0.14)_14%,rgba(34,211,238,0.18)_28%,rgba(56,189,248,0.24)_42%,rgba(129,140,248,0.08)_58%,transparent_78%)] blur-[74px]" />
          <span className="eva-chat-surface__orb eva-chat-surface__orb--core absolute right-[6%] top-[14%] h-[54%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(236,254,255,0.72)_12%,rgba(165,243,252,0.48)_26%,rgba(125,211,252,0.28)_40%,rgba(96,165,250,0.08)_54%,rgba(255,255,255,0.0)_74%)] dark:bg-[radial-gradient(circle,rgba(224,242,254,0.16)_0%,rgba(186,230,253,0.26)_14%,rgba(34,211,238,0.24)_28%,rgba(56,189,248,0.26)_40%,rgba(59,130,246,0.12)_54%,rgba(255,255,255,0.0)_74%)] blur-[42px]" />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.22)_18%,rgba(255,255,255,0.12)_36%,rgba(255,255,255,0.06)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.035)_24%,rgba(255,255,255,0.015)_48%,rgba(255,255,255,0.0)_100%)]" />
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.08)_18%,transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.0)_38%,rgba(255,255,255,0.08)_100%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.015)_18%,transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.0)_38%,rgba(255,255,255,0.02)_100%)]" />
        </div>

        <div
          ref={scrollContainerRef}
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center space-y-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/20">
                <IconSparkles className="size-6 text-primary/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">How can I help?</h3>
                <p className="text-sm text-muted-foreground max-w-[260px]">
                  Ask me about your agents, documents, or business data.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
                {[
                  "Create a new agent",
                  "Show my calls",
                  "Check integrations",
                  "Search documents",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 justify-start"
                    onClick={() => handleSendMessage(suggestion, [])}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-auto flex w-full flex-col gap-4">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={`${msg.id || msg.timestamp || 'msg'}-${i}`}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  toolCalls={msg.toolCalls}
                  isStreaming={msg.isStreaming}
                />
              ))}
              {isLoading && !hasStreamingAssistant && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground shrink-0">
                    <IconMessageChatbot className="size-4" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl bg-muted rounded-tl-none flex items-center gap-2">
                    <IconLoader2 className="size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10">
          <ChatInput
            key={conversationId ?? "new-chat"}
            onSend={handleSendMessage}
            isLoading={isLoading}
            placeholder="Message Eva..."
            loadingPlaceholder="Type to queue a message..."
            showAttachments={showAttachments}
            pendingInputSeed={pendingInputSeed}
            onPendingInputSeedConsumed={clearPendingInputSeed}
          />
        </div>
      </div>
    </>
  )

  const resizeRef = React.useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    }
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!resizeRef.current) return
      
      // Top-left drag means mouse moving LEFT increases width, moving UP increases height
      const deltaX = resizeRef.current.startX - e.clientX
      const deltaY = resizeRef.current.startY - e.clientY

      const maxWidth = window.innerWidth - 48
      const maxHeight = window.innerHeight - 48
      const newWidth = Math.max(320, Math.min(resizeRef.current.startWidth + deltaX, maxWidth))
      const newHeight = Math.max(400, Math.min(resizeRef.current.startHeight + deltaY, maxHeight))
      
      setSize({ width: newWidth, height: newHeight })
    },
    [setSize]
  )

  const handleMouseUp = React.useCallback(() => {
    resizeRef.current = null
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseMove])

  // Fullscreen mode — rendered by PersistentEva in a fixed overlay
  if (isFullscreen) {
    return (
      <div className="flex flex-col h-full bg-background">
        {chatContent}
      </div>
    )
  }

  // Collapsed bubble button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <EvaLauncherOrb assistantName={title} onClick={toggleOpen} />
      </div>
    )
  }

  // Open bubble widget
  // Mobile/tablet (< lg): bottom sheet. Desktop (lg+): fixed bottom-right widget.
  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        isNarrow ? "flex items-end" : "pointer-events-none lg:inset-auto lg:bottom-6 lg:right-6 lg:flex lg:items-end"
      )}
    >
      {isNarrow ? (
        <button
          aria-label={`Close ${title} chat`}
          className="absolute inset-0 bg-slate-950/24 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className={cn("relative min-h-0", isNarrow ? "z-10 w-full" : "pointer-events-auto lg:flex-none")}>
        <div
          className={cn(
            "flex flex-col border overflow-hidden relative shadow-[0_28px_70px_-30px_rgba(15,23,42,0.4)]",
            "bg-background/90 backdrop-blur-lg border-white/55 dark:bg-zinc-950/90 dark:border-white/12",
            isNarrow
              ? "mx-auto h-[min(82vh,720px)] w-full rounded-t-[1.75rem] border-x border-t border-b-0"
              : "w-full h-full rounded-none lg:rounded-xl lg:w-auto lg:h-auto"
          )}
          style={
            isNarrow
              ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
              : {
                  width: size.width,
                  height: size.height,
                  maxWidth: "calc(100vw - 48px)",
                  maxHeight: "calc(100vh - 48px)",
                }
          }
        >
          {/* Resize handle: desktop only */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-50 rounded-tl-xl hover:bg-primary/20 transition-colors hidden lg:block"
            onMouseDown={handleMouseDown}
          />
          {chatContent}
        </div>
      </div>

      <style jsx>{`
        @keyframes evaChatSurfaceHalo {
          0%, 100% {
            transform: translate3d(1%, -2%, 0) scale(0.94);
            opacity: 0.54;
          }
          50% {
            transform: translate3d(-2%, 3%, 0) scale(1.08);
            opacity: 0.92;
          }
        }

        @keyframes evaChatSurfaceCore {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.92);
            opacity: 0.68;
          }
          50% {
            transform: translate3d(-2%, 2%, 0) scale(1.12);
            opacity: 1;
          }
        }

        @keyframes evaChatSurfaceEcho {
          0%, 100% {
            transform: translate3d(2%, 1%, 0) scale(0.9);
            opacity: 0.24;
          }
          50% {
            transform: translate3d(-3%, -2%, 0) scale(1.1);
            opacity: 0.5;
          }
        }

        .eva-chat-surface__orb {
          will-change: transform, opacity;
        }

        .eva-chat-surface__orb--halo {
          animation: evaChatSurfaceHalo 7.6s ease-in-out infinite;
        }

        .eva-chat-surface__orb--core {
          animation: evaChatSurfaceCore 5.8s ease-in-out infinite;
        }

        .eva-chat-surface__orb--echo {
          animation: evaChatSurfaceEcho 8.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

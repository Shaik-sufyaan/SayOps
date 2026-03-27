"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useEvaChatStore } from "@/stores"
import {
  buildEvaChatHref,
  getDesiredEvaChatParam,
  shouldPushEvaChatHistory,
} from "@/lib/eva-chat-url"

/**
 * Bidirectional sync between evaChatStore and ?chat URL param.
 *
 * - On mount: if URL has ?chat=xxx, override store (for shared links / refresh)
 * - Continuously: sync browser back/close events by keeping ?chat aligned with open state
 * - Opening Eva adds a history entry, so mobile back closes the chat instead of leaving onboarding
 */
export function useChatUrlSync() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initializedRef = useRef(false)
  const previousIsOpenRef = useRef(false)
  const previousChatParamRef = useRef<string | null>(null)
  const expectedUrlChatParamRef = useRef<string | null | undefined>(undefined)
  const skipStoreToUrlRef = useRef(false)

  const isOpen = useEvaChatStore((state) => state.isOpen)
  const isFullscreen = useEvaChatStore((state) => state.isFullscreen)
  const conversationId = useEvaChatStore((state) => state.conversationId)
  const setOpen = useEvaChatStore((state) => state.setOpen)
  const setFullscreen = useEvaChatStore((state) => state.setFullscreen)
  const startNewChat = useEvaChatStore((state) => state.startNewChat)
  const loadConversationFromDB = useEvaChatStore((state) => state.loadConversationFromDB)
  const chatParam = searchParams.get("chat")
  const desiredChatParam = getDesiredEvaChatParam(isOpen, conversationId)

  // Initial URL → store bootstrap.
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    previousChatParamRef.current = chatParam
    previousIsOpenRef.current = isOpen

    if (!chatParam) return

    skipStoreToUrlRef.current = true
    if (chatParam === "new") {
      startNewChat()
    } else {
      void loadConversationFromDB(chatParam)
    }
    setOpen(true)
  }, [chatParam, isOpen, loadConversationFromDB, setOpen, startNewChat])

  // Continuous URL → store sync so browser back closes Eva cleanly.
  useEffect(() => {
    if (!initializedRef.current) return

    const previousChatParam = previousChatParamRef.current
    previousChatParamRef.current = chatParam

    if (expectedUrlChatParamRef.current !== undefined) {
      const expectedChatParam = expectedUrlChatParamRef.current
      expectedUrlChatParamRef.current = undefined

      if (chatParam === expectedChatParam) {
        return
      }
    }

    if (chatParam === previousChatParam) return

    if (!chatParam) {
      skipStoreToUrlRef.current = true

      if (isFullscreen) {
        setFullscreen(false)
      }
      if (isOpen) {
        setOpen(false)
      }
      return
    }

    skipStoreToUrlRef.current = true

    if (chatParam === "new") {
      startNewChat()
      setOpen(true)
      return
    }

    if (conversationId !== chatParam) {
      void loadConversationFromDB(chatParam)
    }
    setOpen(true)
  }, [
    chatParam,
    conversationId,
    isFullscreen,
    isOpen,
    loadConversationFromDB,
    setFullscreen,
    setOpen,
    startNewChat,
  ])

  // Store → URL sync.
  useEffect(() => {
    if (!initializedRef.current) return

    if (skipStoreToUrlRef.current) {
      skipStoreToUrlRef.current = false
      previousIsOpenRef.current = isOpen
      return
    }

    if (chatParam === desiredChatParam) {
      previousIsOpenRef.current = isOpen
      return
    }

    const href = buildEvaChatHref(pathname, searchParams.toString(), desiredChatParam)
    const shouldPush = shouldPushEvaChatHistory(previousIsOpenRef.current, isOpen, chatParam)

    previousIsOpenRef.current = isOpen
    expectedUrlChatParamRef.current = desiredChatParam

    if (shouldPush) {
      router.push(href, { scroll: false })
      return
    }

    router.replace(href, { scroll: false })
  }, [chatParam, desiredChatParam, isOpen, pathname, router, searchParams])
}

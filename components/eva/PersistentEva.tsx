"use client"

import React, { Suspense } from "react"
import { useScrollShortcut } from "@/hooks/useScrollShortcut"
import { useChatUrlSync } from "@/hooks/useChatUrlSync"
import { useEvaChatStore, useSidebarStore } from "@/stores"
import { UniversalChat } from "@/components/chat"

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  )
}

function PersistentEvaInner() {
  useScrollShortcut()
  useChatUrlSync()

  const { isOpen, isFullscreen, setOpen, setFullscreen, appendInputSeed } = useEvaChatStore()
  const setCollapsed = useSidebarStore((state) => state.setCollapsed)
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false)
        setOpen(false)
        setCollapsed(true)
        setMobileOpen(false)
        return
      }

      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.length !== 1) return
      if (isEditableTarget(event.target)) return

      event.preventDefault()
      setOpen(true)
      appendInputSeed(event.key)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [appendInputSeed, setCollapsed, setFullscreen, setMobileOpen, setOpen])

  if (isOpen && isFullscreen) {
    // Fullscreen overlay — covers the entire viewport
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <UniversalChat />
      </div>
    )
  }

  // Bubble widget (open or collapsed) — UniversalChat handles both states
  return <UniversalChat />
}

export function PersistentEva() {
  return (
    <Suspense fallback={null}>
      <PersistentEvaInner />
    </Suspense>
  )
}

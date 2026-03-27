"use client"

import { useEffect, useRef } from "react"
import { useEvaChatStore } from "@/stores"

const SCROLL_THRESHOLD = 50
const SCROLL_TIMEOUT = 300
const DESKTOP_SCROLL_SHORTCUT_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)"

export function useScrollShortcut() {
  const toggleOpen = useEvaChatStore((state) => state.toggleOpen)
  const lastScrollTime = useRef(0)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_SCROLL_SHORTCUT_QUERY)
    let isEnabled = mediaQuery.matches

    const handleScroll = () => {
      if (!isEnabled) return

      const now = Date.now()
      const currentScrollY = window.scrollY
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current)

      if (scrollDelta > SCROLL_THRESHOLD) {
        if (now - lastScrollTime.current < SCROLL_TIMEOUT) {
          toggleOpen()
        }
        lastScrollTime.current = now
      }

      lastScrollY.current = currentScrollY
    }

    const handleMediaChange = (event: MediaQueryListEvent) => {
      isEnabled = event.matches

      if (!event.matches) {
        lastScrollTime.current = 0
        lastScrollY.current = window.scrollY
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    mediaQuery.addEventListener("change", handleMediaChange)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      mediaQuery.removeEventListener("change", handleMediaChange)
    }
  }, [toggleOpen])
}

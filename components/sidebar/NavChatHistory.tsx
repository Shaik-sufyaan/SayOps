"use client"

import * as React from "react"
import { IconChevronDown, IconMessage, IconPlus } from "@tabler/icons-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavSection } from "./NavSection"
import { useSidebarStore, useConversationsStore } from "@/stores"
import { useSidebarPaginatedData } from "@/hooks/useSidebarPaginatedData"
import { useAuth } from "@/lib/auth-context"
import type { Conversation } from "@/lib/types"
import { getChatSummary } from "@/lib/utils"
import { useEvaChatStore } from "@/stores/evaChatStore"
import { deleteConversation, fetchEvaConversationsPage } from "@/lib/api-client"
import { toast } from "sonner"
import { SidebarDeleteAction } from "./SidebarDeleteAction"

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NavChatHistory() {
  const { user } = useAuth()
  const { sections } = useSidebarStore()
  const { invalidateAndRefetch, removeConversation } = useConversationsStore()
  const { conversationId, isOpen: isChatOpen } = useEvaChatStore()
  const searchQuery = sections.evaChat?.searchQuery || ""
  const isSectionOpen = sections.evaChat?.isOpen ?? true

  const fetchPage = React.useCallback(async ({
    limit,
    offset,
    searchQuery: nextSearchQuery,
  }: {
    limit: number
    offset: number
    searchQuery: string
  }) => {
    if (!user) {
      return { items: [], hasMore: false }
    }

    const result = await fetchEvaConversationsPage({
      limit,
      offset,
      search: nextSearchQuery,
    })

    return {
      items: result.conversations,
      hasMore: result.hasMore,
    }
  }, [user])

  const {
    items: conversations,
    hasMore,
    loading,
    error,
    loadMore,
    reload,
    setItems,
  } = useSidebarPaginatedData<Conversation>({
    isOpen: isSectionOpen,
    searchQuery,
    fetchPage,
  })

  const handleOpenChat = (chatId: string) => {
    const store = useEvaChatStore.getState()
    store.loadConversationFromDB(chatId)
    store.setOpen(true)
  }

  const handleNewChat = () => {
    const store = useEvaChatStore.getState()
    store.startNewChat()
    store.setOpen(true)
  }

  const handleDeleteChat = async (chatId: string) => {
    await deleteConversation(chatId)

    const store = useEvaChatStore.getState()
    if (store.conversationId === chatId) {
      store.startNewChat()
    }

    removeConversation(chatId)
    setItems((current) => current.filter((conversation) => conversation.id !== chatId))
    void invalidateAndRefetch().catch(() => {})
    toast.success("Chat deleted")
  }

  return (
    <NavSection
      id="evaChat"
      title="Eva Chats"
      icon={<IconMessage className="size-4" />}
      showSearch
      searchPlaceholder="Search chats..."
      isActive={isChatOpen}
      headerAction={
        <button
          onClick={handleNewChat}
          className="text-muted-foreground hover:text-foreground"
          title="New Chat"
        >
          <IconPlus className="size-4" />
        </button>
      }
    >
      <SidebarMenu>
        {loading && conversations.length === 0 ? (
          <SidebarMenuItem>
            <span className="text-xs text-muted-foreground px-2">Loading...</span>
          </SidebarMenuItem>
        ) : error && conversations.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={() => void reload()} className="text-xs text-red-500">
              <span>Failed to load. Tap to retry.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : conversations.length > 0 ? (
          conversations.map((chat) => (
            <SidebarMenuItem key={chat.id}>
              <SidebarMenuButton
                isActive={isChatOpen && conversationId === chat.id}
                onClick={() => handleOpenChat(chat.id)}
                className="pr-12"
              >
                <IconMessage className="size-4 text-muted-foreground" />
                <span className="truncate flex-1">
                  {getChatSummary(chat.metadata, "Eva Chat")}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatRelativeDate(chat.started_at)}
                </span>
              </SidebarMenuButton>
              <SidebarDeleteAction
                itemLabel={getChatSummary(chat.metadata, "Eva Chat")}
                title="Delete this Eva chat?"
                description="This permanently deletes the conversation and its stored messages from Evently. This action cannot be undone."
                confirmLabel="Delete Chat"
                onConfirm={async () => {
                  try {
                    await handleDeleteChat(chat.id)
                  } catch (err) {
                    toast.error((err as Error).message || "Failed to delete chat")
                    throw err
                  }
                }}
              />
            </SidebarMenuItem>
          ))
        ) : (
          <SidebarMenuItem>
            <span className="text-xs text-muted-foreground px-2">
              {searchQuery ? "No chats found" : "No chats yet"}
            </span>
          </SidebarMenuItem>
        )}
        {hasMore && (
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" onClick={() => void loadMore()} className="text-xs text-muted-foreground">
              <IconChevronDown className="size-4" />
              <span>{loading ? "Loading more..." : "Show more"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </NavSection>
  )
}

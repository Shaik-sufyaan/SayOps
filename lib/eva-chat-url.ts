export function getDesiredEvaChatParam(isOpen: boolean, conversationId: string | null): string | null {
  if (!isOpen) return null
  return conversationId ?? "new"
}

export function buildEvaChatHref(
  pathname: string,
  currentSearch: string,
  chatParam: string | null,
): string {
  const params = new URLSearchParams(currentSearch)

  if (chatParam) {
    params.set("chat", chatParam)
  } else {
    params.delete("chat")
  }

  const nextSearch = params.toString()
  return nextSearch ? `${pathname}?${nextSearch}` : pathname
}

export function shouldPushEvaChatHistory(
  wasOpen: boolean,
  isOpen: boolean,
  currentChatParam: string | null,
): boolean {
  return !wasOpen && isOpen && currentChatParam === null
}

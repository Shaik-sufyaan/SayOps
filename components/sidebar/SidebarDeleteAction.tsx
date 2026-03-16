"use client"

import * as React from "react"
import { IconLoader2, IconTrash } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { SidebarMenuAction } from "@/components/ui/sidebar"

interface SidebarDeleteActionProps {
  itemLabel: string
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
}

export function SidebarDeleteAction({
  itemLabel,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: SidebarDeleteActionProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  const handleConfirm = async () => {
    if (isPending) return

    setIsPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <SidebarMenuAction
          showOnHover
          aria-label={`Delete ${itemLabel}`}
          title={`Delete ${itemLabel}`}
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
          disabled={isPending}
        >
          {isPending ? <IconLoader2 className="animate-spin" /> : <IconTrash />}
          <span className="sr-only">Delete {itemLabel}</span>
        </SidebarMenuAction>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? <IconLoader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import * as React from "react"
import { assignExistingNumberToAgent } from "@/lib/api-client"
import type { Agent } from "@/lib/types"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface AssignExistingNumberDialogProps {
  agentId: string
  agentName: string
  currentPhoneNumber?: string | null
  onAssigned: (agent: Agent) => void
  buttonLabel?: string
  buttonVariant?: ButtonProps["variant"]
  buttonSize?: ButtonProps["size"]
  buttonClassName?: string
}

export function AssignExistingNumberDialog({
  agentId,
  agentName,
  currentPhoneNumber,
  onAssigned,
  buttonLabel,
  buttonVariant = "outline",
  buttonSize = "default",
  buttonClassName,
}: AssignExistingNumberDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [vapiPhoneNumberId, setVapiPhoneNumberId] = React.useState("")
  const [vapiAssistantId, setVapiAssistantId] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const resetForm = React.useCallback(() => {
    setPhoneNumber("")
    setVapiPhoneNumberId("")
    setVapiAssistantId("")
    setSubmitting(false)
  }, [])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }, [resetForm])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedPhone = phoneNumber.trim()
    const normalizedVapiPhoneNumberId = vapiPhoneNumberId.trim()
    const normalizedVapiAssistantId = vapiAssistantId.trim()

    if (!normalizedPhone || !normalizedVapiPhoneNumberId) {
      return
    }

    setSubmitting(true)
    try {
      const updatedAgent = await assignExistingNumberToAgent(agentId, {
        phoneNumber: normalizedPhone,
        vapiPhoneNumberId: normalizedVapiPhoneNumberId,
        vapiAssistantId: normalizedVapiAssistantId || undefined,
      })

      onAssigned(updatedAgent)
      toast.success(
        currentPhoneNumber && currentPhoneNumber !== normalizedPhone
          ? `Replaced ${currentPhoneNumber} on ${agentName}`
          : `Bound ${normalizedPhone} to ${agentName}`
      )
      handleOpenChange(false)
    } catch (err: any) {
      setSubmitting(false)
      toast.error(err?.message || "Failed to bind existing number")
    }
  }

  const resolvedButtonLabel = buttonLabel ?? (
    currentPhoneNumber ? "Replace with Existing Vapi Number" : "Use Existing Vapi Number"
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={buttonClassName}
        >
          {resolvedButtonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resolvedButtonLabel}</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Bind a phone number that already exists in your Vapi workspace to {agentName}.
            </span>
            <span className="block">
              Required today: the public phone number and the Vapi phone number ID. The assistant ID is optional.
            </span>
            {currentPhoneNumber ? (
              <span className="block">
                This will replace the agent&apos;s current number: {currentPhoneNumber}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`existing-phone-${agentId}`}>Phone Number</Label>
            <Input
              id={`existing-phone-${agentId}`}
              placeholder="+15551234567"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`existing-vapi-phone-${agentId}`}>Vapi Phone Number ID</Label>
            <Input
              id={`existing-vapi-phone-${agentId}`}
              placeholder="pn_abc123"
              value={vapiPhoneNumberId}
              onChange={(event) => setVapiPhoneNumberId(event.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`existing-vapi-assistant-${agentId}`}>
              Vapi Assistant ID <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id={`existing-vapi-assistant-${agentId}`}
              placeholder="asst_xyz789"
              value={vapiAssistantId}
              onChange={(event) => setVapiAssistantId(event.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !phoneNumber.trim() || !vapiPhoneNumberId.trim()}
            >
              {submitting ? <Spinner className="mr-2" /> : null}
              Save Number
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

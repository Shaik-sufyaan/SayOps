"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  IconUpload,
  IconFile,
  IconX,
  IconCircleCheck,
  IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AssignExistingNumberDialog } from "@/components/agent/AssignExistingNumberDialog"
import { createAgentStream, requestAgentNumber, uploadFiles } from "@/lib/api-client"
import { useViewParams } from "@/hooks/useViewParams"
import { useAgentsStore } from "@/stores/agentsStore"
import type { Agent, AgentCreationStreamEvent } from "@/lib/types"
import { toast } from "sonner"
import { CallForwardingGuide } from "@/components/CallForwardingGuide"

const DRAFT_STORAGE_KEY = "create-agent-draft-v1"

function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return "No number assigned"
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11 && digits[0] === "1") {
    const area = digits.slice(1, 4)
    const mid = digits.slice(4, 7)
    const end = digits.slice(7)
    return `(${area}) ${mid}-${end}`
  }
  return phone
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function describeCreationEvent(event: AgentCreationStreamEvent): string {
  switch (event.type) {
    case "session_created":
      return `Creation session started (${event.session_id})`
    case "waiting_for_docs":
      return `Waiting for ${event.pending_document_ids.length} uploaded document${event.pending_document_ids.length === 1 ? "" : "s"} to finish processing...`
    case "website_analysis":
      return event.status === "started"
        ? `Analyzing ${event.website_url}...`
        : "Website analysis completed."
    case "eva_research":
      return event.status === "started"
        ? "Eva is researching your sources..."
        : "Eva research completed."
    case "prompt_synthesis":
      return event.status === "started"
        ? "Synthesizing the final system prompt..."
        : "System prompt synthesized."
    case "provisioning":
      return event.status === "started"
        ? "Provisioning the new agent..."
        : "Agent provisioned."
    case "done":
      return "Agent created successfully."
    case "error":
      return event.message
    default:
      return "Creating agent..."
  }
}

export function CreateAgentPanel() {
  const { setView } = useViewParams()
  const { addAgent, updateAgent: updateAgentInStore } = useAgentsStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [topIntents, setTopIntents] = useState("")
  const [policies, setPolicies] = useState("")
  const [toneVoice, setToneVoice] = useState("")
  const [escalationRules, setEscalationRules] = useState("")
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [creationStatus, setCreationStatus] = useState("")

  const [showSuccess, setShowSuccess] = useState(false)
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null)
  const [displayPhone, setDisplayPhone] = useState("")
  const [isRequestingNumber, setIsRequestingNumber] = useState(false)
  const [numberRequested, setNumberRequested] = useState(false)

  const steps = useMemo(
    () => [
      { id: "name", title: "What should customers call this agent?", optional: false },
      { id: "website", title: "What is your website URL?", optional: true },
      { id: "intents", title: "What should this agent handle (top intents)?", optional: false },
      { id: "docs", title: "Upload docs for this agent.", optional: true },
      { id: "policies", title: "What policies should the agent follow?", optional: false },
      { id: "tone", title: "What tone/voice should the agent use?", optional: false },
      { id: "escalation", title: "When should this escalate to a human?", optional: false },
      { id: "additional", title: "Any additional instructions?", optional: true },
    ],
    []
  )

  const persistDraft = useCallback(
    (stepIndex: number = currentStep) => {
      if (typeof window === "undefined") return
      const draft = {
        stepIndex,
        name,
        websiteUrl,
        topIntents,
        policies,
        toneVoice,
        escalationRules,
        additionalInstructions,
        fileNames: files.map((f) => f.name),
        updatedAt: Date.now(),
      }
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    },
    [
      additionalInstructions,
      currentStep,
      escalationRules,
      files,
      name,
      policies,
      toneVoice,
      topIntents,
      websiteUrl,
    ]
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      setName(parsed.name || "")
      setWebsiteUrl(parsed.websiteUrl || "")
      setTopIntents(parsed.topIntents || "")
      setPolicies(parsed.policies || "")
      setToneVoice(parsed.toneVoice || "")
      setEscalationRules(parsed.escalationRules || "")
      setAdditionalInstructions(parsed.additionalInstructions || "")
      setCurrentStep(Math.max(0, Math.min((parsed.stepIndex as number) || 0, steps.length - 1)))
      toast.success("Loaded your saved draft")
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [steps.length])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
      setTimeout(() => persistDraft(), 0)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setTimeout(() => persistDraft(), 0)
  }

  const handleNext = () => {
    if (currentStep === 0 && !name.trim()) {
      toast.error("Please enter an agent name")
      return
    }

    const next = Math.min(currentStep + 1, steps.length - 1)
    persistDraft(next)
    setCurrentStep(next)
  }

  const handleBack = () => {
    const prev = Math.max(currentStep - 1, 0)
    persistDraft(prev)
    setCurrentStep(prev)
  }

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for your agent")
      return
    }

    setIsCreating(true)
    setCreationStatus(files.length > 0 ? "Uploading documents..." : "Starting agent creation...")

    try {
      const uploadedDocumentIds: string[] = []
      if (files.length > 0) {
        for (const file of files) {
          const uploaded = await uploadFiles([file])
          uploadedDocumentIds.push(uploaded.documentId)
        }
      }

      const { agent } = await createAgentStream(
        {
          requested_name: name.trim(),
          website_url: websiteUrl.trim() || undefined,
          owner_context: {
            top_intents: splitLines(topIntents),
            policies: splitLines(policies),
            tone_voice: toneVoice.trim() || undefined,
            escalation_rules: splitLines(escalationRules),
            additional_instructions: splitLines(additionalInstructions),
          },
          document_ids: uploadedDocumentIds,
        },
        {
          onEvent: (event) => setCreationStatus(describeCreationEvent(event)),
        },
      )

      setCreatedAgent(agent)
      addAgent(agent)
      setDisplayPhone(formatPhoneForDisplay(agent.phone_number))
      setShowSuccess(true)
      clearDraft()
      toast.success("Agent created successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent")
    } finally {
      setIsCreating(false)
    }
  }

  const handleRequestNumber = async () => {
    if (!createdAgent || createdAgent.phone_number || isRequestingNumber || numberRequested) return
    setIsRequestingNumber(true)
    try {
      await requestAgentNumber(createdAgent.id)
      setNumberRequested(true)
      toast.success("Number request sent to eva@0lumens.com")
    } catch (err: any) {
      toast.error(err.message || "Failed to send number request")
    } finally {
      setIsRequestingNumber(false)
    }
  }

  const handleAssignedNumber = (agent: Agent) => {
    setCreatedAgent(agent)
    setDisplayPhone(formatPhoneForDisplay(agent.phone_number))
    setNumberRequested(false)
    updateAgentInStore(agent.id, agent)
  }

  if (showSuccess && createdAgent) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-md animate-in zoom-in-95 fade-in flex-col items-center gap-6 rounded-2xl border bg-card p-8 shadow-lg duration-500">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <IconCircleCheck className="size-10 text-green-600 dark:text-green-400" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold">Your agent is live!</h2>
            <p className="mt-1 text-muted-foreground">{createdAgent.name}</p>
          </div>

          <div className="w-full rounded-lg border bg-muted/50 px-6 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned Phone Number</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-wide">{displayPhone}</p>
            {createdAgent.phone_number && (
              <div className="mt-2 flex justify-center">
                <CallForwardingGuide phoneNumber={createdAgent.phone_number} />
              </div>
            )}
          </div>

          <AssignExistingNumberDialog
            agentId={createdAgent.id}
            agentName={createdAgent.name}
            currentPhoneNumber={createdAgent.phone_number}
            onAssigned={handleAssignedNumber}
            buttonSize="lg"
            buttonClassName="w-full"
          />

          <Button
            size="lg"
            variant={createdAgent.phone_number || numberRequested ? "secondary" : "default"}
            onClick={handleRequestNumber}
            disabled={Boolean(createdAgent.phone_number) || isRequestingNumber || numberRequested}
            className="w-full"
          >
            {createdAgent.phone_number ? (
              "Number Assigned"
            ) : isRequestingNumber ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Sending Request...
              </>
            ) : numberRequested ? (
              "Request Sent"
            ) : (
              "Request Number"
            )}
          </Button>

          <Button size="lg" onClick={() => setView("dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create Your AI Agent</h1>
          <p className="mt-2 text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].optional ? "Optional" : "Required"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  placeholder="e.g. Front Desk, Sales Assistant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Eva will analyze this website during creation and merge it with your notes and uploaded docs.
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-2">
                <Label htmlFor="top-intents">Top Intents</Label>
                <Textarea
                  id="top-intents"
                  rows={6}
                  placeholder="List the top requests/questions this agent should handle..."
                  value={topIntents}
                  onChange={(e) => setTopIntents(e.target.value)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50">
                <IconUpload className="size-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT up to 10MB</p>
                </div>
                <Input
                  type="file"
                  multiple
                  className="hidden"
                  id="create-agent-file-upload"
                  onChange={handleFileInput}
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="create-agent-file-upload" className="cursor-pointer">Browse Files</label>
                </Button>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-background text-sm">
                    <div className="flex items-center gap-2">
                      <IconFile className="size-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => removeFile(i)}>
                      <IconX className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-2">
                <Label htmlFor="policies">Policies</Label>
                <Textarea
                  id="policies"
                  rows={6}
                  placeholder="Refunds, cancellations, appointment, payment, shipping, etc."
                  value={policies}
                  onChange={(e) => setPolicies(e.target.value)}
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-2">
                <Label htmlFor="tone-voice">Tone/Voice</Label>
                <Textarea
                  id="tone-voice"
                  rows={5}
                  placeholder="Professional, friendly, concise, empathetic, etc."
                  value={toneVoice}
                  onChange={(e) => setToneVoice(e.target.value)}
                />
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-2">
                <Label htmlFor="escalation-rules">Escalation Rules</Label>
                <Textarea
                  id="escalation-rules"
                  rows={6}
                  placeholder="Define when to hand off to a human..."
                  value={escalationRules}
                  onChange={(e) => setEscalationRules(e.target.value)}
                />
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-2">
                <Label htmlFor="additional-instructions">Additional Instructions</Label>
                <Textarea
                  id="additional-instructions"
                  rows={6}
                  placeholder="Anything else the agent should know..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                />
              </div>
            )}

            {isCreating && creationStatus ? (
              <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {creationStatus}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isCreating}>
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={isCreating}>Next</Button>
              ) : (
                <Button size="lg" onClick={handleCreate} disabled={isCreating} className="h-11">
                  {isCreating ? (
                    <>
                      <IconLoader2 className="mr-2 animate-spin" /> Creating Agent...
                    </>
                  ) : (
                    "Create Agent & Assign Number"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

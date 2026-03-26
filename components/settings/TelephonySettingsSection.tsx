"use client"

import * as React from "react"
import { toast } from "sonner"
import { IconPhone, IconRefresh, IconShieldCheck, IconExternalLink } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  assignExistingOrgPhoneNumber,
  ensureTelephonySubaccount,
  fetchAgents,
  fetchTelephonyOverview,
  provisionPrimaryOrgPhoneNumber,
  refreshPrimaryNumberVerification,
  saveSmsRoutingAgent,
  saveTelephonyProfile,
  submitPrimaryNumberVerification,
} from "@/lib/api-client"
import type { Agent, OrgTelephonyProfile, TelephonyOverview } from "@/lib/types"

const FALLBACK_ROUTING_VALUE = "__fallback__"

type ProfileDraft = {
  business_name: string
  business_website: string
  notification_email: string
  use_case_categories_text: string
  use_case_summary: string
  production_message_sample: string
  opt_in_workflow_description: string
  opt_in_image_urls_text: string
  opt_in_confirmation_message: string
  help_message_sample: string
  privacy_policy_url: string
  terms_and_conditions_url: string
  opt_in_keywords_text: string
  message_volume: string
  additional_information: string
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildDraft(profile: OrgTelephonyProfile): ProfileDraft {
  return {
    business_name: profile.business_name ?? "",
    business_website: profile.business_website ?? "",
    notification_email: profile.notification_email ?? "",
    use_case_categories_text: (profile.use_case_categories ?? []).join(", "),
    use_case_summary: profile.use_case_summary ?? "",
    production_message_sample: profile.production_message_sample ?? "",
    opt_in_workflow_description: profile.opt_in_workflow_description ?? "",
    opt_in_image_urls_text: (profile.opt_in_image_urls ?? []).join("\n"),
    opt_in_confirmation_message: profile.opt_in_confirmation_message ?? "",
    help_message_sample: profile.help_message_sample ?? "",
    privacy_policy_url: profile.privacy_policy_url ?? "",
    terms_and_conditions_url: profile.terms_and_conditions_url ?? "",
    opt_in_keywords_text: (profile.opt_in_keywords ?? []).join(", "),
    message_volume: profile.message_volume ?? "1,000",
    additional_information: profile.additional_information ?? "",
  }
}

export function TelephonySettingsSection() {
  const [overview, setOverview] = React.useState<TelephonyOverview | null>(null)
  const [draft, setDraft] = React.useState<ProfileDraft | null>(null)
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [existingPhone, setExistingPhone] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [accessDenied, setAccessDenied] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [workingAction, setWorkingAction] = React.useState<string | null>(null)
  const [selectedRoutingAgentId, setSelectedRoutingAgentId] = React.useState(FALLBACK_ROUTING_VALUE)

  const loadOverview = React.useCallback(async () => {
    setLoading(true)
    setAccessDenied(false)
    try {
      const [next, nextAgents] = await Promise.all([
        fetchTelephonyOverview(),
        fetchAgents(),
      ])
      setOverview(next)
      setDraft(buildDraft(next.profile))
      setAgents(nextAgents)
      setSelectedRoutingAgentId(
        next.hasExplicitSmsRouting && next.smsRoutingAgentId
          ? next.smsRoutingAgentId
          : FALLBACK_ROUTING_VALUE
      )
    } catch (error: any) {
      if (error?.message === "Admin or owner access required") {
        setAccessDenied(true)
      } else {
        toast.error(error?.message || "Failed to load telephony settings")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const primaryPhone = overview?.phoneBindings.find((binding) => binding.is_primary && binding.status === "active") ?? null
  const smsEligibleAgents = React.useMemo(
    () => agents.filter((agent) => agent.is_active && (agent.platforms ?? []).includes("sms")),
    [agents]
  )
  const currentRoutingAgent = React.useMemo(
    () => agents.find((agent) => agent.id === overview?.smsRoutingAgentId) ?? null,
    [agents, overview?.smsRoutingAgentId]
  )

  const updateDraft = (key: keyof ProfileDraft, value: string) => {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const next = await saveTelephonyProfile({
        business_name: draft.business_name,
        business_website: draft.business_website,
        notification_email: draft.notification_email,
        use_case_categories: splitCsv(draft.use_case_categories_text),
        use_case_summary: draft.use_case_summary,
        production_message_sample: draft.production_message_sample,
        opt_in_workflow_description: draft.opt_in_workflow_description,
        opt_in_image_urls: splitLines(draft.opt_in_image_urls_text),
        opt_in_confirmation_message: draft.opt_in_confirmation_message,
        help_message_sample: draft.help_message_sample,
        privacy_policy_url: draft.privacy_policy_url,
        terms_and_conditions_url: draft.terms_and_conditions_url,
        opt_in_keywords: splitCsv(draft.opt_in_keywords_text),
        message_volume: draft.message_volume,
        additional_information: draft.additional_information,
      })
      setOverview(next)
      setDraft(buildDraft(next.profile))
      toast.success("Telephony profile saved")
    } catch (error: any) {
      toast.error(error?.message || "Failed to save telephony profile")
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (actionKey: string, action: () => Promise<TelephonyOverview>, successMessage: string) => {
    setWorkingAction(actionKey)
    try {
      const next = await action()
      setOverview(next)
      setDraft(buildDraft(next.profile))
      toast.success(successMessage)
    } catch (error: any) {
      toast.error(error?.message || "Action failed")
    } finally {
      setWorkingAction(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Telephony</CardTitle>
          <CardDescription>Loading your organization messaging line configuration…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (accessDenied) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <IconPhone className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Telephony</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Messaging Line</CardTitle>
            <CardDescription>
              Only workspace owners and admins can manage toll-free verification, phone provisioning, and SMS routing.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    )
  }

  if (!draft) {
    return null
  }

  const currentOverview = overview!

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <IconPhone className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Telephony</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-lg">Organization Messaging Line</CardTitle>
              <CardDescription>
                Manage the primary toll-free SMS/MMS line, toll-free verification profile, and generated privacy/terms URLs for this workspace.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={currentOverview.profile.twilio_subaccount_sid ? "default" : "outline"}>
                {currentOverview.profile.twilio_subaccount_sid ? "Subaccount Ready" : "Subaccount Missing"}
              </Badge>
              <Badge variant={primaryPhone ? "default" : "outline"}>
                {primaryPhone ? primaryPhone.phone_number : "No Primary Number"}
              </Badge>
              <Badge variant={primaryPhone?.verification_status === "approved" ? "default" : "secondary"}>
                {primaryPhone?.verification_status ?? "Verification Unsubmitted"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telephony-business-name">Business Name</Label>
              <Input id="telephony-business-name" value={draft.business_name} onChange={(event) => updateDraft("business_name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephony-business-website">Business Website</Label>
              <Input id="telephony-business-website" value={draft.business_website} onChange={(event) => updateDraft("business_website", event.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephony-notification-email">Notification Email</Label>
              <Input id="telephony-notification-email" value={draft.notification_email} onChange={(event) => updateDraft("notification_email", event.target.value)} placeholder="ops@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephony-volume">Monthly Volume</Label>
              <Input id="telephony-volume" value={draft.message_volume} onChange={(event) => updateDraft("message_volume", event.target.value)} placeholder="1,000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-categories">Use Case Categories</Label>
            <Input
              id="telephony-categories"
              value={draft.use_case_categories_text}
              onChange={(event) => updateDraft("use_case_categories_text", event.target.value)}
              placeholder="CUSTOMER_CARE, EVENTS"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-summary">Use Case Summary</Label>
            <Textarea
              id="telephony-summary"
              value={draft.use_case_summary}
              onChange={(event) => updateDraft("use_case_summary", event.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-sample">Production Message Sample</Label>
            <Textarea
              id="telephony-sample"
              value={draft.production_message_sample}
              onChange={(event) => updateDraft("production_message_sample", event.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-opt-in-description">Opt-In Workflow Description</Label>
            <Textarea
              id="telephony-opt-in-description"
              value={draft.opt_in_workflow_description}
              onChange={(event) => updateDraft("opt_in_workflow_description", event.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-opt-in-images">Proof of Consent URLs</Label>
            <Textarea
              id="telephony-opt-in-images"
              value={draft.opt_in_image_urls_text}
              onChange={(event) => updateDraft("opt_in_image_urls_text", event.target.value)}
              rows={3}
              placeholder="One public image or document URL per line"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telephony-help-message">Help Message Sample</Label>
              <Textarea
                id="telephony-help-message"
                value={draft.help_message_sample}
                onChange={(event) => updateDraft("help_message_sample", event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephony-opt-in-confirmation">Opt-In Confirmation Message</Label>
              <Textarea
                id="telephony-opt-in-confirmation"
                value={draft.opt_in_confirmation_message}
                onChange={(event) => updateDraft("opt_in_confirmation_message", event.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telephony-privacy-url">Privacy Policy URL</Label>
              <Input id="telephony-privacy-url" value={draft.privacy_policy_url} onChange={(event) => updateDraft("privacy_policy_url", event.target.value)} placeholder={currentOverview.generatedPrivacyPolicyUrl} />
              <a href={currentOverview.generatedPrivacyPolicyUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                View generated privacy policy <IconExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephony-terms-url">Terms URL</Label>
              <Input id="telephony-terms-url" value={draft.terms_and_conditions_url} onChange={(event) => updateDraft("terms_and_conditions_url", event.target.value)} placeholder={currentOverview.generatedTermsUrl} />
              <a href={currentOverview.generatedTermsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                View generated terms <IconExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-opt-in-keywords">Opt-In Keywords</Label>
            <Input
              id="telephony-opt-in-keywords"
              value={draft.opt_in_keywords_text}
              onChange={(event) => updateDraft("opt_in_keywords_text", event.target.value)}
              placeholder="START"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephony-extra-info">Additional Information</Label>
            <Textarea
              id="telephony-extra-info"
              value={draft.additional_information}
              onChange={(event) => updateDraft("additional_information", event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">SMS Routing Agent</p>
              <p className="text-sm text-muted-foreground">
                Choose which internal agent handles inbound texts on your organization messaging line.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="telephony-sms-routing-agent">Inbound SMS Agent</Label>
                <Select value={selectedRoutingAgentId} onValueChange={setSelectedRoutingAgentId}>
                  <SelectTrigger id="telephony-sms-routing-agent">
                    <SelectValue placeholder="Use the first active SMS-enabled agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FALLBACK_ROUTING_VALUE}>Use first active SMS-enabled agent</SelectItem>
                    {smsEligibleAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  runAction(
                    "routing-agent",
                    () => saveSmsRoutingAgent(selectedRoutingAgentId === FALLBACK_ROUTING_VALUE ? null : selectedRoutingAgentId),
                    "SMS routing updated"
                  )
                }
                disabled={workingAction !== null || (smsEligibleAgents.length === 0 && selectedRoutingAgentId === FALLBACK_ROUTING_VALUE)}
              >
                {workingAction === "routing-agent" ? "Saving Route..." : "Save Routing"}
              </Button>
            </div>

            {smsEligibleAgents.length === 0 ? (
              <p className="text-sm text-amber-700">
                No active agents have SMS enabled yet. Turn on the SMS basic channel in an agent’s settings first.
              </p>
            ) : currentOverview.hasExplicitSmsRouting ? (
              <p className="text-sm text-muted-foreground">
                Explicit route active for {currentRoutingAgent?.name ?? "the selected agent"}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No explicit route is set. The first active SMS-enabled agent is currently used as a fallback.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Telephony Profile"}
            </Button>
            <Button
              variant="outline"
              onClick={() => runAction("subaccount", () => ensureTelephonySubaccount(), "Twilio subaccount ready")}
              disabled={workingAction !== null}
            >
              {workingAction === "subaccount" ? "Creating Subaccount..." : "Create / Refresh Subaccount"}
            </Button>
            <Button
              variant="outline"
              onClick={() => runAction("provision", () => provisionPrimaryOrgPhoneNumber(), "Primary messaging number provisioned")}
              disabled={workingAction !== null || !currentOverview.profile.twilio_subaccount_sid}
            >
              {workingAction === "provision" ? "Provisioning..." : "Provision Primary Number"}
            </Button>
            <Button
              variant="outline"
              onClick={() => runAction("submit", () => submitPrimaryNumberVerification(), "Verification submitted")}
              disabled={workingAction !== null || !primaryPhone}
            >
              <IconShieldCheck className="mr-2 size-4" />
              {workingAction === "submit" ? "Submitting..." : "Submit Verification"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => runAction("refresh", () => refreshPrimaryNumberVerification(), "Verification status refreshed")}
              disabled={workingAction !== null || !primaryPhone?.verification_sid}
            >
              <IconRefresh className="mr-2 size-4" />
              {workingAction === "refresh" ? "Refreshing..." : "Refresh Status"}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="telephony-existing-phone">Assign Existing Twilio Number</Label>
              <Input
                id="telephony-existing-phone"
                value={existingPhone}
                onChange={(event) => setExistingPhone(event.target.value)}
                placeholder="+18885551234"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => runAction("assign-existing", () => assignExistingOrgPhoneNumber(existingPhone), "Existing number assigned")}
              disabled={workingAction !== null || existingPhone.trim().length === 0 || !currentOverview.profile.twilio_subaccount_sid}
            >
              {workingAction === "assign-existing" ? "Assigning..." : "Assign Existing Number"}
            </Button>
          </div>

          {primaryPhone ? (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
              <p className="text-sm font-medium">Primary Number</p>
              <p className="text-lg font-semibold">{primaryPhone.phone_number}</p>
              <p className="text-sm text-muted-foreground">
                Verification status: {primaryPhone.verification_status ?? "unsubmitted"}
              </p>
              {primaryPhone.verification_rejection_reason ? (
                <p className="text-sm text-amber-700">
                  Rejection reason: {primaryPhone.verification_rejection_reason}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            SMS routing agent: {currentOverview.smsRoutingAgentId ?? "No active SMS-enabled agent is available yet."}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

export type LandingMetric = {
  label: string
  value: string
}

export type LandingCard = {
  title: string
  description: string
}

export type LandingStep = LandingCard & {
  step: string
}

export type LandingFaq = {
  question: string
  answer: string
}

export type DemoSpeechEvent = {
  type: "speech"
  speaker: "agent" | "customer"
  text: string
}

export type DemoActionEvent = {
  type: "action"
  text: string
}

export type DemoRingingEvent = {
  type: "ringing"
  durationMs: number
}

export type DemoConnectedEvent = {
  type: "connected"
}

export type DemoCallEndEvent = {
  type: "call_end"
  durationLabel: string
}

export type DemoEmailAppearEvent = {
  type: "email_appear"
}

export type DemoEmailOpenEvent = {
  type: "email_open"
}

export type DemoClaimCompleteEvent = {
  type: "claim_complete"
}

export type DemoProvisioningEvent = {
  type: "provisioning"
}

export type DemoEvent =
  | DemoSpeechEvent
  | DemoActionEvent
  | DemoRingingEvent
  | DemoConnectedEvent
  | DemoCallEndEvent
  | DemoEmailAppearEvent
  | DemoEmailOpenEvent
  | DemoClaimCompleteEvent
  | DemoProvisioningEvent

export type TwoPhoneScriptLine = {
  speaker: "agent" | "customer"
  text: string
  phone2State?: number
}

export type DemoOwnerMessage = {
  triggerAfterEvent: number
  text: string
  tone?: "default" | "alert"
}

export type DemoScenario = {
  label: string
  business: string
  callerName: string
  callerNumber: string
  ownerLabel: string
  accent: string
  summary: string
  events: DemoEvent[]
  ownerMessages: DemoOwnerMessage[]
}

export const demoSpeedOptions = [
  { label: "Slow", value: 2.2 },
  { label: "Normal", value: 2.9 },
  { label: "Fast", value: 3.6 },
  { label: "Instant", value: 10 },
] as const

export const landingContent = {
  brand: "SpeakOps",
  eyebrow: "AI customer support that acts like an operator, not a script",
  hero: {
    headline: "Your AI Call Agent for Recovering Lost Revenue",
    subhead:
      "Upload your context, connect your tools, get a dedicated number. Go live in minutes — we recover customers while you focus on work.",
    primaryCta: "Continue with Google",
    secondaryCta: "Jump to live demo",
    microCopy: "Go live in minutes. One business number. Real actions. Real summaries.",
  },
  proof: [
    { value: "5 min", label: "typical setup" },
    { value: "24/7", label: "answer coverage" },
    { value: "30+", label: "supported languages" },
  ] satisfies LandingMetric[],
  benefitColumns: [
    {
      title: "For the customer",
      description:
        "They call one number, ask naturally, and get a response without bouncing between menu trees and support inboxes.",
    },
    {
      title: "For the owner",
      description:
        "You see the result immediately as a clean summary, not a recording you need to replay later.",
    },
  ] satisfies LandingCard[],
  capabilities: [
    {
      title: "Conversational voice agent",
      description:
        "Customers talk in plain language while the agent answers with your policies, catalog, and business context.",
    },
    {
      title: "Context from your business",
      description:
        "Upload site content, PDFs, menus, SOPs, or support material so the agent knows what it is talking about.",
    },
    {
      title: "Action inside your stack",
      description:
        "Connect tools like Shopify, HubSpot, and Zendesk so the agent can create tickets, process updates, and complete bounded workflows.",
    },
    {
      title: "SMS summaries for operators",
      description:
        "Every completed call turns into a short owner-ready summary instead of another thing to manually review.",
    },
    {
      title: "Human escalation when needed",
      description:
        "If the request is too sensitive or too complex, the handoff includes context so the customer does not repeat themselves.",
    },
    {
      title: "Guardrails and scope",
      description:
        "Choose exactly what the agent can read, what it can change, and when it must ask a human for approval.",
    },
  ] satisfies LandingCard[],
  steps: [
    {
      step: "01",
      title: "Sign in",
      description: "Start with Google and create the workspace in one step.",
    },
    {
      step: "02",
      title: "Upload context",
      description:
        "Give the agent your policies, service details, support docs, menus, product info, or site content.",
    },
    {
      step: "03",
      title: "Connect systems",
      description:
        "Link the operational tools the agent should read from or act inside, with the scope you choose.",
    },
    {
      step: "04",
      title: "Go live - new number",
      description:
        "The agent starts taking calls, completing routine work, and escalating only when it should.",
    },
  ] satisfies LandingStep[],
  scenarios: [
    {
      title: "Cafe and retail",
      description:
        "Confirm inventory, reserve items, answer simple questions, and reduce call interruptions during service hours.",
    },
    {
      title: "E-commerce support",
      description:
        "Handle missing deliveries, returns, refunds, and order updates in the same call instead of sending customers elsewhere.",
    },
    {
      title: "Field services",
      description:
        "Book jobs, capture issue details, quote standard work, and keep technicians focused on the job site.",
    },
  ] satisfies LandingCard[],
  security: [
    {
      title: "Scoped permissions",
      description:
        "The agent only performs the actions you explicitly allow, from read-only visibility to bounded operational actions.",
    },
    {
      title: "Escalation paths",
      description:
        "High-risk requests, edge cases, or uncertain outcomes can be routed to a human with full conversation context attached.",
    },
    {
      title: "Transparent execution",
      description:
        "Operators can see what happened in the call, what the agent did, and what updates were sent back out.",
    },
  ] satisfies LandingCard[],
  faqs: [
    {
      question: "How long does setup actually take?",
      answer:
        "Most teams can create the workspace, upload context, connect their first tool, and configure a number in a few minutes.",
    },
    {
      question: "Can the agent take actions or only answer questions?",
      answer:
        "It can do both. After you connect your systems and define permissions, it can perform bounded tasks such as ticket creation, order lookups, and refund-related workflows.",
    },
    {
      question: "What happens when the agent is not confident?",
      answer:
        "It escalates with the transcript, customer details, and attempted steps so the human takes over with context already attached.",
    },
    {
      question: "Do I control the data and permissions?",
      answer:
        "Yes. You choose the source material, the integrations, and the action scope for each connected system.",
    },
  ] satisfies LandingFaq[],
  demo: {
    heading: "See the agent in action",
    subtitle:
      "Watch the customer call unfold on one phone while the owner receives the operational summary on the other.",
    helperText:
      "Pick a scenario, replay the flow, and adjust the speed. The product story should be visible without explanation.",
    supportPhoneNumber: "+1 (470) 293-9459",
    scenarioOrder: ["hairsalon", "ecommerce", "repair"] as const,
    scenarios: {
      hairsalon: {
        label: "Hair Salon",
        business: "Stella's Hair Studio",
        callerName: "Marcus",
        callerNumber: "+1 (555) 312-7640",
        ownerLabel: "Business Owner",
        accent: "#be185d",
        summary: "Books a cut and color appointment, confirms the slot, and sends the owner a booking summary.",
        events: [
          { type: "ringing", durationMs: 1500 },
          { type: "connected" },
          { type: "speech", speaker: "agent", text: "Thank you for calling Stella's Hair Studio. How can I help you today?" },
          { type: "speech", speaker: "customer", text: "Hi, I'd like to book a haircut and color for this Friday." },
          { type: "speech", speaker: "agent", text: "Absolutely. Let me check Friday's availability for you." },
          { type: "action", text: "Checking stylist calendar for Friday..." },
          { type: "speech", speaker: "agent", text: "We have openings at 11 AM and 2 PM on Friday. A cut and color takes about 2 hours. Which slot works for you?" },
          { type: "speech", speaker: "customer", text: "2 PM would be perfect." },
          { type: "speech", speaker: "agent", text: "Great. Can I get your name to confirm the booking?" },
          { type: "speech", speaker: "customer", text: "Marcus." },
          { type: "action", text: "Booking appointment: Marcus — Cut & Color, Friday 2:00 PM" },
          { type: "speech", speaker: "agent", text: "Done, Marcus. You're booked for a cut and color this Friday at 2 PM. We'll send you a reminder the morning of your appointment." },
          { type: "speech", speaker: "customer", text: "That's great, thank you." },
          { type: "speech", speaker: "agent", text: "Looking forward to seeing you Friday. Have a great day!" },
          { type: "call_end", durationLabel: "0:28" },
        ],
        ownerMessages: [
          {
            triggerAfterEvent: 11,
            text: "New booking: Marcus — Cut & Color, Friday at 2:00 PM. Appointment confirmed.",
          },
        ],
      },
      ecommerce: {
        label: "E-commerce",
        business: "Mateo's Outdoor Gear",
        callerName: "Rachel",
        callerNumber: "+1 (555) 876-5432",
        ownerLabel: "Business Owner",
        accent: "#059669",
        summary: "Looks up the order, processes the refund path, and closes with owner updates.",
        events: [
          { type: "ringing", durationMs: 1500 },
          { type: "connected" },
          { type: "speech", speaker: "agent", text: "Hello, Mateo's Outdoor Gear. How can I assist you?" },
          { type: "speech", speaker: "customer", text: "My order H-1993 shows delivered but it never arrived. I'd like a refund." },
          { type: "speech", speaker: "agent", text: "I'm sorry to hear that, Rachel. Let me pull up your order." },
          { type: "action", text: "Looking up order H-1993 in HubSpot" },
          { type: "speech", speaker: "agent", text: "I found order H-1993. Tracking shows delivered at 2:12 PM to the front door. I'll initiate a claim and process a full refund of $42. Would you prefer a refund or a replacement?" },
          { type: "speech", speaker: "customer", text: "Refund please." },
          { type: "action", text: "Processing refund for $42.00 via Stripe" },
          { type: "speech", speaker: "agent", text: "Refund of $42 processed. Confirmation sent to your email. Please allow 3-5 business days. I've also filed a courier claim and created ticket T-772." },
          { type: "action", text: "Ticket T-772 created and courier claim opened" },
          { type: "speech", speaker: "customer", text: "That was fast. Thank you." },
          { type: "speech", speaker: "agent", text: "Happy to help. Have a good day, Rachel." },
          { type: "call_end", durationLabel: "0:35" },
        ],
        ownerMessages: [
          { triggerAfterEvent: 8, text: "Refund in progress: $42 for order H-1993 marked as not delivered. Processing via Stripe." },
          { triggerAfterEvent: 13, text: "Refund completed for H-1993. Ticket T-772 created and courier claim opened. 35s call." },
        ],
      },
      repair: {
        label: "Repair Shop",
        business: "Ahmed's Appliance Repair",
        callerName: "Lisa",
        callerNumber: "+1 (555) 654-3210",
        ownerLabel: "Business Owner",
        accent: "#dc2626",
        summary: "Books the job, adds a ticket, and upsells the maintenance plan during the same call.",
        events: [
          { type: "ringing", durationMs: 1500 },
          { type: "connected" },
          { type: "speech", speaker: "agent", text: "Ahmed's Appliance Repair, how can I help you?" },
          { type: "speech", speaker: "customer", text: "Hi, my oven stopped heating. I think it's the heating element. Can someone come take a look?" },
          { type: "speech", speaker: "agent", text: "I can help with that. Let me check our available time slots." },
          { type: "action", text: "Checking technician calendar" },
          { type: "speech", speaker: "agent", text: "We have a tech available tomorrow at 9 AM. The diagnostic fee is $45. If we do the repair on-site, that fee is waived. Does 9 AM work?" },
          { type: "speech", speaker: "customer", text: "Yes, 9 AM works." },
          { type: "action", text: "Booked tomorrow 9 AM and created ticket R-308" },
          { type: "speech", speaker: "agent", text: "You're booked for 9 AM tomorrow. We also offer a 12-month maintenance plan for $15 a month that covers diagnostics and priority scheduling. Would you be interested?" },
          { type: "speech", speaker: "customer", text: "That actually sounds good. Sign me up." },
          { type: "action", text: "Enrolling Lisa in the 12-month maintenance plan" },
          { type: "speech", speaker: "agent", text: "Done. You're enrolled. You'll get a text reminder one hour before tomorrow's appointment. Anything else, Lisa?" },
          { type: "speech", speaker: "customer", text: "No, that's everything. Thanks." },
          { type: "speech", speaker: "agent", text: "See you tomorrow at 9. Have a good evening." },
          { type: "call_end", durationLabel: "0:30" },
        ],
        ownerMessages: [
          { triggerAfterEvent: 8, text: "New booking: Lisa at 9 AM tomorrow for an oven diagnostic. Ticket R-308." },
          { triggerAfterEvent: 15, text: "Booking confirmed for tomorrow at 9 AM. Customer accepted the 12-month maintenance plan upgrade. 30s call." },
        ],
      },
    } satisfies Record<string, DemoScenario>,
  },
} as const

export type DemoScenarioKey = (typeof landingContent.demo.scenarioOrder)[number]

export const evaOnboardingDemo = {
  supportPhoneNumber: "+1 (470) 293-9459",
  scenario: {
    label: "Onboarding",
    business: "",
    callerName: "Business Owner",
    callerNumber: "owner@gmail.com",
    ownerLabel: "Business Owner",
    accent: "#7c6ff7",
    summary: "EVA calls the owner, claims the workspace via email, and configures the business agent — all in one call.",
    events: [
      { type: "ringing", durationMs: 2000 },
      { type: "connected" },
      { type: "speech", speaker: "agent", text: "Hi, this is EVA from SpeakOps. I can help you set up your business agent now." },
      { type: "speech", speaker: "agent", text: "Are you ready to create your account?" },
      { type: "speech", speaker: "customer", text: "Yes." },
      { type: "speech", speaker: "agent", text: "What Gmail address should I use for your owner login?" },
      { type: "speech", speaker: "customer", text: "owner@gmail.com." },
      { type: "action", text: "Sending claim email to owner@gmail.com..." },
      { type: "speech", speaker: "agent", text: "Perfect. I've sent a secure claim email from eva@0lumens.com. Open that email and tap Claim Workspace." },
      { type: "speech", speaker: "agent", text: "I'll stay with you while you do that." },
      { type: "email_appear" },
      { type: "email_open" },
      { type: "claim_complete" },
      { type: "speech", speaker: "agent", text: "I can see the workspace claim is complete. Let's configure your business agent." },
      { type: "speech", speaker: "agent", text: "What should customers call this agent?" },
      { type: "speech", speaker: "customer", text: "Eva." },
      { type: "speech", speaker: "agent", text: "What is your website URL?" },
      { type: "speech", speaker: "customer", text: "speakops.ai" },
      { type: "speech", speaker: "agent", text: "What are the top requests this agent should handle?" },
      { type: "speech", speaker: "customer", text: "Booking appointments, answering FAQs, taking messages." },
      { type: "speech", speaker: "agent", text: "What policies should it follow?" },
      { type: "speech", speaker: "customer", text: "Always be polite, never promise refunds without manager approval." },
      { type: "speech", speaker: "agent", text: "What tone should it use with customers?" },
      { type: "speech", speaker: "customer", text: "Friendly and professional." },
      { type: "speech", speaker: "agent", text: "When should it escalate to a human?" },
      { type: "speech", speaker: "customer", text: "If the customer is upset or asks for a refund." },
      { type: "speech", speaker: "agent", text: "Anything else you want it to know?" },
      { type: "speech", speaker: "customer", text: "No, that's everything." },
      { type: "speech", speaker: "agent", text: "Perfect. Your business agent number is now being configured. You'll be able to use the agent shortly." },
      { type: "provisioning" },
      { type: "call_end", durationLabel: "2:14" },
    ] as DemoEvent[],
    ownerMessages: [],
  } satisfies DemoScenario,
} as const

export const twoPhoneDemo = {
  heading: "See every capability in one call",
  subtitle:
    "Watch your agent recall history, reschedule, send payment, and escalate — all without missing a beat.",
  business: "BrightPath Dental",
  callerName: "Sarah",
  callerNumber: "+1 (555) 847-2190",
  script: [
    { speaker: "agent" as const, text: "Thanks for calling BrightPath Dental. How can I help today?" },
    { speaker: "customer" as const, text: "Hi, this is Sarah. I need to move tomorrow's appointment, and I still need to pay my balance." },
    { speaker: "agent" as const, text: "Of course, Sarah. I see you prefer afternoon appointments.", phone2State: 1 },
    { speaker: "agent" as const, text: "Your current appointment is tomorrow at 10 AM. I can move that and send your payment link." },
    { speaker: "agent" as const, text: "I have Thursday at 2 PM or 3:30 PM available." },
    { speaker: "customer" as const, text: "2 PM works.", phone2State: 2 },
    { speaker: "agent" as const, text: "Done. You're now booked for Thursday at 2 PM." },
    { speaker: "agent" as const, text: "I've sent a secure payment link for your $85 balance.", phone2State: 3 },
    { speaker: "customer" as const, text: "Can I split that into two payments? I want to talk to someone." },
    { speaker: "agent" as const, text: "Yes. I'm forwarding your call now and I'll brief the office manager.", phone2State: 4 },
    { speaker: "agent" as const, text: "One moment while I connect you." },
  ] satisfies TwoPhoneScriptLine[],
}

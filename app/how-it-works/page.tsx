import type { Metadata } from "next"
import HowItWorksClient from "@/components/landing/HowItWorksClient"

export const metadata: Metadata = {
  title: "How It Works | SpeakOps",
  description:
    "See how EVA onboards your business over a single phone call — from workspace claim to live agent in minutes.",
}

export default function HowItWorksPage() {
  return <HowItWorksClient />
}

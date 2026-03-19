import type { Metadata } from "next"
import BookingPageClient from "@/components/landing/BookingPageClient"

export const metadata: Metadata = {
  title: "Book a Call — SpeakOps",
  description: "Schedule a call with the SpeakOps team.",
}

export default function BookPage() {
  return <BookingPageClient />
}

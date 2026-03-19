import { Resend } from "resend"
import { NextResponse } from "next/server"
import { sql } from "@/lib/marketing-db"

const resend = new Resend(process.env.RESEND_API_KEY)
const NOTIFY = ["sufyaan1517@gmail.com", "varun@0lumens.com", "shwejan@0lumens.com"]

function buildCalendarUrl(name: string, email: string, date: string, time: string) {
  try {
    // date: "Thursday, March 19, 2026" → strip day name
    const clean = date.replace(/^[A-Za-z]+,\s*/, "")
    const months: Record<string, string> = {
      January: "01", February: "02", March: "03", April: "04",
      May: "05", June: "06", July: "07", August: "08",
      September: "09", October: "10", November: "11", December: "12",
    }
    const [monthName, dayStr, yearStr] = clean.split(/[\s,]+/)
    const mm = months[monthName] ?? "01"
    const dd = dayStr.padStart(2, "0")
    const yyyy = yearStr

    // time: "1:00 PM" → 24h
    const [rawH, rawM] = time.replace(/\s*(AM|PM)/i, "").split(":")
    let h = parseInt(rawH, 10)
    if (/PM/i.test(time) && h !== 12) h += 12
    if (/AM/i.test(time) && h === 12) h = 0
    const hh = String(h).padStart(2, "0")
    const mi = rawM.padStart(2, "0")

    // 30-min slot
    let endH = h
    let endM = parseInt(mi, 10) + 30
    if (endM >= 60) { endH += 1; endM -= 60 }
    const eHH = String(endH).padStart(2, "0")
    const eMM = String(endM).padStart(2, "0")

    const start = `${yyyy}${mm}${dd}T${hh}${mi}00`
    const end = `${yyyy}${mm}${dd}T${eHH}${eMM}00`

    const title = encodeURIComponent(`SpeakOps Demo — ${name}`)
    const details = encodeURIComponent(
      `SpeakOps intro call with ${name} (${email}).\n\nBooked via speakops.ai`
    )

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&add=${encodeURIComponent(email)}&ctz=America/New_York`
  } catch {
    return null
  }
}

function teamEmailHtml(name: string, email: string, date: string, time: string, calendarUrl: string | null) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <div style="border-bottom:3px solid #7c6ff7;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;font-size:20px;font-weight:700">New Demo Booking</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7c6ff7">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Date</td><td style="padding:8px 0;font-weight:600">${date}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Time</td><td style="padding:8px 0;font-weight:600">${time} EST</td></tr>
      </table>
      ${calendarUrl ? `
        <div style="margin-top:24px">
          <a href="${calendarUrl}" style="display:inline-block;background:#7c6ff7;color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
            Add to Google Calendar
          </a>
        </div>
      ` : ""}
    </div>
  `
}

function userEmailHtml(name: string, date: string, time: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <div style="border-bottom:3px solid #7c6ff7;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;font-size:22px;font-weight:700">You're booked!</h1>
        <p style="margin:6px 0 0;color:#6b7280;font-size:14px">Your SpeakOps demo is confirmed.</p>
      </div>

      <div style="background:#f6f4ef;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Your demo</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a">${date}</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:600;color:#7c6ff7">${time} EST · 30 min</p>
      </div>

      <div style="font-size:14px;line-height:1.7;color:#374151">
        <p style="margin:0 0 12px">Hi ${name.split(" ")[0]},</p>
        <p style="margin:0 0 12px">We're excited to show you how SpeakOps can handle your customer calls with AI. On the call, we'll cover:</p>
        <ul style="margin:0 0 12px;padding-left:20px">
          <li>How your AI agent answers every call, 24/7</li>
          <li>Live walkthrough of booking, FAQs, and escalations</li>
          <li>How to go live in under 5 minutes</li>
        </ul>
        <p style="margin:0 0 12px">A <strong>Google Meet link</strong> will be sent to you before the call.</p>
        <p style="margin:0;color:#6b7280;font-size:13px">Need to reschedule? Reply to this email.</p>
      </div>

      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px">
        <p style="margin:0;font-size:12px;color:#9aa0a8">SpeakOps by 0 Lumen Labs</p>
      </div>
    </div>
  `
}

export async function POST(req: Request) {
  const { name, email, date, time } = await req.json()
  if (!name || !email || !date || !time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  try {
    await sql`
      INSERT INTO demo_bookings (name, email, booking_date, booking_time)
      VALUES (${name}, ${email}, ${date}, ${time})
    `

    const calendarUrl = buildCalendarUrl(name, email, date, time)

    // Notify team
    await resend.emails.send({
      from: "SpeakOps <noreply@0lumens.com>",
      to: NOTIFY,
      subject: `New booking: ${name} — ${date} at ${time}`,
      html: teamEmailHtml(name, email, date, time, calendarUrl),
    })

    // Confirm to user
    await resend.emails.send({
      from: "SpeakOps <noreply@0lumens.com>",
      to: [email],
      subject: `Your SpeakOps demo is confirmed — ${date} at ${time}`,
      html: userEmailHtml(name, date, time),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

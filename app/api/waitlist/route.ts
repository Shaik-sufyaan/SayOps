import { NextResponse } from "next/server"
import { getMarketingDb } from "@/lib/marketing-db"
import { getMarketingMailer } from "@/lib/marketing-email"

const NOTIFY = ["sufyaan1517@gmail.com", "varun@0lumens.com", "shwejan@0lumens.com"]

function teamEmailHtml(name: string, email: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <div style="border-bottom:3px solid #7c6ff7;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;font-size:20px;font-weight:700">New Waitlist Signup</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#6b7280;width:100px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#7c6ff7">${email}</a></td></tr>
      </table>
    </div>
  `
}

function userEmailHtml(name: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <div style="border-bottom:3px solid #7c6ff7;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;font-size:22px;font-weight:700">You're on the list!</h1>
        <p style="margin:6px 0 0;color:#6b7280;font-size:14px">Thanks for joining the SpeakOps waitlist.</p>
      </div>

      <div style="font-size:14px;line-height:1.7;color:#374151">
        <p style="margin:0 0 12px">Hi ${name.split(" ")[0]},</p>
        <p style="margin:0 0 12px">We're building AI-powered customer support that answers every call, books appointments, and keeps you updated — all in under 5 minutes of setup.</p>
        <p style="margin:0 0 12px">We'll reach out as soon as we're ready for you. In the meantime, feel free to <a href="https://speakops.ai/book" style="color:#7c6ff7;font-weight:600">book a demo call</a> to see SpeakOps in action.</p>
        <p style="margin:0;color:#6b7280;font-size:13px">— The SpeakOps Team</p>
      </div>

      <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px">
        <p style="margin:0;font-size:12px;color:#9aa0a8">SpeakOps by 0 Lumen Labs</p>
      </div>
    </div>
  `
}

export async function POST(req: Request) {
  const { name, email } = await req.json()
  if (!name || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  try {
    const sql = getMarketingDb()
    const resend = getMarketingMailer()

    await sql`
      INSERT INTO waitlist_signups (name, email)
      VALUES (${name}, ${email})
    `

    // Notify team
    await resend.emails.send({
      from: "SpeakOps <noreply@0lumens.com>",
      to: NOTIFY,
      subject: `New waitlist signup: ${name}`,
      html: teamEmailHtml(name, email),
    })

    // Confirm to user
    await resend.emails.send({
      from: "SpeakOps <noreply@0lumens.com>",
      to: [email],
      subject: `You're on the SpeakOps waitlist!`,
      html: userEmailHtml(name),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

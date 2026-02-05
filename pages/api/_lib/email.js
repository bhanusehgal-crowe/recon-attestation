import { Resend } from "resend";

export async function sendCompletionEmail({ to, subject, text, filename, contentBase64 }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false, reason: "Email not configured" };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: contentBase64
      }
    ]
  });

  return { sent: true };
}

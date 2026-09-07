import emailjs from '@emailjs/browser'
import type { AppSettings } from '../domain/types'

export type MailConfig = AppSettings['mail']

export function mailConfigured(cfg: MailConfig): boolean {
  return !!(cfg.serviceId.trim() && cfg.templateId.trim() && cfg.publicKey.trim())
}

export interface MailMessage {
  to: string
  subject: string
  body: string
}

export async function sendMail(cfg: MailConfig, msg: MailMessage): Promise<void> {
  await emailjs.send(
    cfg.serviceId.trim(),
    cfg.templateId.trim(),
    {
      to_email: msg.to,
      subject: msg.subject,
      message: msg.body,
    },
    { publicKey: cfg.publicKey.trim() },
  )
}
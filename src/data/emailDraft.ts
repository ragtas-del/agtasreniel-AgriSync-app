import { fmtDate, fmtMoney } from './format'
import { ussdCode } from './util'
import type { Farmer, Investment } from '../domain/types'

export function repaidPct(inv: Investment): number {
  const paid = inv.repayments.reduce((sum, r) => sum + r.amount, 0)
  return Math.min(100, Math.round((paid / Math.max(1, inv.principal)) * 100))
}

export function investmentEmailDraft(inv: Investment, farmer: Farmer): { subject: string; body: string } {
  const pct = repaidPct(inv)
  const subject = `Your "${inv.label}" investment — ${pct}% repaid`
  const body =
    `Dear ${farmer.name},\n\n` +
    `Here is your AgriLedger investment update:\n\n` +
    `  Facility: ${inv.label}\n` +
    `  Amount:    ${fmtMoney(inv.principal)}\n` +
    `  Repaid:    ${pct}%\n` +
    `  Due date:  ${fmtDate(inv.dueDate)}\n\n` +
    `You can dial ${ussdCode(inv.id)} on your phone to check your balance, or reply to this email.`
  return { subject, body }
}
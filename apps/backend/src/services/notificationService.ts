type EscalationEmailInput = {
  toEmail: string
  toName?: string
  question: string
  adminResponse: string
  schoolName?: string
}

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendEscalationResponseEmail(input: EscalationEmailInput): Promise<boolean> {
    const apiKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.SENDGRID_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      console.warn('SendGrid is not configured. Skipping escalation email notification.')
      return false
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: input.toEmail, name: input.toName || undefined }],
              subject: `Policy Query Update${input.schoolName ? ` - ${input.schoolName}` : ''}`,
            },
          ],
          from: { email: fromEmail, name: 'AI Policy Guidance' },
          content: [
            {
              type: 'text/plain',
              value:
                `Your escalated policy query has been reviewed by an administrator.\n\n` +
                `Question:\n${input.question}\n\n` +
                `Response:\n${input.adminResponse}\n\n` +
                `If you still need help, please reply in-app.`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const details = await response.text()
        console.error('Failed to send SendGrid email:', response.status, details)
        return false
      }
      return true
    } catch (error) {
      console.error('Error sending escalation email:', error)
      return false
    }
  }
}

export default NotificationService

/**
 * Email Service Orchestrator (Feature #16)
 * Manages email sending through multiple providers
 */

class EmailService {
  constructor (options = {}) {
    this.provider = options.provider || 'smtp' // smtp, sendgrid, aws-ses
    this.config = options.config || {}
    this.templates = new Map()
    this.queue = []
    this.retryPolicy = options.retryPolicy || { maxRetries: 3, delayMs: 1000 }
  }

  /**
   * Register email template
   */
  registerTemplate (name, template) {
    this.templates.set(name, template)
  }

  /**
   * Send email
   */
  async send (to, subject, content, options = {}) {
    const email = {
      id: require('crypto').randomUUID(),
      to,
      subject,
      content,
      from: options.from || this.config.from,
      cc: options.cc,
      bcc: options.bcc,
      html: options.html || false,
      attachments: options.attachments || [],
      sentAt: null,
      status: 'pending',
      retries: 0,
      createdAt: new Date()
    }

    this.queue.push(email)
    return this.sendEmail(email)
  }

  /**
   * Send using template
   */
  async sendTemplate (to, templateName, variables = {}, options = {}) {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template ${templateName} not found`)
    }

    // Replace variables in template
    let content = template.content
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(`{{${key}}}`, value)
    }

    return this.send(to, template.subject, content, {
      ...options,
      html: template.html !== false
    })
  }

  /**
   * Send email with retry logic
   */
  async sendEmail (email) {
    try {
      // Mock sending
      await this.simulateSending(email)
      email.sentAt = new Date()
      email.status = 'sent'
      return email
    } catch (error) {
      email.retries += 1

      if (email.retries < this.retryPolicy.maxRetries) {
        // Schedule retry
        setTimeout(
          () => this.sendEmail(email),
          this.retryPolicy.delayMs * email.retries
        )
        email.status = 'pending'
      } else {
        email.status = 'failed'
        email.error = error.message
      }

      return email
    }
  }

  /**
   * Simulate email sending
   */
  async simulateSending (email) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) {
          resolve()
        } else {
          reject(new Error('Email sending failed'))
        }
      }, 100)
    })
  }

  /**
   * Get email status
   */
  getEmailStatus (emailId) {
    return this.queue.find((e) => e.id === emailId)
  }
}

module.exports = EmailService

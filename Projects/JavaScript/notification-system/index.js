class NotificationSystem {
  constructor() {
    this.queue = [];
    this.handlers = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    this.handlers.set('email', this.sendEmail.bind(this));
    this.handlers.set('sms', this.sendSMS.bind(this));
    this.handlers.set('push', this.sendPush.bind(this));
    this.handlers.set('inapp', this.sendInApp.bind(this));
  }

  async send(notification) {
    const { type, channels, recipient, data } = notification;
    const results = [];

    for (const channel of channels) {
      const handler = this.handlers.get(channel);
      if (handler) {
        try {
          const result = await handler(recipient, data, type);
          results.push({ channel, success: true, result });
        } catch (error) {
          results.push({ channel, success: false, error: error.message });
        }
      }
    }

    return results;
  }

  async sendEmail(recipient, data, type) {
    console.log(`Sending email to ${recipient.email}`);
    // Email sending logic
    return { messageId: Math.random().toString() };
  }

  async sendSMS(recipient, data, type) {
    console.log(`Sending SMS to ${recipient.phone}`);
    // SMS sending logic
    return { messageId: Math.random().toString() };
  }

  async sendPush(recipient, data, type) {
    console.log(`Sending push notification to ${recipient.id}`);
    // Push notification logic
    return { messageId: Math.random().toString() };
  }

  async sendInApp(recipient, data, type) {
    console.log(`Storing in-app notification for ${recipient.id}`);
    // In-app notification logic
    return { messageId: Math.random().toString() };
  }

  async queueNotification(notification, delay = 0) {
    setTimeout(() => this.send(notification), delay);
  }
}

module.exports = NotificationSystem;

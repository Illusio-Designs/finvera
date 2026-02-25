const logger = require('../utils/logger');

/**
 * Email Service
 * Handles sending email notifications
 * 
 * Note: This is a basic implementation. In production, integrate with:
 * - SendGrid, Mailgun, AWS SES, or similar service
 * - Template engine (e.g., Handlebars, EJS)
 * - Email queue system (e.g., Bull, BullMQ)
 */

/**
 * Send email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    // Check if email is enabled
    if (process.env.EMAIL_ENABLED === 'false') {
      logger.info(`Email disabled. Would send to ${to}: ${subject}`);
      return false;
    }

    // TODO: Integrate with your email service provider
    // Example integrations:
    
    // Option 1: Using Nodemailer (if installed)
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
    // await transporter.sendMail({ to, subject, html, text });

    // Option 2: Using SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: process.env.EMAIL_FROM, subject, html, text });

    // Option 3: Using AWS SES
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: process.env.AWS_REGION });
    // await ses.sendEmail({
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Subject: { Data: subject },
    //     Body: { Html: { Data: html }, Text: { Data: text || html } },
    //   },
    //   Source: process.env.EMAIL_FROM,
    // }).promise();

    // For now, just log the email (development mode)
    logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
    logger.debug(`[EMAIL] Body: ${text || html.substring(0, 100)}...`);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send notification email
 * @param {Object} notification - Notification object
 * @param {Object} user - User object with email
 * @returns {Promise<boolean>} Success status
 */
async function sendNotificationEmail(notification, user) {
  try {
    if (!user.email) {
      logger.warn(`Cannot send email: User ${user.id} has no email address`);
      return false;
    }

    const subject = notification.title || 'New Notification';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>${notification.message || ''}</p>
            ${notification.action_url ? `<a href="${process.env.FRONTEND_URL}${notification.action_url}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from ${process.env.APP_NAME || 'Fintranzact'}</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${subject}

${notification.message || ''}

${notification.action_url ? `View Details: ${process.env.FRONTEND_URL}${notification.action_url}` : ''}

---
This is an automated notification from ${process.env.APP_NAME || 'Fintranzact'}
You can manage your notification preferences in your account settings.
    `.trim();

    const success = await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    return success;
  } catch (error) {
    logger.error('Error sending notification email:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
};

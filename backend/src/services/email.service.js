const SibApiV3Sdk = require('sib-api-v3-sdk');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Initialize Sendinblue API client
    this.apiClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = this.apiClient.authentications['api-key'];
    apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

    this.transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

    this.templates = {};
  }

async initialize() {
  await this.loadTemplates();
  return this;
}

  // Load local templates (if you're still using local templates for rendering)
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      const templates = [
        'welcome',
        'emailVerification',
        'passwordReset',
        'courseEnrollment',
        'courseCompletion',
        'badgeEarned',
        'tradingAlert'
      ];

      for (const template of templates) {
        const filePath = path.join(templatesDir, `${template}.html`);
        const templateContent = await fs.readFile(filePath, 'utf-8');
        this.templates[template] = handlebars.compile(templateContent);
      }
    } catch (error) {
      logger.error('Error loading email templates:', error);
    }
  }

  // Send email using Sendinblue
  async sendEmail({ email, subject, template, data }) {
    try {
      // If using dynamic templates, you may use Sendinblue's template system instead of local rendering
      const html = this.templates[template] ? this.templates[template](data) : null;

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { email: process.env.EMAIL_FROM };
      sendSmtpEmail.to = [{ email }];
      sendSmtpEmail.subject = subject;

      // If you have a predefined Sendinblue template, use templateId instead of HTML body
      if (html) {
        sendSmtpEmail.htmlContent = html;
      } else {
        sendSmtpEmail.templateId = parseInt(process.env.SENDINBLUE_TEMPLATE_ID); // Use Sendinblue's template ID
      }

      const result = await this.transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
      logger.info('Email sent successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Send Welcome Email
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      email: user.email,
      subject: 'Welcome to Stock Market Learning Platform',
      template: 'welcome',
      data: {
        name: user.name,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    });
  }

  // Send Verification Email
  async sendVerificationEmail(user, verificationUrl) {
    return this.sendEmail({
      email: user.email,
      subject: 'Please verify your email address',
      template: 'emailVerification',
      data: {
        name: user.name,
        verificationUrl
      }
    });
  }

  // Send Password Reset Email
  async sendPasswordResetEmail(user, resetUrl) {
    return this.sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      data: {
        name: user.name,
        resetUrl,
        expiryTime: '10 minutes'
      }
    });
  }

  // Send Course Enrollment Email
  async sendCourseEnrollmentEmail(user, course) {
    return this.sendEmail({
      email: user.email,
      subject: `Successfully enrolled in ${course.title}`,
      template: 'courseEnrollment',
      data: {
        name: user.name,
        courseName: course.title,
        courseUrl: `${process.env.FRONTEND_URL}/courses/${course._id}`
      }
    });
  }

  // Send Course Completion Email
  async sendCourseCompletionEmail(user, course) {
    return this.sendEmail({
      email: user.email,
      subject: `Congratulations on completing ${course.title}!`,
      template: 'courseCompletion',
      data: {
        name: user.name,
        courseName: course.title,
        certificateUrl: `${process.env.FRONTEND_URL}/certificates/${course._id}`
      }
    });
  }

  // Send Badge Earned Email
  async sendBadgeEarnedEmail(user, badge) {
    return this.sendEmail({
      email: user.email,
      subject: `You've earned a new badge: ${badge.name}!`,
      template: 'badgeEarned',
      data: {
        name: user.name,
        badgeName: badge.name,
        badgeDescription: badge.description,
        badgeImageUrl: badge.icon,
        profileUrl: `${process.env.FRONTEND_URL}/profile/badges`
      }
    });
  }

  // Send Trading Alert Email
  async sendTradingAlert(user, alert) {
    return this.sendEmail({
      email: user.email,
      subject: `Trading Alert: ${alert.type}`,
      template: 'tradingAlert',
      data: {
        name: user.name,
        alertType: alert.type,
        symbol: alert.symbol,
        price: alert.price,
        message: alert.message,
        portfolioUrl: `${process.env.FRONTEND_URL}/portfolio/${alert.portfolioId}`
      }
    });
  }
}

const emailService = new EmailService();
module.exports = emailService;
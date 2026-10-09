import nodemailer from 'nodemailer';
import { ENV } from './env.js';

let transporter = null;

export const getEmailTransporter = async () => {
  if (transporter) return transporter;

  if (ENV.SMTP_USER && ENV.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });
  } else {
    // Development fallback: Log emails to console or generate test account
    transporter = {
      sendMail: async (options) => {
        console.log('--------------------------------------------------');
        console.log(`[Email Transporter (Dev)] To: ${options.to}`);
        console.log(`[Email Transporter (Dev)] Subject: ${options.subject}`);
        console.log(`[Email Transporter (Dev)] Content Preview: ${options.text || options.html}`);
        console.log('--------------------------------------------------');
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailer = await getEmailTransporter();
    const result = await mailer.sendMail({
      from: ENV.EMAIL_FROM,
      to,
      subject,
      text: text || html,
      html,
    });
    return result;
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error.message);
    // Don't crash flow if email fails in dev
    return null;
  }
};


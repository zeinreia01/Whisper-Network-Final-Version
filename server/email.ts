import { randomBytes } from "crypto";

// Email service configuration
const EMAIL_SERVICE = {
  // For production, use services like SendGrid, Mailgun, or Nodemailer with SMTP
  // For development, we'll log emails to console
  isDevelopment: process.env.NODE_ENV === "development",
  fromEmail: process.env.FROM_EMAIL || "noreply@whisperingnetwork.com",
  appName: "Whispering Network",
  baseUrl: process.env.BASE_URL || "http://localhost:5000",
};

// Email configuration
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'whispernetworkofficial@gmail.com',
    pass: process.env.EMAIL_PASS || 'whispernetworkontop01'
  }
};


interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Generate secure random token
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

// Send email verification
export async function sendEmailVerification(email: string, token: string, username: string): Promise<void> {
  const verificationUrl = `${EMAIL_SERVICE.baseUrl}/verify-email?token=${token}`;

  const template: EmailTemplate = {
    to: email,
    subject: `Verify your email for ${EMAIL_SERVICE.appName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to Whispering Network, ${username}!</h1>
        <p>Thank you for adding your email to your Silent Messenger account. To complete the verification process and earn your verified badge, please click the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email Address</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          This verification link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This email was sent to ${email} because you added this email address to your Whispering Network account.
        </p>
      </div>
    `,
    text: `
      Welcome to Whispering Network, ${username}!

      Thank you for adding your email to your Silent Messenger account. To complete the verification process and earn your verified badge, please visit this link:

      ${verificationUrl}

      This verification link will expire in 24 hours. If you didn't request this verification, you can safely ignore this email.
    `
  };

  await sendEmail(template);
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, username: string): Promise<void> {
  const resetUrl = `${EMAIL_SERVICE.baseUrl}/reset-password?token=${token}`;

  const template: EmailTemplate = {
    to: email,
    subject: `Reset your ${EMAIL_SERVICE.appName} password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Password Reset Request</h1>
        <p>Hello ${username},</p>
        <p>We received a request to reset your password for your Whispering Network account. Click the button below to create a new password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This email was sent to ${email} for the account: ${username}
        </p>
      </div>
    `,
    text: `
      Password Reset Request

      Hello ${username},

      We received a request to reset your password for your Whispering Network account. Visit this link to create a new password:

      ${resetUrl}

      This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    `
  };

  await sendEmail(template);
}

// Email sending function
async function sendEmail(template: EmailTemplate): Promise<void> {
  if (EMAIL_SERVICE.isDevelopment) {
    // In development, log email to console
    console.log("\n" + "=".repeat(50));
    console.log("📧 EMAIL SENT (Development Mode)");
    console.log("=".repeat(50));
    console.log(`To: ${template.to}`);
    console.log(`Subject: ${template.subject}`);
    console.log("\nText Content:");
    console.log(template.text);
    console.log("=".repeat(50) + "\n");
    return;
  }

  // In production, integrate with actual email service
  // Example with Nodemailer (install: npm install nodemailer @types/nodemailer)
  /*
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    // Configure your email service here
    // Example for Gmail:
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: EMAIL_SERVICE.fromEmail,
    to: template.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
  */

  throw new Error("Email service not configured for production. Please set up email provider.");
}
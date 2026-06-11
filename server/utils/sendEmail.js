// ====================================================
// Email Service Utility (Nodemailer wrapper)
//
// This file initializes an SMTP email dispatch transporter.
// It is used to send password recovery reset links to users' emails.
//
// Features:
// - Supports Gmail services configuration.
// - Supports Custom SMTP hosts and ports.
// - Falls back to a free test Ethereal Email provider if no environment details are present.
//
// Used by:
// - authController.js (forgotPassword handler)
// ====================================================

const nodemailer = require('nodemailer');

// Purpose:
// Dispatches an email message using Nodemailer configuration.
//
// Input:
// options (Object) - contains { to, subject, text, html }.
//
// Output:
// Returns the Nodemailer message info on successful dispatch.
//
// Usage:
// Imported and called inside authController.js for forgotPassword reset links.
const sendEmail = async (options) => {
  // 0) Use Resend HTTPS API if key is present to bypass Render's free tier SMTP port blocks (25/465/587)
  if (process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY detected. Dispatched via Resend HTTP API over port 443...');
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Resend API');
      }

      console.log(`Email sent successfully via Resend. ID: ${data.id}`);
      return { messageId: data.id };
    } catch (err) {
      console.error('Resend API Dispatch Error:', err.message);
      throw err;
    }
  }

  let transporter;

  // 1) Configure Transporter based on env settings
  if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('gmail.com')) {
    // Highly reliable Gmail transporter setup
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    // Custom SMTP server configuration
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
    });
  } else {
    // Auto-fallback to Ethereal Email account if nothing is configured
    console.log('No SMTP config found in .env. Creating temporary Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.error('Error creating Ethereal email test account:', err.message);
      throw new Error('Could not create test mail transport.');
    }
  }

  // 2) Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || `JobPortal Pro Team <${process.env.EMAIL_USER || 'no-reply@jobportalpro.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // 3) Send email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email sent successfully: Message ID: ${info.messageId}`);
  
  // If Ethereal test account was used, print the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('----------------------------------------------------');
    console.log('TEST EMAIL CAPTURED BY ETHEREAL MAIL');
    console.log(`Preview Link: ${previewUrl}`);
    console.log('----------------------------------------------------');
  }

  return info;
};

module.exports = sendEmail;

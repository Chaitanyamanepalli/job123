const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
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

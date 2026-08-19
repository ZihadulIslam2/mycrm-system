import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const mailOptions = {
    from: options.from || process.env.SMTP_USER || 'noreply@crm.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
}

export async function verifyConnection() {
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
  throw new Error('Missing required SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, FROM_EMAIL)');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const info: SMTPTransport.SentMessageInfo = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Amoora Couture'}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Email error:', message);
    return { success: false, error: message };
  }
}

import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '8c9099001@smtp-brevo.com',
    pass: process.env.SMTP_PASS || '5ZXwCf1nc2S0FgvP',
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
      from: `"${process.env.FROM_NAME || 'Amoora Couture'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER || '8c9099001@smtp-brevo.com'}>`,
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

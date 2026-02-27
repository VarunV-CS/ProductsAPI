import {createTransport} from 'nodemailer';
import config from '../config/index.js';

const transporter = createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_SECURE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD
  }
});

export async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: `"M1 Cart" <${config.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export async function sendVerificationEmail(to, otp) {
  const subject = 'Verify Your M1 Cart Account';
  const text = `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`;

  try {
    const info = await transporter.sendMail({
      from: `"M1 Cart" <${config.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

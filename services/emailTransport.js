import { createTransport } from 'nodemailer';
import config from '../config/index.js';

export const transporter = createTransport({
  host: config.EMAIL_HOST,
  port: config.EMAIL_PORT,
  secure: config.EMAIL_SECURE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD
  }
});

export const fromAddress = `"M1 Cart" <${config.EMAIL_USER}>`;

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { transporter, fromAddress } from './emailTransport.js';

const PASSWORD_RESET_TTL = '15m';

export const generatePasswordResetToken = (user) => {
  const secret = `${config.JWT_SECRET}${user.password}`;

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      purpose: 'password-reset',
    },
    secret,
    { expiresIn: PASSWORD_RESET_TTL }
  );
};

export const verifyPasswordResetToken = (token, user) => {
  const secret = `${config.JWT_SECRET}${user.password}`;
  return jwt.verify(token, secret);
};

export async function sendPasswordResetEmail(to, resetLink) {
  const subject = 'Reset Your M1 Cart Password';
  const text = `We received a request to reset your M1 Cart password.

Use this secure link to choose a new password:
${resetLink}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.`;

  const logoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small_zoom.png', import.meta.url));
  const hasLogo = existsSync(logoPath);

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:24px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">Reset Your Password</h1>
                <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">M1 Cart Account Recovery</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;color:#1f2937;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">We received a request to reset the password for your M1 Cart account.</p>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">Use the button below to open the reset page. The link is signed with a short-lived JWT and expires in <strong>15 minutes</strong>.</p>
                <div style="margin:20px 0;text-align:center;">
                  <a href="${resetLink}" style="display:inline-block;padding:14px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">Reset Password</a>
                </div>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#6b7280;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0;word-break:break-all;font-size:13px;line-height:1.6;color:#1d4ed8;">${resetLink}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Account Recovery </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    const attachments = hasLogo
      ? [
          {
            filename: 'logo_small_zoom.png',
            path: logoPath,
            cid: 'm1cart-logo'
          }
        ]
      : [];

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments
    });

    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { transporter, fromAddress } from './emailTransport.js';

export async function sendVerificationEmail(to, otp) {
  const subject = 'Verify Your M1 Cart Account';
  const text = `M1 Cart Verification Code: ${otp}

This code will expire in 5 minutes.

For your security, do not share this code with anyone.

If you did not request this code, you can safely ignore this email.`;

  const logoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small.png', import.meta.url));
  const hasLogo = existsSync(logoPath);

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#667eea,#7c8ef5);padding:24px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">Verify your email</h1>
                <p style="margin:8px 0 0;color:#e7ebff;font-size:14px;">Welcome to M1 Cart</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;color:#1f2937;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Use the verification code below to complete your sign up.</p>
                <div style="margin:16px 0 20px;padding:14px 18px;background:#f5f7ff;border:1px dashed #667eea;border-radius:10px;text-align:center;">
                  <span style="font-size:30px;letter-spacing:8px;font-weight:700;color:#667eea;">${otp}</span>
                </div>
                <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#4b5563;">This code expires in <strong>5 minutes</strong>.</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">For your security, never share this code with anyone. If you did not request this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Secure account verification</p>
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
            filename: 'logo_small.png',
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
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

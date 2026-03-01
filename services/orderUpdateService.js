import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { transporter, fromAddress } from './emailTransport.js';

export async function sendOrderStatusUpdateEmail({
  to,
  buyerName,
  status,
  orderId,
  orderNumber,
  itemCount,
  amount,
  currency = 'usd'
}) {
  const normalizedStatus = String(status || '').toLowerCase();
  const shouldSend = normalizedStatus === 'dispatched' || normalizedStatus === 'delivered';

  if (!shouldSend) {
    return false;
  }

  const isDispatched = normalizedStatus === 'dispatched';
  const title = isDispatched ? 'Order Dispatched' : 'Order Delivered';
  const safeBuyerName = buyerName || 'Customer';
  const safeCurrency = String(currency || 'usd').toUpperCase();
  const formattedAmount = Number.isFinite(Number(amount)) ? `$${Number(amount).toFixed(2)}` : 'N/A';
  const safeOrderRef = orderNumber || orderId || 'N/A';
  const safeItemCount = Number.isFinite(Number(itemCount)) ? Number(itemCount) : 'N/A';
  const logoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small.png', import.meta.url));
  const hasLogo = existsSync(logoPath);

  const subject = `${title}: ${safeOrderRef}`;
  const text = `Hello ${safeBuyerName},

Your order has been ${normalizedStatus}.

Order #: ${safeOrderRef}
No. of items: ${safeItemCount}
Amount: ${formattedAmount}
Currency: ${safeCurrency}
Current Status: ${normalizedStatus}

Thank you for shopping with M1 Cart.`;

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:${isDispatched ? 'linear-gradient(135deg,#1d4ed8,#2563eb)' : 'linear-gradient(135deg,#15803d,#16a34a)'};padding:22px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">Verify your email</h1>
                <p style="margin:8px 0 12px;color:#e7ebff;font-size:14px;">Welcome to M1 Cart</p>
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello <strong>${safeBuyerName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Your order has been <strong>${normalizedStatus}</strong>.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:170px;">Order #</td><td style="padding:8px 0;color:#111827;">${safeOrderRef}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">No. of items</td><td style="padding:8px 0;color:#111827;">${safeItemCount}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Amount</td><td style="padding:8px 0;color:#111827;">${formattedAmount}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Currency</td><td style="padding:8px 0;color:#111827;">${safeCurrency}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Current Status</td><td style="padding:8px 0;color:#111827;">${normalizedStatus}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Order status update</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments: hasLogo
        ? [
            {
              filename: 'logo_small.png',
              path: logoPath,
              cid: 'm1cart-logo'
            }
          ]
        : []
    });
    console.log('Order status email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
}

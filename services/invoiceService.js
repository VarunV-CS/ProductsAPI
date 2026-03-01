import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { transporter, fromAddress } from './emailTransport.js';

const formatMoney = (value, currency = 'USD') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';
  return `$${numeric.toFixed(2)} ${String(currency || 'USD').toUpperCase()}`;
};

const safeDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

export async function sendInvoiceEmail({
  to,
  buyerName,
  order,
  paymentDetails = {}
}) {
  if (!to || !order) {
    return false;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const safeBuyerName = buyerName || 'Customer';
  const safeCurrency = String(order.currency || 'usd').toUpperCase();
  const orderNumber = order.orderNumber || order._id?.toString() || 'N/A';
  const itemCount = items.reduce((total, item) => total + (Number(item?.quantity) || 0), 0);
  const itemsSubtotal = items.reduce(
    (total, item) => total + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)),
    0
  );
  const totalPaid = Number.isFinite(Number(order.amount)) ? Number(order.amount) : itemsSubtotal;
  const paidAt = safeDate(
    paymentDetails.paidAt || order.updatedAt || order.createdAt || Date.now()
  );
  const receiptUrl = paymentDetails.receiptUrl || null;

  const subject = `Invoice & Receipt - Order #${orderNumber}`;

  const itemsText = items.length
    ? items.map((item, index) => {
        const qty = Number(item?.quantity) || 0;
        const price = Number(item?.price) || 0;
        const lineTotal = qty * price;
        return `${index + 1}. ${item?.name || 'Item'} | Qty: ${qty} | Unit: ${formatMoney(price, safeCurrency)} | Line Total: ${formatMoney(lineTotal, safeCurrency)}`;
      }).join('\n')
    : 'No items available.';

  const text = `Hello ${safeBuyerName},

Your payment has been successfully processed. Please find your invoice and receipt details below.

Order Details:
Order #: ${orderNumber}
No. of items: ${itemCount}
Order date: ${safeDate(order.createdAt)}
Order status: ${order.status || 'completed'}

Items:
${itemsText}

Payment Details:
Payment status: ${paymentDetails.paymentStatus || 'succeeded'}
Payment method: ${paymentDetails.paymentMethod || 'N/A'}
Payment intent ID: ${paymentDetails.paymentIntentId || order.paymentIntentId || 'N/A'}
Transaction ID: ${paymentDetails.transactionId || 'N/A'}
Paid at: ${paidAt}
${receiptUrl ? `Receipt URL: ${receiptUrl}` : 'Receipt URL: N/A'}

Summary:
Items subtotal: ${formatMoney(itemsSubtotal, safeCurrency)}
Total paid: ${formatMoney(totalPaid, safeCurrency)}

Thank you for shopping with M1 Cart.`;

  const logoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small.png', import.meta.url));
  const hasLogo = existsSync(logoPath);

  const itemRows = items.map((item) => {
    const qty = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.price) || 0;
    const lineTotal = qty * unitPrice;
    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#111827;">${item?.name || 'Item'}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#111827;text-align:center;">${qty}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#111827;text-align:right;">${formatMoney(unitPrice, safeCurrency)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#111827;text-align:right;">${formatMoney(lineTotal, safeCurrency)}</td>
      </tr>`;
  }).join('');

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:760px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:22px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:6px 0 0;color:#ffffff;font-size:24px;line-height:1.2;">Invoice & Receipt</h1>
                <p style="margin:8px 0 0;color:#d1fae5;font-size:14px;">Payment Successful</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hello <strong>${safeBuyerName}</strong>, your payment has been successfully processed.</p>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Order Details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:180px;">Order #</td><td style="padding:7px 0;color:#111827;">${orderNumber}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">No. of items</td><td style="padding:7px 0;color:#111827;">${itemCount}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Order date</td><td style="padding:7px 0;color:#111827;">${safeDate(order.createdAt)}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Order status</td><td style="padding:7px 0;color:#111827;">${order.status || 'completed'}</td></tr>
                </table>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Items</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;margin-bottom:18px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 8px;text-align:left;color:#374151;">Item</th>
                    <th style="padding:10px 8px;text-align:center;color:#374151;">Qty</th>
                    <th style="padding:10px 8px;text-align:right;color:#374151;">Unit Price</th>
                    <th style="padding:10px 8px;text-align:right;color:#374151;">Line Total</th>
                  </tr>
                  ${itemRows || '<tr><td colspan="4" style="padding:10px 8px;color:#6b7280;">No items available.</td></tr>'}
                </table>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Payment Details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:180px;">Payment status</td><td style="padding:7px 0;color:#111827;">${paymentDetails.paymentStatus || 'succeeded'}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Payment method</td><td style="padding:7px 0;color:#111827;">${paymentDetails.paymentMethod || 'N/A'}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Payment intent ID</td><td style="padding:7px 0;color:#111827;">${paymentDetails.paymentIntentId || order.paymentIntentId || 'N/A'}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Transaction ID</td><td style="padding:7px 0;color:#111827;">${paymentDetails.transactionId || 'N/A'}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Paid at</td><td style="padding:7px 0;color:#111827;">${paidAt}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Receipt</td><td style="padding:7px 0;color:#111827;">${receiptUrl ? `<a href="${receiptUrl}" target="_blank" rel="noreferrer" style="color:#0f766e;">View receipt</a>` : 'N/A'}</td></tr>
                </table>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Summary</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:180px;">Items subtotal</td><td style="padding:7px 0;color:#111827;font-weight:600;">${formatMoney(itemsSubtotal, safeCurrency)}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Total paid</td><td style="padding:7px 0;color:#111827;font-weight:700;">${formatMoney(totalPaid, safeCurrency)}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Invoice and receipt confirmation</p>
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
    console.log('Invoice email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}

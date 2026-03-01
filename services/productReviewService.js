import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { transporter, fromAddress } from './emailTransport.js';

export async function sendProductStatusUpdateEmail({
  to,
  status,
  product,
  actionBy,
  rejectionReason,
  sellerName,
  sellerBusinessName
}) {
  const isApproved = status === 'Approved';
  const subject = isApproved
    ? `Product Approved: ${product?.name || 'Your Product'}`
    : `Product Rejected: ${product?.name || 'Your Product'}`;

  const actionVerb = isApproved ? 'approved' : 'rejected';
  const safeActionBy = actionBy || 'Admin';
  const safeReason = rejectionReason || 'No reason provided';
  const formatPrice = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 'N/A';
    }
    return `$${numericValue.toFixed(2)}`;
  };
  const formattedPrice = formatPrice(product?.price);
  const safeSellerName = sellerName || 'Seller';
  const safeBusinessName = sellerBusinessName || 'Business';
  const sellerWelcomeText = `${safeSellerName} (${safeBusinessName})`;
  const approvedLogoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small.png', import.meta.url));
  const rejectedLogoPath = fileURLToPath(new URL('../../M1Cart/public/White_Name.png', import.meta.url));
  const selectedLogoPath = isApproved ? approvedLogoPath : (existsSync(rejectedLogoPath) ? rejectedLogoPath : approvedLogoPath);
  const hasLogo = existsSync(selectedLogoPath);
  const selectedLogoFilename = selectedLogoPath.endsWith('White_Name.png') ? 'White_Name.png' : 'logo_small.png';

  const textLines = [
    `Hello ${sellerWelcomeText},`,
    '',
    `Welcome ${safeSellerName} from ${safeBusinessName}.`,
    '',
    `Your product submission has been ${actionVerb}.`,
    '',
    `Reviewed by: ${safeActionBy}`,
    `Product ID: ${product?.pid ?? 'N/A'}`,
    `Product Name: ${product?.name ?? 'N/A'}`,
    `Category: ${product?.category ?? 'N/A'}`,
    `Price: ${formattedPrice}`,
    `Current Status: ${status || 'N/A'}`
  ];

  if (!isApproved) {
    textLines.push(`Rejection Reason: ${safeReason}`);
  }

  textLines.push('', 'Regards,', 'M1 Cart Team');
  const text = textLines.join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:${isApproved ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#dc2626,#ef4444)'};padding:22px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.2;">Verify your email</h1>
                <p style="margin:8px 0 12px;color:#e7ebff;font-size:14px;">Welcome to M1 Cart</p>
                <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.2;">Product ${status}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Welcome <strong>${safeSellerName}</strong> from <strong>${safeBusinessName}</strong>.</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Your product submission has been <strong>${actionVerb}</strong>.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:8px 0;color:#6b7280;width:150px;">Reviewed by</td><td style="padding:8px 0;color:#111827;">${safeActionBy}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Product ID</td><td style="padding:8px 0;color:#111827;">${product?.pid ?? 'N/A'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Product Name</td><td style="padding:8px 0;color:#111827;">${product?.name ?? 'N/A'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Category</td><td style="padding:8px 0;color:#111827;">${product?.category ?? 'N/A'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Price</td><td style="padding:8px 0;color:#111827;">${formattedPrice}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;">Current Status</td><td style="padding:8px 0;color:#111827;">${status || 'N/A'}</td></tr>
                  ${!isApproved ? `<tr><td style="padding:8px 0;color:#6b7280;">Rejection Reason</td><td style="padding:8px 0;color:#111827;">${safeReason}</td></tr>` : ''}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Product review update</p>
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
              filename: selectedLogoFilename,
              path: selectedLogoPath,
              cid: 'm1cart-logo'
            }
          ]
        : []
    });
    console.log('Product status email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending product status email:', error);
    return false;
  }
}

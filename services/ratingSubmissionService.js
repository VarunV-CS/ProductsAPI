import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { transporter, fromAddress } from './emailTransport.js';

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';
  return `$${numeric.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

const buildStars = (rating) => {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 0));
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
};

export async function sendRatingSubmissionEmail({
  to,
  sellerName,
  sellerBusinessName,
  reviewerName,
  reviewerEmail,
  rating,
  comment,
  product
}) {
  if (!to) return false;

  const safeSellerName = sellerName || 'Seller';
  const safeBusinessName = sellerBusinessName || 'Business';
  const safeReviewerName = reviewerName || 'A customer';
  const safeReviewerEmail = reviewerEmail || 'N/A';
  const safeRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const stars = buildStars(safeRating);
  const safeComment = comment || 'No comment provided';
  const productName = product?.name || 'Product';
  const productPid = product?.pid ?? 'N/A';
  const productCategory = product?.category || 'N/A';
  const productPrice = formatPrice(product?.price);
  const submittedAt = formatDate(new Date());

  const subject = `New Review Submitted: ${productName}`;
  const text = `Hello ${safeSellerName} (${safeBusinessName}),

A new review has been submitted on one of your products.

Review Details:
Reviewer: ${safeReviewerName}
Reviewer Email: ${safeReviewerEmail}
Rating: ${safeRating}/5 (${stars})
Comment: ${safeComment}
Submitted At: ${submittedAt}

Product Details:
Product ID: ${productPid}
Product Name: ${productName}
Category: ${productCategory}
Price: ${productPrice}

Regards,
M1 Cart Team`;

  const logoPath = fileURLToPath(new URL('../../M1Cart/public/logo_small.png', import.meta.url));
  const hasLogo = existsSync(logoPath);

  const html = `
  <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:22px 20px;text-align:center;">
                ${hasLogo
                  ? '<img src="cid:m1cart-logo" alt="M1 Cart" width="165" height="100" style="display:block;margin:0 auto;padding:0;border-radius:16px;" />'
                  : ''}
                <h1 style="margin:6px 0 0;color:#ffffff;font-size:24px;line-height:1.2;">New Product Review</h1>
                <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">A buyer has submitted feedback on your product</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Hello <strong>${safeSellerName}</strong> from <strong>${safeBusinessName}</strong>,</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">A new review has been submitted on one of your products.</p>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Review Details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;margin-bottom:18px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:170px;">Reviewer</td><td style="padding:7px 0;color:#111827;">${safeReviewerName}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Reviewer Email</td><td style="padding:7px 0;color:#111827;">${safeReviewerEmail}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Rating</td><td style="padding:7px 0;color:#111827;">${safeRating}/5 (${stars})</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Comment</td><td style="padding:7px 0;color:#111827;">${safeComment}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Submitted At</td><td style="padding:7px 0;color:#111827;">${submittedAt}</td></tr>
                </table>

                <h2 style="margin:0 0 10px;font-size:16px;color:#111827;">Product Details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:170px;">Product ID</td><td style="padding:7px 0;color:#111827;">${productPid}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Product Name</td><td style="padding:7px 0;color:#111827;">${productName}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Category</td><td style="padding:7px 0;color:#111827;">${productCategory}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Price</td><td style="padding:7px 0;color:#111827;">${productPrice}</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">M1 Cart • Rating submission notification</p>
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
    console.log('Rating submission email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending rating submission email:', error);
    return false;
  }
}

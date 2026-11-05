const BRAND_NAME = 'Princewill Ecommerce Store'       
const BRAND_COLOR = '#4f46e5'         
const EXPIRY_MINUTES = 10

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

export const otpEmailTemplate = (otp: string, name?: string) => {
    const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,'

    const digitCells = otp
        .split('')
        .map(
            (digit) => `
            <td align="center" style="padding:0 4px;">
                <div style="width:44px;height:56px;line-height:56px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#111827;text-align:center;">
                    ${digit}
                </div>
            </td>`
        )
        .join('')

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Your verification code is ${otp}. It expires in ${EXPIRY_MINUTES} minutes.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(17,24,39,0.08);">

                    <tr>
                        <td align="center" style="background:${BRAND_COLOR};padding:28px 24px;">
                            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                                ${escapeHtml(BRAND_NAME)}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:36px 32px 8px 32px;">
                            <h1 style="margin:0 0 12px 0;font-size:22px;color:#111827;">Verify your email</h1>
                            <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;color:#4b5563;">${greeting}</p>
                            <p style="margin:0;font-size:15px;line-height:24px;color:#4b5563;">
                                Welcome aboard! Enter the code below to finish setting up your account.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:28px 32px 8px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>${digitCells}</tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:16px 32px 8px 32px;">
                            <p style="margin:0;font-size:14px;color:#6b7280;">
                                This code expires in <strong style="color:#111827;">${EXPIRY_MINUTES} minutes</strong>.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px 32px 32px 32px;">
                            <div style="background:#fef9c3;border-radius:10px;padding:14px 16px;">
                                <p style="margin:0;font-size:13px;line-height:20px;color:#713f12;">
                                    <strong>Keep this code private.</strong> ${escapeHtml(BRAND_NAME)} will never ask you for it by phone, chat or email.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #e5e7eb;padding:20px 32px;background:#fafafa;">
                            <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;text-align:center;">
                                Didn't create an account? You can safely ignore this email.<br />
                                &copy; ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}


export const otpEmailText = (otp: string, name?: string) =>
    `${name ? `Hi ${name},` : 'Hi there,'}\n\nYour ${BRAND_NAME} verification code is: ${otp}\n\nIt expires in ${EXPIRY_MINUTES} minutes. If you didn't request this, you can ignore this email.`
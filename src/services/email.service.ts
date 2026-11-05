import prisma from '../prisma';
import { sendEmail } from '../brevo';
import { otpEmailTemplate } from '../utils/otp.email.template';

type OrderForEmail = {
    id: string;
    total: number;
    items: {
        quantity: number;
        price: number;
        product: { name: string };
    }[];
};

const formatNaira = (kobo: number) =>
    `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export const sendOrderConfirmationEmail = async (userId: string, order: OrderForEmail) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });

        if (!user) return;

        const rows = order.items
            .map(
                (item) =>
                    `<li>${item.product.name} x ${item.quantity} - ${formatNaira(item.price * item.quantity)}</li>`
            )
            .join('');

        const html = `
            <h2>Thanks for your order, ${user.name}!</h2>
            <p>Order ID: ${order.id}</p>
            <ul>${rows}</ul>
            <p><strong>Total: ${formatNaira(order.total)}</strong></p>
        `;

        await sendEmail(user.email, 'Order confirmation', html);
    } catch (error: any) {
        console.error('Order confirmation email failed:', error.message);
    }
};

export const sendOtpEmail = async (to: string, otp: string, name?: string) => {
    const html = otpEmailTemplate(otp, name);

    await sendEmail(to, 'Your verification code', html);
};
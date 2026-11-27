import prisma from '../prisma';

const PAYSTACK_URL = 'https://api.paystack.co';

export const initializePayment = async (
    email: string,
    amount: number,
    reference: string,
    method: 'CARD' | 'BANK_TRANSFER'
) => {
    const response = await fetch(`${PAYSTACK_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount,
            currency: 'NGN',
            reference,
            // callback_url: process.env.PAYSTACK_CALLBACK_URL,
            channels: method === 'CARD' ? ['card'] : ['bank_transfer'],
        }),
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
        throw new Error(result.message || 'Could not start the payment');
    }

    return result.data as { authorization_url: string; reference: string };
};

export const verifyPayment = async (reference: string) => {
    const response = await fetch(
        `${PAYSTACK_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const result = await response.json();
    if (!response.ok || !result.status) {
        throw new Error(result.message || 'Could not verify the payment');
    }

    return result.data as { status: string; amount: number };
};

// Asks Paystack whether the payment really succeeded, then marks the order as paid
export const settlePayment = async (reference: string) => {
    const orderId = reference.slice(0, 36);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !reference.startsWith(`${order.id}-`)) {
        return null;
    }
    if (order.paymentStatus === 'PAID') {
        return order;
    }

    const payment = await verifyPayment(reference);
    console.log(
        `Paystack ${reference}: status=${payment.status}, amount=${payment.amount}, order total=${order.total}`
    );

    if (payment.status === 'success' && payment.amount === order.total) {
        return prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' },
        });
    }

    if (payment.status === 'failed' && order.paymentStatus === 'PENDING') {
        return prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED' },
        });
    }

    return order;
};
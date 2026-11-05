import prisma from '../prisma';

export const getOrCreateCart = (userId: string) =>
    prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });

export const loadCart = async (userId: string) => {
    const cart = await getOrCreateCart(userId);
    const items = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true },
        orderBy: { product: { name: 'asc' } },
    });
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    return { id: cart.id, items, total };
};
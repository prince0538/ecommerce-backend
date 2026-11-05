import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';


export const userCheckout = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                error: 'Your cart is empty'
            })
        }

        for (const item of cart.items) {
            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    error: `Not enough stock for ${item.product.name}`
                })
            }
        }

        const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

        const [order] = await prisma.$transaction([
            prisma.order.create({
                data: {
                    userId,
                    total,
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price
                        })),
                    },
                },
                include: {
                    items: {
                        include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                    },
                },
            }),
            ...cart.items.map((addItemToCart) =>
                prisma.product.update({
                    where: { id: addItemToCart.productId },
                    data: { stock: { decrement: addItemToCart.quantity } },
                })
            ),
            prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            }),
        ])

        // await sendOrderConfirmationEmail(userId, order);

        res.status(201).json({
            message: 'Checkout successful',
            data: order
        })

    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string

        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: orders
        })

    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const getOrder = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user as { id: string; role: string };

        const order = await prisma.order.findUnique({
            where: { id: String(req.params.id) },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                },
            },
        });

        if (!order || (user.role !== 'ADMIN' && order.userId !== user.id)) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        res.status(200).json({
            message: 'Order retrieved successfully',
            data: order
        })

    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const getAllOrders = async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                items: {
                    include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: orders
        })

    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const order = await prisma.order.findUnique({
            where: { id }
        })

        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            })
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { status: req.body.status },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                }
            }
        })

        res.status(200).json({
            message: 'Order status updated successfully',
            data: updated
        })

    } catch (error: any) {
        console.log(error.message);
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user as { id: string; role: string };
        const id = String(req.params.id);

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order || (user.role !== 'ADMIN' && order.userId !== user.id)) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({
                error: 'Only pending orders can be cancelled'
            });
        }

        await prisma.$transaction([
            ...order.items.map((item) =>
                prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                })
            ),
            prisma.order.update({
                where: { id },
                data: { status: 'CANCELLED' }
            }),
        ]);

        const updated = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: { product: { select: { id: true, name: true, description: true, categoryId: true, imageUrl: true, } } },
                },
            },
        });
        res.status(200).json({
            message: 'Order cancelled successfully',
            data: updated
        })

    } catch (error: any) {
        console.log(error.message)
        res.status(500).json({
            error: 'Something went wrong',
        });
    }
};
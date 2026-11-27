import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { initializePayment, settlePayment } from '../services/paystack.service';


export const userCheckout = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const { fullName, phone, address, state, lga, paymentMethod } = req.body;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                error: 'Your cart is empty'
            });
        }

        for (const item of cart.items) {
            if (item.quantity > item.product.stock) {
                return res.status(400).json({
                    error:
                        `Not enough stock for ${item.product.name}`
                });
            }
        }

        const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        const [order] = await prisma.$transaction([
            prisma.order.create({
                data: {
                    userId,
                    total,
                    shippingName: fullName,
                    shippingPhone: phone,
                    shippingAddress: address,
                    shippingState: state,
                    shippingLga: lga,
                    paymentMethod,
                    items: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                },
                include: {
                    items: {
                        include: { product: { select: { id: true, name: true, imageUrl: true } } },
                    },
                },
            }),
            ...cart.items.map((item) =>
                prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                })
            ),
            prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
        ]);


        let payment: { authorizationUrl: string; reference: string } | null = null;

        if (paymentMethod !== 'CASH_ON_DELIVERY') {
            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                    const reference = `${order.id}-${Date.now()}`;
                    const started = await initializePayment(user.email, order.total, reference, paymentMethod);

                    await prisma.order.update({
                        where: { id: order.id },
                        data: { paymentReference: reference },
                    });
                    payment = { authorizationUrl: started.authorization_url, reference };
                }
            } catch (error) {
                console.error('Could not start the payment:', error);
            }
        }


        res.status(201).json({
            message: 'Order created successfully',
            data: { order, payment }
        })
    } catch (error) {
        console.error('checkout failed:', error);
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
};

export const payForOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const id = String(req.params.id);

        const order = await prisma.order.findUnique({
            where: { id },
            include: { user: { select: { email: true } } },
        });

        if (!order || order.userId !== userId) {
            return res.status(404).json({
                error: 'Order not found'
            });
        }

        if (order.status === 'CANCELLED') {
            return res.status(400).json({
                error: 'A cancelled order cannot be paid for'
            });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({
                error: 'This order has already been paid for'
            });
        }
        if (order.paymentMethod === 'CASH_ON_DELIVERY') {
            return res.status(400).json({
                error: 'This order is paid on delivery'
            });
        }

        const reference = `${order.id}-${Date.now()}`;
        const started = await initializePayment(
            order.user.email,
            order.total,
            reference,
            order.paymentMethod
        );

        await prisma.order.update({
            where: { id },
            data: { paymentReference: reference },
        });

        res.status(200).json({
            authorizationUrl: started.authorization_url,
            reference,
        });
    } catch (error) {
        console.error('payForOrder failed:', error);
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
};

export const confirmPayment = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user as { id: string; role: string };
        const reference = String(req.params.reference);

        const existing = await prisma.order.findUnique({
            where: { id: reference.slice(0, 36) },
        });
        if (
            !existing ||
            !reference.startsWith(`${existing.id}-`) ||
            (user.role !== 'ADMIN' && existing.userId !== user.id)
        ) {
            return res.status(404).json({
                error: 'Payment not found'
            });
        }

        const order = await settlePayment(reference);
        const paid = order?.paymentStatus === 'PAID';

        res.status(200).json({
            message: paid ? 'Payment confirmed' : 'Payment has not been completed',
            data: order,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { paymentStatus } = req.body;

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return res.status(404).json({
                error: 'Order not found'
            })
        }

        if (paymentStatus === 'PAID' && order.status === 'CANCELLED') {
            return res.status(400).json({
                error: 'A cancelled order cannot be marked as paid'
            })
        }

        if (paymentStatus === 'REFUNDED' && order.paymentStatus !== 'PAID') {
            return res.status(400).json({
                error: 'Only a paid order can be refunded'
            })
        }

        const updated = await prisma.order.update({
            where: { id },
            data: { paymentStatus },
        });

        res.status(200).json({
            message: 'Payment status updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('updatePaymentStatus failed:', error);
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

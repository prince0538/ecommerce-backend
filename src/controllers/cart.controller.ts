import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;

        let cart = await prisma.cart.findUnique({
            where: { userId },
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            })
        }

        const items = await prisma.cartItem.findMany({
            where: { cartId: cart.id },
            include: { product: true },
            orderBy: { product: { name: 'asc' } }
        })

        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        res.status(200).json({
            message: 'Cart retrieved successfully',
            data: { id: cart.id, items, total }
        })

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const addItemToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const { productId, quantity } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            })
        }

        let cart = await prisma.cart.findUnique({
            where: { userId },
        })

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            })
        }

        const existingCartItem = await prisma.cartItem.findFirst({
            where: { cartId: cart!.id, productId }
        })

        const newQuantity = (existingCartItem?.quantity ?? 0) + quantity;
        if (newQuantity > product.stock) {
            return res.status(400).json({
                error: 'Quantity exceeds available stock'
            })
        }

        let cartItem;

        if (existingCartItem) {
            cartItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: newQuantity },
                include: { product: true }
            });

        } else {
            cartItem = await prisma.cartItem.create({
                data: { cartId: cart!.id, productId, quantity },
                include: { product: true }
            });
        }

        res.status(200).json({
            message: 'Item added to cart successfully',
            data: cartItem
        })

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const updateItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const productId = String(req.params.productId);
        const { quantity } = req.body;

        const cart = await prisma.cart.findUnique({
             where: { userId } 
        });

        if (!cart) {
            return res.status(404).json({ 
                error: 'Item is not in your cart' 
            });
        }

        const item = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
            include: { product: true },
        });
        if (!item) {
            return res.status(404).json({ 
                error: 'Item is not in your cart' 
            });
        }
        if (quantity > item.product.stock) {
            return res.status(400).json({ 
                error: `Only ${item.product.stock} in stock` 
            });
        }

        const updated = await prisma.cartItem.update({
            where: { id: item.id },
            data: { quantity },
            include: { product: true },
        });

        res.status(200).json({
            message: 'Item updated successfully',
            data: updated
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong',
        });
    }
};

export const removeItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const productId = String(req.params.productId);

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            return res.status(404).json({ 
                error: 'Item is not in your cart' 
            });
        }

        const item = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        if (!item) {
            return res.status(404).json({ 
                error: 'Item is not in your cart' 
            });
        }

        await prisma.cartItem.delete({ 
            where: { id: item.id } 
        });
        res.status(200).json({
            message: 'Item removed from cart successfully'
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong',
        });
    }
};

export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;

        await prisma.cartItem.deleteMany({ 
            where: { cart: { userId } } 
        });
        res.status(200).json({
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong',
        });
    }
};
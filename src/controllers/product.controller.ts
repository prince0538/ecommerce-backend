import { Request, Response } from 'express';
import { Prisma } from '@prisma/client'
import prisma from '../prisma';
import { uploadImage } from '../cloudinary';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, stock, categoryId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                error: 'image is required'
            });
        }

        if (!name || price === undefined || !categoryId) {
            return res.status(400).json({
                error: 'name, price and categoryId are required'
            });
        }

        if (!Number.isInteger(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                error: 'Price must be a whole number (in kobo)'
            });
        }

        if (stock !== undefined && (!Number.isInteger(Number(stock)) || Number(stock) < 0)) {
            return res.status(400).json({
                error: 'stock must be a whole number, 0 or more'
            });
        }

        const existingCategory = await prisma.category.findUnique({
            where: { id: String(categoryId) }
        });

        if (!existingCategory) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        const imageUrl = await uploadImage(req.file.path);

        const product = await prisma.product.create({
            data: {
                name: String(name).trim(),
                description: description ?? null,
                price: Number(price),
                stock: stock !== undefined ? Number(stock) : 0,
                imageUrl,
                categoryId: String(categoryId)
            }
        });

        res.status(201).json({
            message: 'Product created successfully',
            data: product
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const search =
            typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
        const categoryId =
            typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;

        const where: Prisma.ProductWhereInput = {
            ...(categoryId && { categoryId }),
            ...(search && {
                AND: search.split(/\s+/).map((word) => ({
                    name: { contains: word, mode: 'insensitive' as const },
                })),
            }),
        };

        const products = await prisma.product.findMany({
            where,
            include: { category: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            message: 'Products retrieved successfully',
            data: products,
        })

    } catch (error) {
        console.error('getProducts failed:', error);
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: String(req.params.id) },
            include: { category: { select: { id: true, name: true } } },
        });
        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            })
        }
        res.status(200).json({
            message: 'Product retrieved successfully',
            data: product,
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        })

        if (!existingProduct) {
            return res.status(404).json({
                error: 'Product not found'
            })
        }

        if (req.body.categoryId) {
            const existingCategory = await prisma.category.findUnique({
                where: { id: req.body.categoryId },
            });

            if (!existingCategory) {
                return res.status(404).json({
                    error: 'Category does not exist'
                })
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { ...req.body }
        })

        res.status(200).json({
            message: 'Product updated successfully',
            data: updatedProduct,
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const product = await prisma.product.findUnique({
            where: { id }
        })

        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            })
        }

        const orderCount = await prisma.orderItem.count({
            where: { productId: id }
        });

        if (orderCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete product that has been ordered'
            })
        }

        await prisma.$transaction([
            prisma.cartItem.deleteMany({
                where: { productId: id }
            }),
            prisma.product.delete({
                where: { id }
            })
        ])

        res.status(200).json({
            message: 'Product deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}
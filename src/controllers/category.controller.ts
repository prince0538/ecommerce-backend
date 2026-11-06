import { Request, Response } from 'express';
import prisma from '../prisma';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            })
        }

        const existing = await prisma.category.findUnique({
            where: { name: name.trim() }
        })

        if (existing) {
            return res.status(400).json({
                error: 'Category already exists'
            })
        }

        const category = await prisma.category.create({
            data: { name: name.trim() },
        });

        res.status(201).json({
            message: 'Category created successfully',
            data: category
        })

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            message: 'Categories retrieved successfully',
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const getCategory = async (req: Request, res: Response) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: String(req.params.id) },
            include: { products: true }
        })
        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            })
        }
        res.status(200).json({
            message: 'Category retrieved successfully',
            data: category
        });
    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            })
        }

        const category = await prisma.category.findUnique({
            where: { id: String(req.params.id) }
        })

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            })
        }

        const existing = await prisma.category.findUnique({
            where: { name: name.trim() }
        })

        if (existing && existing.id !== String(req.params.id)) {
            return res.status(400).json({
                error: 'Category with this name already exists'
            })
        }

        const updatedCategory = await prisma.category.update({
            where: { id: String(req.params.id) },
            data: { name: name.trim() }
        })

        res.status(200).json({
            message: 'Category updated successfully',
            data: updatedCategory
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const category = await prisma.category.findUnique({
            where: { id: String(req.params.id) }
        })

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            })
        }

        const products = await prisma.product.findMany({
            where: { categoryId: String(req.params.id) }
        })

        if (products.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete category with associated products'
            })
        }

        await prisma.category.delete({
            where: { id: String(req.params.id) }
        })

        res.status(200).json({
            message: 'Category deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}
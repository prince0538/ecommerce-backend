import Joi from 'joi';

const uuid = Joi.string().uuid();


export const signupSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    password: Joi.string()
        .min(8)
        .max(72)
        .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
        .required()
        .messages({
            'string.pattern.base': 'password must contain at least one letter and one number',
        }),
});

export const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
});


export const idParamSchema = Joi.object({ id: uuid.required() });
export const productIdParamSchema = Joi.object({ productId: uuid.required() });


export const categorySchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
});


export const createProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().max(1000).allow('', null),
    price: Joi.number().integer().min(0).required(),
    stock: Joi.number().integer().min(0).default(0),
    imageUrl: Joi.string().uri().required(),
    categoryId: uuid.required(),
});

export const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(1000).allow('', null),
    price: Joi.number().integer().min(0),
    stock: Joi.number().integer().min(0),
    imageUrl: Joi.string().uri(),
    categoryId: uuid,
}).min(1);

export const productQuerySchema = Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
    search: Joi.string().trim().max(100),
    categoryId: uuid,
});


export const addCartItemSchema = Joi.object({
    productId: uuid.required(),
    quantity: Joi.number().integer().min(1).max(100).default(1),
});

export const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).max(100).required(),
});


export const orderStatusSchema = Joi.object({
    status: Joi.string().valid('PAID', 'SHIPPED', 'PENDING', 'CANCELLED', 'DELIVERED').required(),
});
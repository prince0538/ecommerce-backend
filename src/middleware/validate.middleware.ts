import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

type Target = 'body' | 'query' | 'params';

export const validate =
    (schema: Joi.ObjectSchema, target: Target = 'body') =>
        (req: Request, res: Response, next: NextFunction) => {
            const { error, value } = schema.validate(req[target], {
                abortEarly: false,
                stripUnknown: true,
                convert: true,
            });

            if (error) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.details.map((d) => ({
                        field: d.path.join('.'),
                        message: d.message,
                    })),
                });
                return;
            }
            
            if (target === 'body') {
                req.body = value;
            }
            next();
        };
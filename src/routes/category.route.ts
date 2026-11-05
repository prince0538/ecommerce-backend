import { Router } from 'express';
import {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller';

import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { categorySchema, idParamSchema } from '../validators/schemas';

const router = Router();

router.get('/', getCategories);
router.get('/:id', validate(idParamSchema, 'params'), getCategory);

router.post('/', authenticate, authorize('ADMIN'), validate(categorySchema), createCategory);
router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(categorySchema),
    updateCategory
);
router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    deleteCategory
);

export default router;
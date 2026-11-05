import { Router } from 'express';
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createProductSchema,
    updateProductSchema,
    productQuerySchema,
    idParamSchema,
} from '../validators/schemas';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), getProducts);
router.get('/:id', validate(idParamSchema, 'params'), getProduct);

router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validate(createProductSchema),
    upload.single('imageUrl'),
    createProduct
);
router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(updateProductSchema),
    updateProduct
);
router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    deleteProduct
);

export default router;
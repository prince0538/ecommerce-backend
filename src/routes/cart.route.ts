import { Router } from 'express';
import {
    getCart,
    addItemToCart,
    updateItem,
    removeItem,
    clearCart,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    addCartItemSchema,
    updateCartItemSchema,
    productIdParamSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', validate(addCartItemSchema), addItemToCart);
router.put(
    '/items/:productId',
    validate(productIdParamSchema, 'params'),
    validate(updateCartItemSchema),
    updateItem
);
router.delete('/item/:productId', validate(productIdParamSchema, 'params'), removeItem);
router.delete('/', clearCart);

export default router;
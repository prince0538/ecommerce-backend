import { Router } from 'express';
import {
    userCheckout,
    getMyOrders,
    getOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { idParamSchema, orderStatusSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/', userCheckout);
router.get('/', getMyOrders);
router.get('/admin/all', authorize('ADMIN'), getAllOrders);
router.get('/:id', validate(idParamSchema, 'params'), getOrder);
router.put(
    '/:id/status',
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(orderStatusSchema),
    updateOrderStatus
);
router.post('/:id/cancel', validate(idParamSchema, 'params'), cancelOrder);

export default router;
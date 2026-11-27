import { Router } from 'express';
import {
    userCheckout,
    getMyOrders,
    getOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    payForOrder,
    confirmPayment,
    updatePaymentStatus
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    idParamSchema,
    orderStatusSchema,
    referenceParamSchema,
    paymentStatusSchema,
    // checkoutSchema
} from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.post('/', authorize('USER'), userCheckout);
router.get('/', getMyOrders);
router.get('/admin/all', authorize('ADMIN'), getAllOrders);
router.get('/verify-payment/:reference', validate(referenceParamSchema, 'params'), confirmPayment);
router.get('/:id', validate(idParamSchema, 'params'), getOrder);
router.put(
    '/:id/status',
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(orderStatusSchema),
    updateOrderStatus
);
router.put(
    '/:id/payment-status',
    authorize('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(paymentStatusSchema),
    updatePaymentStatus
);
router.post('/:id/pay', validate(idParamSchema, 'params'), payForOrder);
router.post('/:id/cancel', validate(idParamSchema, 'params'), cancelOrder);

export default router;
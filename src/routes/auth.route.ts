import { Router } from 'express';
import {
    signUp,
    login,
    verifyOtp,
    resendOtp,
    getUsersProfile,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { signupSchema, loginSchema } from '../validators/schemas'

const router = Router();


router.post('/signUp', validate(signupSchema), signUp);
router.post('/login', validate(loginSchema), login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);


router.get('/profile', authenticate, getUserProfile);
router.patch('/profile', authenticate, updateUserProfile);
router.delete('/profile', authenticate, deleteUserProfile);


router.get('/profiles', authenticate, authorize('ADMIN'), getUsersProfile);

export default router;
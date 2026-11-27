import { Router } from 'express';
import {
    signUp,
    login,
    verifyUser,
    resendOtp,
    forgotPassword,
    getUsersProfile,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    resetPassword,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { signupSchema, loginSchema, resetPasswordSchema } from '../validators/schemas'

const router = Router();


router.post('/signUp', validate(signupSchema), signUp);
router.post('/login', validate(loginSchema), login);
router.post('/verify-otp', verifyUser);
router.post('/resend-otp', resendOtp);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);   


router.get('/profile', authenticate, getUserProfile);
router.patch('/profile', authenticate, updateUserProfile);
router.delete('/profile', authenticate, deleteUserProfile);


router.get('/profiles', authenticate, authorize('ADMIN'), getUsersProfile);

export default router;

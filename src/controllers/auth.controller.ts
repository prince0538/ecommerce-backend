import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendOtpEmail } from '../services/email.service';
import { generateOtp } from '../utils/otp.utils';
import { AuthRequest } from '../middleware/auth.middleware';

export const signUp = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'name, email password are required'
            })
        }

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })
        if (existing) {
            return res.status(409).json({
                error: 'Email already exits'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const { otp, otpHash, otpExpires } = await generateOtp()

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase(),
                password: hashedPassword,
                otpHash,
                otpExpires
            }
        })

        await sendOtpEmail(user.email, otp, user.name)

        res.status(201).json({
            message: 'User created successfully. Check your email for the OTP',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error: any) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                error: 'email and otp are required'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            omit: { otpHash: false }
        })

        if (!user || !user.otpHash || !user.otpExpires) {
            return res.status(400).json({
                error: 'Invalid or expired OTP'
            })
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                error: 'Invalid or expired OTP'
            })
        }

        const validOtp = await bcrypt.compare(String(otp), user.otpHash)
        if (!validOtp) {
            return res.status(400).json({
                error: 'Invalid or expired OTP'
            })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otpHash: null,
                otpExpires: null
            }
        })

        res.status(200).json({
            message: 'Email verified successfully'
        })
    } catch (error: any) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                error: 'email is required'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })
        if (!user || user.isVerified) {
            return res.status(200).json({
                message: 'If the account exists, a new OTP has been sent'
            })
        }

        const { otp, otpHash, otpExpires } = await generateOtp()

        await prisma.user.update({
            where: { id: user.id },
            data: { otpHash, otpExpires }
        })

        await sendOtpEmail(user.email, otp)

        res.status(200).json({
            message: 'If the account exists, a new OTP has been sent'
        })
    } catch (error: any) {
        res.status(500).json({
            error: 'Something went wrong'
        })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'email and password are required'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            omit: { password: false }
        })

        const validPassword = user && (await bcrypt.compare(password, user.password));
        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid email or password'
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                error: 'Please verify your email first'
            })
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        )

        const Userdata = {
            name: user.name,
            email: user.email,
            role: user.role
        }

        res.status(200).json({
            message: 'Login successful',
            token,
            Userdata
        })

    } catch (error: any) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const getUsersProfile = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            omit: { password: true }
        })
        res.status(200).json({
            message: 'Users profiles retrieved successfully',
            users
        })
    } catch (error: any) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            omit: { password: true }
        })
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            })
        }
        res.status(200).json({
            message: 'User profile retrieved successfully',
            user
        })
    } catch (error: any) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        const { name, email, password } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase();
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            omit: { password: true }
        })
        res.status(200).json({
            message: 'User profile updated successfully',
            user
        })

    } catch (error: any) {
        res.status(500).json({
            error: error.message
        })
    }
}

export const deleteUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id as string;
        await prisma.user.delete({
            where: { id: userId }
        })
        res.status(200).json({
            message: 'User profile deleted successfully'
        })
    } catch (error: any) {
        res.status(500).json({
            error: error.message
        })
    }
}
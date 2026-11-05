import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';

export const generateOtp = async () => {
    const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    return { otp, otpHash, otpExpires };
};
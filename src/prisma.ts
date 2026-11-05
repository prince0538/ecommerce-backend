import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  omit: { user: { password: true, otpHash: true } },
});

export default prisma;
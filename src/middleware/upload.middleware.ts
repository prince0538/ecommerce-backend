import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'assets');


fs.mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
    storage: multer.diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb) => {
            cb(null, uploadDir);
        },
        filename: (_req: Request, file: Express.Multer.File, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: 1024 * 1024 * 40, 
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed!'));
        } else {
            cb(null, true);
        }
    },
});
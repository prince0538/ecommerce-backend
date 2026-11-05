import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log('Cloudinary config:', {
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret_loaded: Boolean(process.env.CLOUDINARY_API_SECRET),
// });

export const uploadImage = async (filePath: string): Promise<string> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, { folder: 'products' });
        return result.secure_url;
    } finally {
        await fs.unlink(filePath).catch(() => { });
    }
};
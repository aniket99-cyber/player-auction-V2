import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder: string; publicId?: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed with no result'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}

export { cloudinary };

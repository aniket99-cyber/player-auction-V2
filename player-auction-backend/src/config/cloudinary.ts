import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env';
import { logger } from '@utils/logger';

const hasCloudinaryConfig = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

async function ensureCloudinaryFolder(folder: string): Promise<void> {
  try {
    await cloudinary.api.create_folder(folder);
  } catch (error: unknown) {
    const message = (error as Error).message ?? '';
    if (!message.includes('already exists')) {
      throw error;
    }
  }
}

function buildFallbackAssetRef(options: { folder: string; publicId?: string; originalName?: string }): string {
  const normalizedName = options.originalName?.trim() || options.publicId || 'upload';
  return `${options.folder}/${normalizedName}`;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder: string; publicId?: string; originalName?: string },
): Promise<CloudinaryUploadResult> {
  if (!hasCloudinaryConfig) {
    logger.warn('Cloudinary is not configured. Saving a fallback asset reference instead.', {
      folder: options.folder,
      publicId: options.publicId,
      originalName: options.originalName,
    });
    const fallbackRef = buildFallbackAssetRef(options);
    return { secureUrl: fallbackRef, publicId: options.publicId || fallbackRef };
  }

  try {
    await ensureCloudinaryFolder(options.folder);

    const result = await new Promise<{ secure_url: string; public_id?: string }>((resolve, reject) => {
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
          resolve(result as { secure_url: string; public_id?: string });
        },
      );

      uploadStream.end(buffer);
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id || options.publicId || buildFallbackAssetRef(options),
    };
  } catch (error) {
    logger.warn('Cloudinary upload failed. Saving a fallback asset reference instead.', {
      folder: options.folder,
      publicId: options.publicId,
      originalName: options.originalName,
      message: error instanceof Error ? error.message : error,
    });
    const fallbackRef = buildFallbackAssetRef(options);
    return { secureUrl: fallbackRef, publicId: options.publicId || fallbackRef };
  }
}

export { cloudinary };

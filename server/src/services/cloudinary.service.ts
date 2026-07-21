import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';

const BASE_FOLDER = 'craftlocal';

export const buildImageFolder = (type: 'categories' | 'workshops' | 'products' | 'avatars' | 'reviews' | 'hero') => {
  return `${BASE_FOLDER}/${type}`;
};

/**
 * Upload a buffer (from multer memory storage) to Cloudinary
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = BASE_FOLDER,
  publicId?: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: any = {
      folder,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    };
    if (publicId) options.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a PDF file buffer to Cloudinary
 */
export const uploadPdfBufferToCloudinary = (
  buffer: Buffer,
  folder: string = BASE_FOLDER,
  originalName?: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const ext = originalName && originalName.includes('.') ? originalName.split('.').pop() : 'pdf';
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    
    const options: any = {
      folder,
      resource_type: 'raw',
      public_id: uniqueId,
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload a local file to Cloudinary (for migration scripts)
 */
export const uploadLocalFileToCloudinary = async (
  filePath: string,
  folder: string = BASE_FOLDER,
  publicId?: string
) => {
  const options: any = {
    folder,
    resource_type: 'image',
    quality: 'auto:good',
    fetch_format: 'auto',
  };
  if (publicId) options.public_id = publicId;

  return cloudinary.uploader.upload(filePath, options);
};

/**
 * Delete an image from Cloudinary by publicId
 */
export const deleteCloudinaryImage = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};

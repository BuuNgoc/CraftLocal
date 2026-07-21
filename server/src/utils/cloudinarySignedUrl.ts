import cloudinary from '../config/cloudinary';

/**
 * Generate a signed URL for a raw asset in Cloudinary
 * to allow temporary authenticated access to private resources.
 */
export function getSignedRawPdfUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    secure: true,
    sign_url: true,
  });
}

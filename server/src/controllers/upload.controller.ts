import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadBufferToCloudinary, uploadPdfBufferToCloudinary } from '../services/cloudinary.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

function mapFolder(clientFolder?: string): string {
  const base = process.env.CLOUDINARY_FOLDER || 'craftlocal';
  if (!clientFolder) return `${base}/products`;
  
  switch (clientFolder.toLowerCase().trim()) {
    case 'product':
    case 'products':
      return `${base}/products`;
    case 'workshop':
    case 'workshops':
      return `${base}/workshops`;
    case 'category':
    case 'categories':
      return `${base}/categories`;
    case 'avatar':
    case 'avatars':
      return `${base}/avatars`;
    case 'review':
    case 'reviews':
      return `${base}/reviews`;
    default:
      return `${base}/${clientFolder}s`;
  }
}

export const uploadSingleController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'Vui lòng chọn ảnh để upload', 400);
    }

    const folder = mapFolder(req.body.folder);
    console.log(`Uploading single image to Cloudinary folder: ${folder}`);

    let url = '';
    let publicId = '';
    let width = 1200;
    let height = 800;
    let format = path.extname(req.file.originalname).replace('.', '') || 'jpg';

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, folder);
      url = result.secure_url;
      publicId = result.public_id;
      width = result.width;
      height = result.height;
      format = result.format;
    } catch (cloudinaryError: any) {
      console.warn('⚠️ Cloudinary upload failed, using local storage fallback:', cloudinaryError.message);
      
      const uploadDir = path.resolve(__dirname, '../../public/images/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExt = path.extname(req.file.originalname) || '.jpg';
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const filePath = path.join(uploadDir, uniqueName);

      fs.writeFileSync(filePath, req.file.buffer);
      url = `/images/uploads/${uniqueName}`;
      publicId = `local-${uniqueName}`;
      format = fileExt.replace('.', '');
    }

    return sendSuccess(res, 'Upload ảnh thành công', {
      url,
      secureUrl: url,
      publicId,
      width,
      height,
      format,
    }, 201);

  } catch (error: any) {
    console.error('Error in uploadSingleController:', error);
    return sendError(res, error.message || 'Lỗi upload ảnh', 500);
  }
};

export const uploadMultipleController = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendError(res, 'Vui lòng chọn ảnh để upload', 400);
    }

    const folder = mapFolder(req.body.folder);
    console.log(`Uploading multiple images to Cloudinary folder: ${folder}`);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await uploadBufferToCloudinary(file.buffer, folder);
          return {
            url: result.secure_url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          };
        } catch (cloudinaryError: any) {
          console.warn('⚠️ Cloudinary upload failed, using local storage fallback:', cloudinaryError.message);
          
          const uploadDir = path.resolve(__dirname, '../../public/images/uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          const fileExt = path.extname(file.originalname) || '.jpg';
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
          const filePath = path.join(uploadDir, uniqueName);

          fs.writeFileSync(filePath, file.buffer);
          const localUrl = `/images/uploads/${uniqueName}`;
          return {
            url: localUrl,
            secureUrl: localUrl,
            publicId: `local-${uniqueName}`,
            width: 1200,
            height: 800,
            format: fileExt.replace('.', ''),
          };
        }
      })
    );

    return sendSuccess(res, 'Upload nhiều ảnh thành công', {
      images: results,
    }, 201);

  } catch (error: any) {
    console.error('Error in uploadMultipleController:', error);
    return sendError(res, error.message || 'Lỗi upload ảnh', 500);
  }
};

function buildCloudinaryPdfDownloadUrl(secureUrl: string) {
  if (!secureUrl) return '';
  if (secureUrl.includes('/raw/upload/')) {
    return secureUrl.replace('/raw/upload/', '/raw/upload/fl_attachment/');
  }
  if (secureUrl.includes('/image/upload/')) {
    return secureUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
  }
  return secureUrl;
}

export const uploadPdfController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'Vui lòng chọn file để upload', 400);
    }

    const base = process.env.CLOUDINARY_FOLDER || 'craftlocal';
    const folder = `${base}/host-applications`;
    console.log(`Uploading PDF to Cloudinary folder: ${folder}`);

    // 1. Upload Cloudinary
    const result = await uploadPdfBufferToCloudinary(req.file.buffer, folder, req.file.originalname);
    const downloadUrl = buildCloudinaryPdfDownloadUrl(result.secure_url);

    // 2. Save local copy as fallback
    let localPath = '';
    try {
      const uploadDir = path.resolve(__dirname, '../../public/uploads/host-applications');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueLocalName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
      const localFilePath = path.join(uploadDir, uniqueLocalName);
      fs.writeFileSync(localFilePath, req.file.buffer);
      localPath = `/uploads/host-applications/${uniqueLocalName}`;
      console.log(`Successfully saved local PDF copy to: ${localPath}`);
    } catch (localWriteErr: any) {
      console.error('⚠️ Failed to save local copy of PDF:', localWriteErr.message);
    }

    return sendSuccess(res, 'Upload file PDF thành công', {
      url: result.secure_url,
      secureUrl: result.secure_url,
      downloadUrl,
      publicId: result.public_id,
      resourceType: result.resource_type || 'raw',
      localPath,
      originalName: req.file.originalname,
      format: result.format || 'pdf',
      size: req.file.size,
    }, 201);
  } catch (error: any) {
    console.error('Error in uploadPdfController:', error);
    return sendError(res, error.message || 'Lỗi upload file PDF', 500);
  }
};


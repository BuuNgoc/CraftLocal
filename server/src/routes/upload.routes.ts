import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingle, uploadMultiple, uploadPdfMiddleware } from '../middlewares/upload.middleware';
import { uploadSingleController, uploadMultipleController, uploadPdfController } from '../controllers/upload.controller';
import { sendError } from '../utils/apiResponse';

const router = Router();
router.use(authMiddleware);

// POST /api/upload/single
router.post('/single', (req: Request, res: Response, next: NextFunction) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Ảnh không được vượt quá 10MB', 400);
      }
      return sendError(res, err.message || 'Lỗi upload ảnh', 400);
    }
    next();
  });
}, uploadSingleController);

// POST /api/upload/multiple
router.post('/multiple', (req: Request, res: Response, next: NextFunction) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'Ảnh không được vượt quá 10MB', 400);
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendError(res, 'Tối đa 5 ảnh cho mỗi lần upload', 400);
      }
      return sendError(res, err.message || 'Lỗi upload ảnh', 400);
    }
    next();
  });
}, uploadMultipleController);

// POST /api/upload/pdf
router.post('/pdf', (req: Request, res: Response, next: NextFunction) => {
  uploadPdfMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File PDF không được vượt quá 10MB.', 400);
      }
      return sendError(res, err.message || 'Lỗi upload file PDF', 400);
    }
    next();
  });
}, uploadPdfController);

export default router;

import { Router } from 'express';
import { authMiddleware, pdfAuthMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';
import {
  applyForHost,
  getMyApplication,
  getAdminApplications,
  getAdminApplicationById,
  approveApplication,
  rejectApplication,
  viewHostApplicationCertificate,
  downloadHostApplicationCertificate,
} from '../controllers/hostApplication.controller';

const router = Router();

// User routes
router.post('/apply', authMiddleware, applyForHost);
router.get('/me', authMiddleware, getMyApplication);

// Admin routes
router.get('/admin/host-applications', authMiddleware, roleMiddleware('ADMIN'), getAdminApplications);
router.get('/admin/host-applications/:id', authMiddleware, roleMiddleware('ADMIN'), getAdminApplicationById);
router.put('/admin/host-applications/:id/approve', authMiddleware, roleMiddleware('ADMIN'), approveApplication);
router.put('/admin/host-applications/:id/reject', authMiddleware, roleMiddleware('ADMIN'), rejectApplication);

// Certificate Proxy View & Download
router.get('/admin/host-applications/:id/certificate/view', pdfAuthMiddleware, roleMiddleware('ADMIN'), viewHostApplicationCertificate);
router.get('/admin/host-applications/:id/certificate/download', pdfAuthMiddleware, roleMiddleware('ADMIN'), downloadHostApplicationCertificate);

export default router;

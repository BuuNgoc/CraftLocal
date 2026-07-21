import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import HostApplication from '../models/hostApplication.model';
import User from '../models/user.model';
import { getSignedRawPdfUrl } from '../utils/cloudinarySignedUrl';
import { NotificationService } from '../services/notification.service';

/**
 * Gửi yêu cầu trở thành Chủ xưởng
 * POST /api/host-applications/apply
 */
export const applyForHost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  if (req.user!.role === 'HOST') {
    return sendError(res, 'Tài khoản của bạn đã là Chủ xưởng.', 400);
  }

  if (req.user!.role === 'ADMIN' || req.user!.role === 'TOUR_GUIDE') {
    return sendError(res, 'Quản trị viên hoặc Hướng dẫn viên không thể thực hiện chức năng này.', 400);
  }

  // Kiểm tra có yêu cầu PENDING nào không
  const pendingApp = await HostApplication.findOne({ userId, status: 'PENDING' });
  if (pendingApp) {
    return sendError(res, 'Bạn đã gửi yêu cầu và đang chờ duyệt.', 400);
  }

  const {
    workshopName,
    ownerName,
    ownerPhone,
    businessAddress,
    description,
    specialization,
    experience,
    certificateFile,
  } = req.body;

  if (!workshopName || !ownerName || !ownerPhone || !businessAddress || !description || !certificateFile) {
    return sendError(res, 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.', 400);
  }

  if (!certificateFile.secureUrl) {
    return sendError(res, 'Vui lòng tải lên file PDF hồ sơ xác minh.', 400);
  }

  const application = await HostApplication.create({
    userId,
    fullName: req.user!.fullName,
    email: req.user!.email,
    phone: req.user!.phone || ownerPhone,
    workshopName,
    ownerName,
    ownerPhone,
    businessAddress,
    description,
    specialization,
    experience,
    certificateFile: {
      url: certificateFile.url || certificateFile.secureUrl,
      secureUrl: certificateFile.secureUrl,
      downloadUrl: certificateFile.downloadUrl || certificateFile.secureUrl,
      publicId: certificateFile.publicId,
      resourceType: certificateFile.resourceType || 'raw',
      localPath: certificateFile.localPath,
      originalName: certificateFile.originalName,
      format: certificateFile.format || 'pdf',
      size: certificateFile.size,
    },
    status: 'PENDING',
  });

  // Fire-and-forget notifications
  NotificationService.notifyAdmin({
    title: 'Yêu cầu Chủ xưởng mới',
    message: `${req.user!.fullName} đã gửi hồ sơ đăng ký làm Chủ xưởng.`,
    type: 'HOST_APPLICATION',
    actionUrl: '/admin/approve-hosts',
    priority: 'HIGH',
  }).catch(() => {});
  NotificationService.notifyUser(userId.toString(), {
    title: 'Đã gửi hồ sơ Chủ xưởng',
    message: 'Hồ sơ của bạn đang chờ Admin xét duyệt.',
    type: 'HOST_APPLICATION',
    actionUrl: '/profile',
  }).catch(() => {});

  return sendSuccess(res, 'Gửi yêu cầu đăng ký Chủ xưởng thành công. Vui lòng chờ Admin xét duyệt.', { application }, 201);
});


/**
 * Xem yêu cầu mới nhất của tôi
 * GET /api/host-applications/me
 */
export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const application = await HostApplication.findOne({ userId }).sort({ createdAt: -1 });

  return sendSuccess(res, 'Lấy thông tin yêu cầu thành công', { application });
});

/**
 * Lấy tất cả yêu cầu (Admin)
 * GET /api/admin/host-applications
 */
export const getAdminApplications = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: any = {};
  if (status) {
    filter.status = status;
  }

  const applications = await HostApplication.find(filter)
    .populate('userId', 'fullName email phone avatar')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Lấy danh sách yêu cầu thành công', { applications });
});

/**
 * Lấy chi tiết yêu cầu (Admin)
 * GET /api/admin/host-applications/:id
 */
export const getAdminApplicationById = asyncHandler(async (req: Request, res: Response) => {
  const application = await HostApplication.findById(req.params.id)
    .populate('userId', 'fullName email phone avatar');

  if (!application) {
    return sendError(res, 'Không tìm thấy yêu cầu xét duyệt.', 404);
  }

  return sendSuccess(res, 'Lấy chi tiết yêu cầu thành công', { application });
});

/**
 * Duyệt yêu cầu trở thành Chủ xưởng
 * PUT /api/admin/host-applications/:id/approve
 */
export const approveApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await HostApplication.findById(req.params.id);
  if (!application) {
    return sendError(res, 'Không tìm thấy yêu cầu xét duyệt.', 404);
  }

  if (application.status !== 'PENDING') {
    return sendError(res, 'Yêu cầu này đã được xử lý từ trước.', 400);
  }

  // Update application status
  application.status = 'APPROVED';
  application.reviewedBy = req.user!._id as any;
  application.reviewedAt = new Date();
  await application.save();

  // Update user role to HOST
  const user = await User.findById(application.userId);
  if (user) {
    user.role = 'HOST';
    user.status = 'ACTIVE';
    user.hostProfile = {
      workshopName: application.workshopName,
      ownerName: application.ownerName,
      ownerPhone: application.ownerPhone,
      businessAddress: application.businessAddress,
      description: application.description,
      specialization: application.specialization,
      experience: application.experience,
      certificateFile: application.certificateFile,
      approvedAt: new Date(),
      approvedBy: req.user!._id as any,
    };
    await user.save();
  }

  // Notify user about approval
  NotificationService.notifyUser(application.userId.toString(), {
    title: 'Hồ sơ Chủ xưởng đã được duyệt',
    message: 'Chúc mừng! Bạn đã trở thành Chủ xưởng trên CraftLocal.',
    type: 'HOST_APPLICATION',
    actionUrl: '/host/dashboard',
    priority: 'HIGH',
  }).catch(() => {});

  return sendSuccess(res, 'Duyệt yêu cầu thành công. Người dùng đã trở thành Chủ xưởng.', { application, user });
});

/**
 * Từ chối yêu cầu trở thành Chủ xưởng
 * PUT /api/admin/host-applications/:id/reject
 */
export const rejectApplication = asyncHandler(async (req: Request, res: Response) => {
  const { rejectReason } = req.body;
  if (!rejectReason) {
    return sendError(res, 'Vui lòng cung cấp lý do từ chối.', 400);
  }

  const application = await HostApplication.findById(req.params.id);
  if (!application) {
    return sendError(res, 'Không tìm thấy yêu cầu xét duyệt.', 404);
  }

  if (application.status !== 'PENDING') {
    return sendError(res, 'Yêu cầu này đã được xử lý từ trước.', 400);
  }

  application.status = 'REJECTED';
  application.rejectReason = rejectReason;
  application.reviewedBy = req.user!._id as any;
  application.reviewedAt = new Date();
  await application.save();

  // Notify user about rejection
  NotificationService.notifyUser(application.userId.toString(), {
    title: 'Hồ sơ Chủ xưởng bị từ chối',
    message: 'Hồ sơ của bạn chưa được duyệt. Vui lòng xem lý do trong hồ sơ cá nhân.',
    type: 'HOST_APPLICATION',
    actionUrl: '/profile',
    priority: 'HIGH',
  }).catch(() => {});

  return sendSuccess(res, 'Từ chối yêu cầu thành công.', { application });
});

/**
 * Helper to fetch file from Cloudinary (with fallback to signed URL)
 */
async function fetchPdfBuffer(secureUrl: string, publicId: string): Promise<Buffer | null> {
  console.log("Certificate publicId:", publicId);
  console.log("Trying Cloudinary URL:", secureUrl);

  try {
    // 1. Thử fetch từ URL trực tiếp
    const response = await fetch(secureUrl);
    console.log("Cloudinary PDF fetch status (direct):", response.status);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err: any) {
    console.warn("Direct fetch from Cloudinary failed:", err.message);
  }

  // 2. Thử fetch bằng signed URL
  if (publicId) {
    try {
      const signedUrl = getSignedRawPdfUrl(publicId);
      console.log("Trying signed URL:", signedUrl);
      const response = await fetch(signedUrl);
      console.log("Cloudinary PDF fetch status (signed):", response.status);

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (signedErr: any) {
      console.warn("Signed fetch from Cloudinary failed:", signedErr.message);
    }
  }

  return null;
}

/**
 * Xem file PDF qua Backend Proxy (chỉ Admin được truy cập)
 * GET /api/admin/host-applications/:id/certificate/view
 */
export const viewHostApplicationCertificate = asyncHandler(async (req: Request, res: Response) => {
  const application = await HostApplication.findById(req.params.id);
  if (!application || !application.certificateFile) {
    return sendError(res, 'Không tìm thấy tài liệu đính kèm.', 404);
  }

  const { secureUrl, publicId, localPath, originalName } = application.certificateFile;
  
  // Thử tải buffer online
  let pdfBuffer = await fetchPdfBuffer(secureUrl, publicId);

  // Fallback: Nếu không tải được online, đọc file local
  if (!pdfBuffer && localPath) {
    try {
      const localFilePath = path.resolve(__dirname, '../../public', localPath.replace(/^\//, ''));
      console.log("Online fetch failed, falling back to local file:", localFilePath);
      if (fs.existsSync(localFilePath)) {
        pdfBuffer = fs.readFileSync(localFilePath);
      }
    } catch (localReadErr: any) {
      console.error("Local file fallback read failed:", localReadErr.message);
    }
  }

  if (!pdfBuffer) {
    return sendError(res, 'Cloudinary đang chặn quyền truy cập PDF và không tìm thấy bản lưu local. Vui lòng kiểm tra lại quyền truy cập hoặc upload lại file.', 502);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${originalName || 'certificate.pdf'}"`);
  return res.send(pdfBuffer);
});

/**
 * Tải file PDF qua Backend Proxy (chỉ Admin được truy cập)
 * GET /api/admin/host-applications/:id/certificate/download
 */
export const downloadHostApplicationCertificate = asyncHandler(async (req: Request, res: Response) => {
  const application = await HostApplication.findById(req.params.id);
  if (!application || !application.certificateFile) {
    return sendError(res, 'Không tìm thấy tài liệu đính kèm.', 404);
  }

  const { secureUrl, publicId, localPath, originalName } = application.certificateFile;
  
  // Thử tải buffer online
  let pdfBuffer = await fetchPdfBuffer(secureUrl, publicId);

  // Fallback: Nếu không tải được online, đọc file local
  if (!pdfBuffer && localPath) {
    try {
      const localFilePath = path.resolve(__dirname, '../../public', localPath.replace(/^\//, ''));
      console.log("Online fetch failed, falling back to local file:", localFilePath);
      if (fs.existsSync(localFilePath)) {
        pdfBuffer = fs.readFileSync(localFilePath);
      }
    } catch (localReadErr: any) {
      console.error("Local file fallback read failed:", localReadErr.message);
    }
  }

  if (!pdfBuffer) {
    return sendError(res, 'Cloudinary đang chặn quyền truy cập PDF và không tìm thấy bản lưu local. Vui lòng kiểm tra lại quyền truy cập hoặc upload lại file.', 502);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${originalName || 'certificate.pdf'}"`);
  return res.send(pdfBuffer);
});

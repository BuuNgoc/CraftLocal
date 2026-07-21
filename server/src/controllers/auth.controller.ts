import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthService } from '../services/auth.service';
import { verifyGoogleCredential } from '../services/googleAuth.service';
import { generateToken } from '../utils/generateToken';
import User from '../models/user.model';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  sendSuccess(res, 'Đăng ký tài khoản thành công', result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);
  sendSuccess(res, 'Đăng nhập thành công!', result);
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    return sendError(res, 'Thiếu Google credential', 400);
  }

  // Verify the Google ID token
  let profile;
  try {
    profile = await verifyGoogleCredential(credential);
  } catch (err) {
    return sendError(res, 'Google token không hợp lệ', 401);
  }

  const { googleId, email, fullName, avatar } = profile;

  // Check if user exists by email
  let user = await User.findOne({ email });

  if (user) {
    // User exists - check if blocked
    if (user.status === 'BLOCKED') {
      return sendError(res, 'Tài khoản của bạn đã bị khóa', 403);
    }

    // Link Google account if not linked yet
    const updateFields: Record<string, any> = {
      lastLoginAt: new Date(),
    };

    if (!user.googleId) {
      updateFields.googleId = googleId;
    }

    if (!user.avatar && avatar) {
      updateFields.avatar = avatar;
    }

    await User.findByIdAndUpdate(user._id, updateFields);

    // Refresh user data after update
    user = await User.findById(user._id);
  } else {
    // Create new user with Google info
    user = await User.create({
      fullName,
      email,
      avatar,
      googleId,
      authProvider: 'GOOGLE',
      role: 'TOURIST',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    });
  }

  if (!user) {
    return sendError(res, 'Không thể xử lý đăng nhập Google', 500);
  }

  // Generate CraftLocal JWT token
  const token = generateToken(user._id.toString(), user.role);

  // Build safe user object (no password)
  const userObj = user.toJSON();

  sendSuccess(res, 'Đăng nhập Google thành công', {
    token,
    user: userObj,
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) return sendError(res, 'Người dùng không tồn tại', 404);
  sendSuccess(res, 'Lấy thông tin thành công', user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, phone, avatar, defaultAddress } = req.body;

  // Only allow safe fields to be updated
  const updateData: Record<string, any> = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phone !== undefined) updateData.phone = phone;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (defaultAddress !== undefined) updateData.defaultAddress = defaultAddress;

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    updateData,
    { new: true, runValidators: true }
  );
  if (!user) return sendError(res, 'Người dùng không tồn tại', 404);
  sendSuccess(res, 'Cập nhật hồ sơ thành công', { user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');
  if (!user) return sendError(res, 'Người dùng không tồn tại', 404);

  if (user.authProvider === 'GOOGLE' && !user.password) {
    return sendError(res, 'Tài khoản Google không có mật khẩu để thay đổi. Vui lòng thiết lập mật khẩu trước.', 400);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return sendError(res, 'Mật khẩu hiện tại không đúng');

  user.password = newPassword;
  await user.save();
  sendSuccess(res, 'Đổi mật khẩu thành công');
});

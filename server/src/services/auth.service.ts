import User, { IUser } from '../models/user.model';
import { generateToken } from '../utils/generateToken';

export class AuthService {
  static async register(data: { fullName: string; email: string; password: string; phone?: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new Error('Email đã được đăng ký');

    const user = await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'TOURIST',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
    });

    const token = generateToken(user._id.toString(), user.role);
    const userObj = user.toJSON();

    return { user: userObj, token };
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Email hoặc mật khẩu không đúng');

    // Google-only users should not login with password
    if (user.authProvider === 'GOOGLE' && !user.password) {
      throw new Error('Tài khoản này sử dụng Google để đăng nhập. Vui lòng dùng nút "Tiếp tục với Google".');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error('Email hoặc mật khẩu không đúng');

    if (user.status === 'BLOCKED') throw new Error('Tài khoản đã bị khóa');

    // Update lastLoginAt
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const token = generateToken(user._id.toString(), user.role);
    const userObj = user.toJSON();

    return { user: userObj, token };
  }
}

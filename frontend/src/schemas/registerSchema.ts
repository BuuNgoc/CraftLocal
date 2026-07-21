import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
    phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số').max(15, 'Số điện thoại quá dài'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    role: z.enum(['TOURIST', 'HOST']).default('TOURIST').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không trùng khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

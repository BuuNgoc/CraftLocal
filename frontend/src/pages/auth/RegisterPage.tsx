import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../../schemas/registerSchema';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { User, Mail, Phone, Lock, Eye, EyeOff, Users, Info, AlertCircle } from 'lucide-react';
import authApi from '../../api/authApi';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TOURIST' },
  });

  const [error, setError] = useState('');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      await authApi.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'TOURIST',
      });
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Tạo tài khoản mới</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Chào mừng bạn tham gia CraftLocal</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Họ và tên" placeholder="Nguyễn Văn A" icon={<User className="h-4 w-4" />} error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email" type="email" placeholder="email@example.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Input label="Số điện thoại" type="tel" placeholder="0901234567" icon={<Phone className="h-4 w-4" />} error={errors.phone?.message} {...register('phone')} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Mật khẩu"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="p-0.5 hover:text-[#A65A3A] transition-colors" tabIndex={-1}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Xác nhận mật khẩu"
            type={showConfirmPwd ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="p-0.5 hover:text-[#A65A3A] transition-colors" tabIndex={-1}>
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" fullWidth size="md" isLoading={isSubmitting}>Đăng ký ngay</Button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">hoặc</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google Register Button */}
      <GoogleLoginButton
        buttonText="Đăng ký bằng Google"
        onPendingHost={(msg) => setSuccess(msg)}
      />

      {/* Note about Google register creating TOURIST account */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 leading-relaxed font-semibold">
          Đăng ký tài khoản mặc định sẽ là Khách du lịch. Nếu bạn muốn trở thành Chủ xưởng, hãy gửi yêu cầu nâng cấp trong trang Hồ sơ cá nhân sau khi đăng nhập.
        </p>
      </div>

      <p className="text-center mt-6 text-xs text-gray-500 font-semibold">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-[#A65A3A] font-extrabold hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
};

export default RegisterPage;

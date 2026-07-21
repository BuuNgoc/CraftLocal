import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../../schemas/loginSchema';
import { useAuth } from '../../hooks/useAuth';
import { getRoleRedirectPath } from '../../utils/roleRedirect';
import authApi from '../../api/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;
    setError('');
    setPendingMessage('');
    try {
      const res = await authApi.login(data);
      const { token, user } = res.data.data;
      login(token, user);
      navigate(getRoleRedirectPath(user.role));
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
      setError(msg);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 p-8 md:p-10 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Đăng nhập tài khoản</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Chào mừng bạn quay trở lại CraftLocal</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {pendingMessage && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          {pendingMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="email@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
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
        <div className="flex items-center justify-between text-xs font-semibold">
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-650">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#A65A3A] focus:ring-[#A65A3A]/20" />
            Ghi nhớ tài khoản
          </label>
          <span className="text-[#A65A3A] hover:underline cursor-pointer">Quên mật khẩu?</span>
        </div>
        <Button type="submit" fullWidth size="md" isLoading={isSubmitting} disabled={isSubmitting}>Đăng nhập</Button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">hoặc</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google Login Button */}
      <GoogleLoginButton
        buttonText="Tiếp tục với Google"
        onPendingHost={(msg) => setPendingMessage(msg)}
      />

      <p className="text-center mt-6 text-xs text-gray-500 font-semibold">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-[#A65A3A] font-extrabold hover:underline">Đăng ký ngay</Link>
      </p>
    </div>
  );
};

export default LoginPage;

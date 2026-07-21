import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types/user.type';
import { AlertCircle } from 'lucide-react';

const getRedirectPath = (user: User): string => {
  // BLOCKED users are already blocked by backend, but double-check
  if (user.status === 'BLOCKED') {
    return '/login';
  }

  // HOST with PENDING status -> waiting for approval
  if (user.role === 'HOST' && user.status === 'PENDING') {
    return '/login';
  }

  switch (user.role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'HOST':
      return '/host/dashboard';
    case 'TOUR_GUIDE':
      return '/tour-guide/dashboard';
    case 'TOURIST':
    default:
      return '/';
  }
};

interface GoogleLoginButtonProps {
  buttonText?: string;
  onPendingHost?: (message: string) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  buttonText: _buttonText,
  onPendingHost,
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (isLoading) return;

    const credential = credentialResponse?.credential;
    if (!credential) {
      setError('Không nhận được thông tin từ Google. Vui lòng thử lại.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await loginWithGoogle(credential);

      // Handle HOST with PENDING status
      if (user.role === 'HOST' && user.status === 'PENDING') {
        if (onPendingHost) {
          onPendingHost('Tài khoản Chủ xưởng của bạn đang chờ phê duyệt.');
        }
        return;
      }

      navigate(getRedirectPath(user));
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Đăng nhập Google thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div
        className={`w-full flex justify-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          size="large"
          width="100%"
          theme="outline"
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;

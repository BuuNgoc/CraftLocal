import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-lg rounded-2xl',
  };

  const initial = name ? name[0].toUpperCase() : 'U';

  return src ? (
    <img
      src={src}
      alt={name}
      className={`object-cover border border-gray-200 shrink-0 ${sizeClasses[size]} ${className}`}
    />
  ) : (
    <div
      className={`bg-[#A65A3A]/10 border border-[#A65A3A]/20 text-[#A65A3A] font-extrabold flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  className?: string;
  alt: string;
  type?: 'workshop' | 'product' | 'category' | 'avatar' | 'hero';
}

const gradients: Record<string, string> = {
  workshop: 'from-amber-100 via-orange-50 to-yellow-50',
  product: 'from-rose-50 via-amber-50 to-orange-50',
  category: 'from-teal-50 via-emerald-50 to-cyan-50',
  avatar: 'from-blue-50 via-indigo-50 to-purple-50',
  hero: 'from-stone-200 via-amber-100 to-orange-100',
};

const icons: Record<string, string> = {
  workshop: '🏺',
  product: '🎁',
  category: '📁',
  avatar: '👤',
  hero: '🌄',
};

const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  fallbackSrc,
  className = '',
  alt,
  type = 'workshop',
  ...props
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  const resolveUrl = (s?: string) => {
    if (!s) return s;
    // Relative /images/ paths need the backend base
    if (s.startsWith('/images/')) return `${API_BASE}${s}`;
    return s;
  };

  const isValidSrc = (s?: string) => {
    if (!s) return false;
    if (s.startsWith('http://') || s.startsWith('https://')) return true;
    if (s.startsWith('/') && !s.startsWith('/src/')) return true;
    return false;
  };

  const resolvedSrc = resolveUrl(currentSrc);
  const showFallback = !isValidSrc(resolvedSrc) || status === 'error';

  if (showFallback) {
    return (
      <div
        className={`bg-gradient-to-br ${gradients[type] || gradients.workshop} flex flex-col items-center justify-center gap-2 ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-3xl opacity-60">{icons[type] || '🖼️'}</span>
        <span className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase">{alt.slice(0, 30)}</span>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <div className={`bg-gradient-to-br ${gradients[type] || gradients.workshop} animate-pulse absolute inset-0 ${className}`} />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={`${className} ${status === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setStatus('loading');
          } else {
            setStatus('error');
          }
        }}
        {...props}
      />
    </>
  );
};

export default ImageFallback;

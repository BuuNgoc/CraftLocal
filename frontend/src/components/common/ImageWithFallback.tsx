import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = '/images/fallback-product.jpg',
  alt,
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  // Sync internal state when prop changes
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const resolveUrl = (urlStr?: string) => {
    if (!urlStr) return '';
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      return urlStr;
    }
    
    // Prefix relative backend images
    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
    if (urlStr.startsWith('/images/')) {
      return `${API_BASE}${urlStr}`;
    }
    return urlStr;
  };

  const resolvedSrc = resolveUrl(currentSrc || fallbackSrc);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      {...props}
    />
  );
};

export default ImageWithFallback;
